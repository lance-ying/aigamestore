"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateRecorderScript } from "@/lib/utils/recorder-script";
import type { RecorderMessage } from "@/lib/types/gameplay";
import { uploadSessionFilesClient } from "@/lib/firebase/client-storage";

interface GamePlayerProps {
  gameId: string;
  gameTitle: string;
  prolificId?: string; // Optional - Prolific participant ID
  modelId?: string; // Optional - AI model ID for tracking
  enableRecording?: boolean; // Optional - enable/disable recording
  onStatusChange?: (status: { aps: number; recordingStatus: 'idle' | 'recording' | 'uploading' | 'uploaded' | 'error'; handleEndGame: () => void }) => void;
  onPlayStart?: () => void; // Optional - callback when user starts playing
  onReady?: (methods: { endGame: () => void }) => void; // Optional - callback when player is ready with methods
}

export default function GamePlayer({
  gameId,
  gameTitle,
  prolificId,
  modelId,
  enableRecording = true, // Enable recording by default
  onStatusChange,
  onPlayStart,
  onReady
}: GamePlayerProps) {
  // Use prolificId as userId if available, otherwise use demo_user
  const userId = prolificId || 'demo_user';
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [currentAPS, setCurrentAPS] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [iframeKey, setIframeKey] = useState(Date.now()); // Force fresh iframe load
  const navigationStartedRef = useRef(false);
  const playStartedRef = useRef(false); // Track if play has started
  const sessionCreatedRef = useRef(false); // Prevent duplicate session creation

  // Per-key rate limit tracking (each key gets 10 actions/sec)
  const rateLimitRef = useRef<{
    [key: string]: {
      lastAllowedTime: number;
      actionsInWindow: number[];
      windowStart: number;
    };
  }>({});

  // Track all successful actions across all keys for APS display
  const successfulActionsRef = useRef<number[]>([]);
  const apsWindowStartRef = useRef(Date.now());

  // Helper function to check if action should be allowed (per-key throttling)
  const canPerformAction = (keyIdentifier: string): boolean => {
    const now = Date.now();
    const minInterval = 100; // 100ms between actions = 10 per second max
    
    // Initialize tracking for this key if needed
    if (!rateLimitRef.current[keyIdentifier]) {
      rateLimitRef.current[keyIdentifier] = {
        lastAllowedTime: 0,
        actionsInWindow: [],
        windowStart: now
      };
    }
    
    const keyData = rateLimitRef.current[keyIdentifier];
    
    // Check if enough time has passed since last action for this key
    if (now - keyData.lastAllowedTime < minInterval) {
      return false; // Too soon, throttle this action
    }
    
    // Reset window if 1 second has passed
    if (now - keyData.windowStart >= 1000) {
      keyData.actionsInWindow = [];
      keyData.windowStart = now;
    }
    
    // Check if we're under the limit for this key
    if (keyData.actionsInWindow.length >= 10) {
      return false; // At limit for this key
    }
    
    // Allow the action
    keyData.lastAllowedTime = now;
    keyData.actionsInWindow.push(now);
    
    return true;
  };

  // Record successful action for APS meter
  const recordSuccessfulAction = () => {
    const now = Date.now();
    
    // Reset window every second
    if (now - apsWindowStartRef.current >= 1000) {
      successfulActionsRef.current = [];
      apsWindowStartRef.current = now;
    }
    
    successfulActionsRef.current.push(now);
  };

  // Update APS display periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean old actions from tracking (older than 1 second)
      successfulActionsRef.current = successfulActionsRef.current.filter(
        time => now - time < 1000
      );
      
      setCurrentAPS(successfulActionsRef.current.length);
    }, 50); // Update every 50ms for smooth display

    return () => clearInterval(updateInterval);
  }, []);

  // Create session when component mounts (if recording enabled)
  useEffect(() => {
    if (!enableRecording) return;

    // Prevent duplicate session creation (React Strict Mode runs effects twice)
    if (sessionCreatedRef.current) {
      console.log('[GamePlayer] Session already created, skipping duplicate');
      return;
    }
    

    const createSession = async () => {
      try {
        sessionCreatedRef.current = true; // Mark as created before the request

        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, gameId, prolificId, modelId }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          console.log('[GamePlayer] Session created:', data.sessionId);
        } else {
          console.error('[GamePlayer] Failed to create session');
          setRecordingStatus('error');
          sessionCreatedRef.current = false; // Reset on failure so it can retry
        }
      } catch (error) {
        console.error('[GamePlayer] Error creating session:', error);
        setRecordingStatus('error');
        sessionCreatedRef.current = false; // Reset on failure so it can retry
      }
    };

    createSession();
  }, [gameId, userId, enableRecording, prolificId, modelId]);

  // Handle recording messages from iframe
  useEffect(() => {
    if (!enableRecording || !sessionId) return;

    const handleMessage = async (event: MessageEvent) => {
      const message = event.data;

      if (message.action === 'recorderStarted') {
        setRecordingStatus('recording');
        console.log('[GamePlayer] Recording started with', message.mimeType);
      }

      // Handle real-time score submission from game
      if (message.action === 'scoreSubmitted') {
        console.log('[GamePlayer] Score submitted from game:', message.score);
        // Store in sessionStorage so it persists
        if (message.sessionId) {
          sessionStorage.setItem(`score_${message.sessionId}`, message.score);
        }
      }

      if (message.action === 'recordingComplete') {
        console.log('[GamePlayer] ✓ recordingComplete message received from iframe');
        console.log('[GamePlayer] Message contents:', {
          sessionId: message.sessionId,
          score: message.score,
          hasVideo: !!message.video,
          hasInputs: !!message.inputs,
          hasScores: !!message.scores,
          hasMetadata: !!message.metadata,
          hasLogs: !!message.logs,
          videoSize: message.video?.size || 0,
        });
        setRecordingStatus('uploading');
        console.log('[GamePlayer] Recording complete, uploading directly to Firebase Storage...');

        try {
          // Validate required files exist
          if (!message.video || !message.inputs || !message.scores || !message.metadata) {
            throw new Error('Missing required files in recordingComplete message');
          }

          // Parse metadata and scores BEFORE upload (to catch parsing errors early)
          let metadataJson: any = {};
          let score: number | null = null;
          let scoreTimeSeries: any[] | null = null;
          
          try {
            const metadataText = await message.metadata.text();
            metadataJson = JSON.parse(metadataText);
            console.log('[GamePlayer] ✓ Metadata parsed successfully');
          } catch (error) {
            console.error('[GamePlayer] Error parsing metadata:', error);
            // Continue with empty metadata rather than failing completely
            metadataJson = { duration: 0, deviceInfo: {} };
          }

          try {
            const scoresText = await message.scores.text();
            const scoresJson = JSON.parse(scoresText);
            score = scoresJson.finalScore || null;
            scoreTimeSeries = scoresJson.scoreTimeSeries || null;
            console.log('[GamePlayer] ✓ Scores parsed successfully, finalScore:', score);
          } catch (error) {
            console.error('[GamePlayer] Error parsing scores:', error);
            // Continue with null scores rather than failing completely
            score = null;
            scoreTimeSeries = null;
          }

          // Prepare files for upload
          const files: {
            video: Blob;
            inputs: Blob;
            scores: Blob;
            metadata: Blob;
            logs?: Blob;
            ratings?: Blob;
          } = {
            video: message.video,
            inputs: message.inputs,
            scores: message.scores,
            metadata: message.metadata,
          };

          if (message.logs) {
            files.logs = message.logs;
            console.log('[GamePlayer] Including game logs in upload');
          }

          // Upload directly to Firebase Storage with timeout
          console.log('[GamePlayer] Starting file uploads...');
          const uploadPromise = uploadSessionFilesClient(
            message.sessionId,
            userId,
            gameId,
            files
          );
          
          // Add timeout to prevent hanging (60 seconds)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout after 60 seconds')), 60000);
          });
          
          const urls = await Promise.race([uploadPromise, timeoutPromise]) as Awaited<ReturnType<typeof uploadSessionFilesClient>>;
          console.log('[GamePlayer] ✓ Files uploaded to Firebase Storage');

          const extractedDeviceInfo = metadataJson.deviceInfo || {};
          const deviceInfo = {
            userAgent: extractedDeviceInfo.userAgent || metadataJson.userAgent || '',
            screenWidth: extractedDeviceInfo.screenWidth || metadataJson.screenWidth || 0,
            screenHeight: extractedDeviceInfo.screenHeight || metadataJson.screenHeight || 0,
            screenDepth: extractedDeviceInfo.screenDepth,
            screenPixelDepth: extractedDeviceInfo.screenPixelDepth,
            devicePixelRatio: extractedDeviceInfo.devicePixelRatio,
            timezone: extractedDeviceInfo.timezone,
            language: extractedDeviceInfo.language,
            hardwareConcurrency: extractedDeviceInfo.hardwareConcurrency,
            deviceMemory: extractedDeviceInfo.deviceMemory,
            maxTouchPoints: extractedDeviceInfo.maxTouchPoints,
            platform: extractedDeviceInfo.platform,
            vendor: extractedDeviceInfo.vendor,
            ip: extractedDeviceInfo.ip || null,
          };

          // Update Firestore with URLs and metadata via API (with timeout)
          console.log('[GamePlayer] Updating Firestore...');
          const updatePromise = fetch('/api/sessions/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: message.sessionId,
              urls: {
                videoUrl: urls.videoUrl,
                inputsUrl: urls.inputsUrl,
                scoresUrl: urls.scoresUrl,
                metadataUrl: urls.metadataUrl,
                logsUrl: urls.logsUrl,
              },
              metadata: {
                duration: metadataJson.duration || 0,
                deviceInfo,
              },
              score,
              scoreTimeSeries,
              prolificId,
              modelId,
            }),
          });
          
          // Add timeout to prevent hanging (30 seconds)
          const updateTimeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => reject(new Error('Firestore update timeout after 30 seconds')), 30000);
          });
          
          const updateResponse = await Promise.race([updatePromise, updateTimeoutPromise]);

          if (updateResponse.ok) {
            setRecordingStatus('uploaded');
            console.log('[GamePlayer] ✓ Firestore updated successfully');
          } else {
            console.warn('[GamePlayer] ⚠ Files uploaded but Firestore update failed:', updateResponse.status);
            // Still mark as uploaded since files are in storage
            setRecordingStatus('uploaded');
          }
        } catch (error) {
          setRecordingStatus('error');
          console.error('[GamePlayer] Error uploading:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Log all messages for debugging
    const debugMessageHandler = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && event.data.action) {
        console.log('[GamePlayer] Message received:', event.data.action, event.data);
      }
    };
    window.addEventListener('message', debugMessageHandler);
    return () => {
      window.removeEventListener('message', handleMessage);
      // Note: debugMessageHandler is intentionally not removed to help with debugging
    };
  }, [sessionId, userId, gameId, enableRecording]);

  // Inject base tag as early script before other scripts load
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Inject a script that sets the base URL early
        // This runs before module scripts and fixes relative paths
        const earlyScript = iframeDoc.createElement('script');
        earlyScript.textContent = `
          // Inject base tag as the very first thing
          if (!document.querySelector('base')) {
            const baseTag = document.createElement('base');
            baseTag.href = '${`/games/${gameId}/`}';
            document.head.insertBefore(baseTag, document.head.firstChild);
          }
        `;

        // Insert at the very beginning of head
        if (iframeDoc.head) {
          iframeDoc.head.insertBefore(earlyScript, iframeDoc.head.firstChild);
        }

        console.log('[GamePlayer] Early base tag script injected');
      } catch (error) {
        console.error('[GamePlayer] Failed to inject base tag script:', error);
      }
    };

    // Use a MutationObserver to catch the iframe load very early
    const observer = new MutationObserver(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc && iframeDoc.head) {
          handleIframeLoad();
          observer.disconnect();
        }
      } catch (e) {
        // Ignore errors during observation
      }
    });

    // Also listen to load event
    iframe.addEventListener('load', handleIframeLoad);

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
      observer.disconnect();
    };
  }, [gameId]);

  // Hide UI and detect canvas size
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupUI = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Check if styles already injected to avoid duplicates
        if (iframeDoc.getElementById('game-player-styles')) {
          console.log('[GamePlayer] CSS already injected, skipping');
          return;
        }

        // Inject CSS to hide everything except the canvas
        const style = iframeDoc.createElement('style');
        style.id = 'game-player-styles'; // Add ID to prevent duplicates
        style.textContent = `
          /* Hide ONLY experiment-specific UI elements, NOT game UI */
          #gameTitle,
          #gameDescription,
          #gameControls,
          .control-buttons,
          .control-button {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }

          /* Reset body to center the canvas */
          /* Some games use flex-direction: column, so allow that */
          body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #000 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            min-height: 100vh !important;
            width: 100vw !important;
          }

          /* Make ALL canvases visible - game canvas and UI overlay canvases */
          /* Game canvas will be scaled, UI canvases keep their inline styles */
          canvas {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Main game canvas (Three.js renderer) - scale to fill container */
          #game-container > canvas:first-child,
          #gameContainer > canvas:first-child {
            margin: 0 auto !important;
            position: relative !important;
            left: auto !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
            z-index: 1 !important;
          }

          /* Ensure canvas parents are visible and fill space */
          main,
          #defaultCanvas0,
          #gameContainer,
          #game-container {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            left: auto !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            height: 100% !important;
            /* Ensure stacking context for UI overlays */
            z-index: 0 !important;
          }
          
          /* #wrapper should be block (not flex) to preserve game's layout */
          #wrapper {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            left: auto !important;
            width: auto !important;
            height: auto !important;
          }

          /* UI overlay canvases (start screens, HUD) are appended to #game-container */
          /* They have inline styles with position: absolute */
          /* Ensure they're visible and appear ABOVE the game canvas */
          #game-container canvas:not(:first-child),
          #gameContainer canvas:not(:first-child) {
            /* UI overlay canvas - ensure visible and above game canvas */
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: absolute !important;
            z-index: 100 !important;
            top: 0 !important;
            left: 0 !important;
            pointer-events: none !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          /* Also target any canvas with absolute positioning (UI overlays) */
          canvas[style*="position: absolute"],
          canvas[style*="position:absolute"] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
          }

          /* Allow game UI elements (text, buttons, divs) to be visible and appear above canvas */
          /* Game UI should have higher z-index to appear above canvas */
          div:not(#gameTitle):not(#gameDescription):not(#gameControls):not(.control-buttons),
          h1:not(#gameTitle),
          h2:not(#gameTitle),
          h3:not(#gameTitle),
          h4, h5, h6,
          p:not(#gameDescription):not(#gameControls),
          button:not(.control-button),
          span,
          label,
          input,
          select {
            position: relative !important;
            z-index: 10 !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
          }
        `;
      
      // Insert as first child to ensure it loads early
      if (iframeDoc.head.firstChild) {
        iframeDoc.head.insertBefore(style, iframeDoc.head.firstChild);
      } else {
        iframeDoc.head.appendChild(style);
      }
      
      console.log('[GamePlayer] CSS injected');

      // Detect canvas and set size - wait a bit for game to initialize
      let attempts = 0;
      const maxAttempts = 60; // Increased attempts (6 seconds)

      const checkInterval = setInterval(() => {
        const canvas = iframeDoc.querySelector('canvas');

        if (canvas) {
          // Get computed style to check for CSS-defined dimensions
          const computedStyle = iframe.contentWindow?.getComputedStyle(canvas);
          if (computedStyle) {
            const cssWidth = parseInt(computedStyle.width) || 0;
            const cssHeight = parseInt(computedStyle.height) || 0;
            
            // Try multiple ways to get canvas dimensions
            const canvasWidth = cssWidth || canvas.offsetWidth || canvas.width || 0;
            const canvasHeight = cssHeight || canvas.offsetHeight || canvas.height || 0;
            
            if (canvasWidth >= 400 && canvasHeight >= 300) {
              clearInterval(checkInterval);
              
              // Calculate responsive size based on viewport
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              
              // Calculate available space accounting for sidebars and padding
              // Sidebar widths: 288px (lg) or 320px (xl) each = ~600px total + padding
              const sidebarWidth = viewportWidth >= 1280 ? 640 : 576; // xl vs lg breakpoint
              const horizontalPadding = 80;
              const verticalReserved = 180; // Header + bottom elements
              
              const availableWidth = Math.max(viewportWidth - sidebarWidth - horizontalPadding, 500);
              const availableHeight = Math.max(viewportHeight - verticalReserved, 400);
              
              // Maintain canvas aspect ratio
              const aspectRatio = canvasWidth / canvasHeight;
              let containerWidth = availableWidth;
              let containerHeight = availableWidth / aspectRatio;
              
              // If height exceeds available space, constrain by height instead
              if (containerHeight > availableHeight) {
                containerHeight = availableHeight;
                containerWidth = availableHeight * aspectRatio;
              }
              
              // Cap at reasonable maximums
              containerWidth = Math.min(containerWidth, 1200);
              containerHeight = Math.min(containerHeight, 800);
              
              // Ensure minimum playable size
              containerWidth = Math.max(containerWidth, 500);
              containerHeight = Math.max(containerHeight, 400);
              
              console.log('[GamePlayer] Canvas detected:', { 
                canvasWidth, 
                canvasHeight, 
                containerWidth, 
                containerHeight,
                viewportWidth,
                viewportHeight,
                availableWidth,
                availableHeight,
                aspectRatio
              });
              setContainerSize({ width: Math.round(containerWidth), height: Math.round(containerHeight) });
              return;
            }
          }
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.warn('[GamePlayer] Canvas detection timeout, using responsive default');
          // Use responsive default based on viewport
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const sidebarWidth = viewportWidth >= 1280 ? 640 : 576;
          const defaultWidth = Math.min(Math.max(viewportWidth - sidebarWidth - 80, 500), 1000);
          const defaultHeight = Math.min(Math.max(viewportHeight - 180, 400), 700);
          setContainerSize({ width: defaultWidth, height: defaultHeight });
        }
      }, 100);

      return () => clearInterval(checkInterval);
    } catch (error) {
      console.error('[GamePlayer] Could not setup iframe UI:', error);
    }
  };

  // Try multiple times to inject CSS at different delays
  const attempts = [0, 100, 300, 500];
  const timeouts = attempts.map(delay => setTimeout(setupUI, delay));

  iframe.addEventListener('load', setupUI);
  
  return () => {
    iframe.removeEventListener('load', setupUI);
    timeouts.forEach(timeout => clearTimeout(timeout));
  };
}, [gameId, iframeKey]);

  // Inject recorder script AFTER session is created
  useEffect(() => {
    if (!enableRecording || !sessionId) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      console.log('[GamePlayer] Injecting recorder with sessionId:', sessionId);

      const recorderScript = iframeDoc.createElement('script');
      try {
        const scriptContent = generateRecorderScript(gameId, userId, sessionId);
        
        // Validate script syntax before injecting
        try {
          // Try to parse as function to catch syntax errors
          new Function(scriptContent);
        } catch (syntaxError) {
          console.error('[GamePlayer] Generated script has syntax error:', syntaxError);
          console.error('[GamePlayer] Script content (first 500 chars):', scriptContent.substring(0, 500));
          throw new Error(`Recorder script syntax error: ${syntaxError instanceof Error ? syntaxError.message : String(syntaxError)}`);
        }
        
        recorderScript.textContent = scriptContent;
        
        // Log script length for debugging
        console.log('[GamePlayer] Script content length:', scriptContent.length, 'characters');
        
        try {
      iframeDoc.head.appendChild(recorderScript);
          console.log('[GamePlayer] Recorder script injected successfully');
        } catch (appendError) {
          console.error('[GamePlayer] Error during appendChild:', appendError);
          console.error('[GamePlayer] Error details:', {
            message: appendError instanceof Error ? appendError.message : String(appendError),
            stack: appendError instanceof Error ? appendError.stack : undefined
          });
          // Try to inject anyway with a different method
          iframeDoc.body.appendChild(recorderScript);
          console.log('[GamePlayer] Script injected to body as fallback');
        }
      } catch (scriptError) {
        console.error('[GamePlayer] Error generating or injecting recorder script:', scriptError);
        // Try to inject a minimal error handler instead
        const errorScript = iframeDoc.createElement('script');
        const errorMessage = scriptError instanceof Error ? scriptError.message : String(scriptError);
        errorScript.textContent = `console.error('[Recorder] Failed to initialize recorder script:', ${JSON.stringify(errorMessage)});`;
        iframeDoc.head.appendChild(errorScript);
      }
    } catch (error) {
      console.error('[GamePlayer] Failed to inject recorder:', error);
    }
  }, [sessionId, gameId, userId, enableRecording]);


  // Enforce rate limiting on game controls (but let events propagate to iframe for recording)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Notify parent on first interaction
      if (!playStartedRef.current && onPlayStart) {
        playStartedRef.current = true;
        onPlayStart();
        
        // Start recording when timer starts
        if (enableRecording && iframeRef.current?.contentWindow) {
          console.log('[GamePlayer] Sending startRecording message to iframe');
          iframeRef.current.contentWindow.postMessage({ action: 'startRecording' }, '*');
        }
      }

      // Don't process if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Game control keys that should be throttled
      const gameKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
        'w', 'W', 'a', 'A', 's', 'S', 'd', 'D',
        'Enter', 'Escape', 'r', 'R'
      ];

      if (gameKeys.includes(e.key)) {
        // Prevent default scroll behavior for game keys
        e.preventDefault();

        // Create unique identifier for this key
        const keyId = e.key.toLowerCase();

        // Check if this action is allowed (throttled to 10/sec per key)
        if (!canPerformAction(keyId)) {
          // Rate limited - stop propagation
          e.stopPropagation();
          return;
        }

        // Action allowed - record it for APS meter
        recordSuccessfulAction();

        // IMPORTANT: Don't stopPropagation() here - let the event reach the iframe for recording
        // The preventDefault() above only prevents default browser behavior (scrolling), not propagation
      }
    };

    // Attach rate limiting to iframe's document
    const attachToIframe = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
        }
      } catch (error) {
        // Silently ignore if we can't access iframe document
      }
    };

    iframe.addEventListener('load', attachToIframe);
    attachToIframe(); // Try immediately in case already loaded

    return () => {
      iframe.removeEventListener('load', attachToIframe);

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.removeEventListener('keydown', handleKeyDown);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [gameId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts (navigating away from game page)
      const iframe = iframeRef.current;
      if (iframe?.contentWindow && enableRecording) {
        try {
          console.log('[GamePlayer] Component unmounting, stopping recorder');
          iframe.contentWindow.postMessage({ action: 'stopRecording' }, '*');
        } catch (error) {
          console.error('[GamePlayer] Cleanup error:', error);
        }
      }
    };
  }, [enableRecording]);

  // Handle End Game button click
  const handleEndGame = useCallback(() => {
    if (navigationStartedRef.current) return;
    navigationStartedRef.current = true;

    // Check if recording exists and is active
    const hasActiveRecording = recordingStatus === 'recording' || recordingStatus === 'uploading';
    
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow && hasActiveRecording) {
        console.log('[GamePlayer] End Game clicked, stopping recorder');
        iframe.contentWindow.postMessage({ action: 'stopRecording' }, '*');
      }
    } catch (error) {
      console.error('[GamePlayer] Failed to stop recording on End Game:', error);
    }
  }, [recordingStatus]);

  // Update parent component with status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        aps: currentAPS,
        recordingStatus,
        handleEndGame
      });
    }
  }, [currentAPS, recordingStatus, onStatusChange, handleEndGame]);

  // Expose methods to parent via onReady callback
  useEffect(() => {
    if (onReady) {
      onReady({
        endGame: handleEndGame
      });
    }
  }, [onReady, handleEndGame]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center items-center">
      <div
        className="relative overflow-hidden bg-black"
        style={{
          width: '800px',
          height: '600px',
        }}
      >
        <iframe
          key={`${gameId}-${iframeKey}`}
          ref={iframeRef}
          src={`/api/games/${gameId}?t=${iframeKey}`}
          title={gameTitle}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {/* Recording Status Indicator - Hidden */}
      {/* {enableRecording && (
        <div className="absolute top-4 right-4 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono shadow-lg">
          <div className="flex items-center gap-2">
            {recordingStatus === 'recording' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-gray-300">Recording</span>
              </>
            )}
            {recordingStatus === 'uploading' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-gray-300">Uploading...</span>
              </>
            )}
            {recordingStatus === 'uploaded' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-300">Saved</span>
              </>
            )}
            {recordingStatus === 'error' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-400">Error</span>
              </>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}

