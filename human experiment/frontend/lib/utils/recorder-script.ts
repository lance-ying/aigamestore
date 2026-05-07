// Recorder Script Generator
// Generates the script to inject into game iframes for video/input recording

export function generateRecorderScript(
  gameId: string,
  userId: string,
  sessionId: string
): string {
  // Properly escape values to prevent JavaScript injection and syntax errors
  const escapedGameId = JSON.stringify(gameId);
  const escapedUserId = JSON.stringify(userId);
  const escapedSessionId = JSON.stringify(sessionId);
  
  return `
(function() {
  'use strict';

  let recorder = null;
  let stream = null;
  let chunks = [];
  let inputEvents = [];
  let startTime = Date.now();
  let gameScore = null;
  let scoreExplicitlySubmitted = false; // Track if score was set via window.submitScore
  let scoreTimeSeries = [];
  let frameCount = 0;
  let deviceInfo = null;
  let gameLogs = null;
  let sessionMetadata = {
    gameId: ${escapedGameId},
    userId: ${escapedUserId},
    sessionId: ${escapedSessionId}
  };
  let stopTimeoutId = null; // Track timeout for forced stop
  let recordingCompleteSent = false; // Prevent duplicate messages
  let compositeCanvas = null; // Composite canvas for recording (includes UI overlays)
  let compositeContext = null;
  let compositeAnimationFrame = null; // Track animation frame for cleanup

  // Collect device and IP information
  async function collectDeviceInfo() {
    try {
      const info = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenDepth: window.screen.colorDepth,
        screenPixelDepth: window.screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        deviceMemory: navigator.deviceMemory || null,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        platform: navigator.platform,
        vendor: navigator.vendor,
        ip: null
      };

      // Try to fetch IP address from a public API
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json', { mode: 'no-cors' });
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          info.ip = ipData.ip;
          console.log('[Recorder] IP address collected:', info.ip);
        }
      } catch (ipError) {
        console.warn('[Recorder] Could not fetch IP address:', ipError.message);
      }

      deviceInfo = info;
      console.log('[Recorder] Device info collected:', info);
      return info;
    } catch (error) {
      console.error('[Recorder] Error collecting device info:', error);
      return null;
    }
  }

  // Function to get current score from game
  function getCurrentScore() {
    // If score was explicitly submitted via window.submitScore, use that value
    // Otherwise, always check gameState to get the latest score
    if (scoreExplicitlySubmitted && gameScore !== null) {
      return gameScore;
    }
    
    // Try to auto-detect from gameState (always check, even if gameScore was set earlier)
    let gs = null;
    try {
      if (typeof window.getGameState === 'function') {
        gs = window.getGameState();
      } else if (typeof window.gameState !== 'undefined') {
        gs = window.gameState;
      } else {
        // Fallback: look through window object for anything named gameState
        for (const key in window) {
          if (key.toLowerCase().includes('gamestate') && typeof window[key] === 'object') {
            gs = window[key];
            break;
          }
        }
      }
    } catch (e) {
      // Log error for debugging
      if (frameCount > 0 && frameCount % 300 === 0) {
        console.warn('[Recorder] Error accessing gameState:', e);
      }
      return null;
    }
    
    if (!gs) {
      // Try alternative: check if score is exposed directly on window
      if (typeof window.score === 'number') {
        return window.score;
      }
      if (typeof window.getScore === 'function') {
        try {
          const score = window.getScore();
          if (typeof score === 'number') return score;
        } catch (e) {
          // Ignore
        }
      }
      return null;
    }
    
    // Try common score property names in order of preference
    // Log occasionally to debug (every 5 seconds at 30fps = 150 frames)
    if (frameCount > 0 && frameCount % 150 === 0) {
      console.log('[Recorder] Score detection check:', {
        hasGameState: !!gs,
        totalScore: typeof gs.totalScore !== 'undefined' ? gs.totalScore : 'undefined',
        score: typeof gs.score !== 'undefined' ? gs.score : 'undefined',
        levelScore: typeof gs.levelScore !== 'undefined' ? gs.levelScore : 'undefined',
        playerScore: gs.player && typeof gs.player.score !== 'undefined' ? gs.player.score : 'undefined',
        gamePhase: gs.gamePhase || 'undefined',
        allKeys: Object.keys(gs).slice(0, 10) // First 10 keys for debugging
      });
    }
    
    // Try to get score - check multiple property names
    // IMPORTANT: Check if properties exist AND are numbers (including 0)
    let detectedScore = null;
    
    // Check top-level score FIRST (most common pattern - games like kart-tour-3d use this)
    // This should take priority over player.score when both exist
    if ('score' in gs && typeof gs.score === 'number' && !isNaN(gs.score)) {
      detectedScore = gs.score;
    }
    // Special handling for games with both score and totalScore (like royal-kingdom)
    // Prefer score (active gameplay) over totalScore (cumulative across levels)
    else if ('totalScore' in gs && typeof gs.totalScore === 'number' && !isNaN(gs.totalScore)) {
      // If top-level score wasn't found, check totalScore
      detectedScore = gs.totalScore;
    }
    // Check player.score (for games like block-blast that use nested score)
    // Only use this if top-level score doesn't exist
    else if (gs.player && 'score' in gs.player && typeof gs.player.score === 'number' && !isNaN(gs.player.score)) {
      detectedScore = gs.player.score;
    }
    // Check totalScore (some games use this for cumulative score across levels)
    else if ('totalScore' in gs && typeof gs.totalScore === 'number' && !isNaN(gs.totalScore)) {
      detectedScore = gs.totalScore;
    } 
    // Check currentScore
    else if ('currentScore' in gs && typeof gs.currentScore === 'number' && !isNaN(gs.currentScore)) {
      detectedScore = gs.currentScore;
    } 
    // Check levelScore (some games use this)
    else if ('levelScore' in gs && typeof gs.levelScore === 'number' && !isNaN(gs.levelScore)) {
      detectedScore = gs.levelScore;
    }
    // Check finalScore (some games store final score separately)
    else if ('finalScore' in gs && typeof gs.finalScore === 'number' && !isNaN(gs.finalScore)) {
      detectedScore = gs.finalScore;
    }
    
    // If we found a score, return it (even if it's 0 - that's valid)
    // Only return null if we couldn't find any score property
    if (detectedScore !== null) {
      // Log if score is 0 for extended period (might indicate game hasn't started)
      if (detectedScore === 0 && frameCount > 300 && frameCount % 300 === 0) {
        console.warn('[Recorder] Score is still 0 after', Math.round(frameCount / 30), 'seconds. Game phase:', gs.gamePhase);
      }
    } else {
      // Debug: log what we actually found
      if (frameCount > 0 && frameCount % 300 === 0) {
        console.warn('[Recorder] Score property exists but is not a number:', {
          hasScore: 'score' in gs,
          scoreValue: gs.score,
          scoreType: typeof gs.score,
          hasTotalScore: 'totalScore' in gs,
          totalScoreValue: gs.totalScore,
          totalScoreType: typeof gs.totalScore
        });
      }
    }
    
    return detectedScore;
  }

  let trackingActive = true;
  
  // Track score every frame using requestAnimationFrame
  function trackScoreFrame() {
    if (!trackingActive || !recorder || recorder.state === 'inactive') {
      return;
    }
    
    frameCount++;
    const currentScore = getCurrentScore();
    
    // Log first detection and periodically for debugging
    if (frameCount === 1) {
      console.log('[Recorder] First score check - frameCount:', frameCount, 'score:', currentScore);
    } else if (frameCount === 30) {
      console.log('[Recorder] Score after 1 second - frameCount:', frameCount, 'score:', currentScore);
    } else if (frameCount === 150) {
      console.log('[Recorder] Score after 5 seconds - frameCount:', frameCount, 'score:', currentScore);
    }
    
    if (currentScore !== null) {
      // Only add to time series if score changed or every 30 frames (1 second at 30fps)
      const shouldRecord = scoreTimeSeries.length === 0 || 
                         currentScore !== scoreTimeSeries[scoreTimeSeries.length - 1].score ||
                         frameCount % 30 === 0;
      
      if (shouldRecord) {
        scoreTimeSeries.push({
          frame: frameCount,
          timestamp: Date.now(),
          score: currentScore
        });
      }
      
      // Update the latest gameScore (but don't override if it was explicitly submitted)
      // Always update if gameScore is null, or if we got a higher score
      // This ensures we track score increases even if it started at 0
      if (!scoreExplicitlySubmitted && (gameScore === null || currentScore > gameScore)) {
        gameScore = currentScore;
      }
    } else {
      // Log when score is null (gameState not found)
      if (frameCount === 1 || frameCount === 30 || frameCount === 150) {
        console.warn('[Recorder] Score is null at frame', frameCount, '- gameState may not be accessible');
      }
    }
    
    if (trackingActive && recorder && recorder.state !== 'inactive') {
      requestAnimationFrame(trackScoreFrame);
    }
  }

  // Expose score submission function to games (games call: window.submitScore(score))
  window.submitScore = function(score) {
    if (typeof score === 'number') {
      gameScore = score;
      scoreExplicitlySubmitted = true; // Mark as explicitly submitted
      const timestamp = Date.now();
      
      // Add to time series if it's a new value
      if (scoreTimeSeries.length === 0 || score !== scoreTimeSeries[scoreTimeSeries.length - 1].score) {
        scoreTimeSeries.push({
          frame: frameCount,
          timestamp: timestamp,
          score: score
        });
      }
      
      console.log('[Recorder] Game score recorded:', score);
      // Also send to parent immediately for real-time logging
      window.parent.postMessage({
        action: 'scoreSubmitted',
        score: score,
        sessionId: sessionMetadata.sessionId
      }, '*');
    } else {
      console.warn('[Recorder] submitScore called with non-number value:', score);
    }
  };

  // Find all canvases (main WebGL canvas + UI overlay canvases)
  function findAllCanvases() {
    const canvases = [];
    
    // Find container (game-container or gameContainer)
    const container = document.getElementById('game-container') || 
                      document.getElementById('gameContainer') ||
                      document.body;
    
    // Get all canvases in the container
    const allCanvases = container.querySelectorAll('canvas');
    
    // Sort: WebGL canvas (first child) should be first, then UI overlays
    allCanvases.forEach(canvas => {
      canvases.push(canvas);
    });
    
    // If no canvases found in container, try document.querySelector as fallback
    if (canvases.length === 0) {
      const fallbackCanvas = document.querySelector('canvas');
      if (fallbackCanvas) {
        canvases.push(fallbackCanvas);
      }
    }
    
    console.log('[Recorder] Found', canvases.length, 'canvas(es) for recording');
    return canvases;
  }

  // Create composite canvas that combines all canvases
  function createCompositeCanvas(canvases) {
    if (canvases.length === 0) {
      console.warn('[Recorder] No canvases to composite');
      return null;
    }
    
    // Use dimensions from first canvas (main WebGL canvas)
    const mainCanvas = canvases[0];
    const width = mainCanvas.width || mainCanvas.offsetWidth || 800;
    const height = mainCanvas.height || mainCanvas.offsetHeight || 600;
    
    // Create composite canvas - ensure it's completely isolated from display
    const composite = document.createElement('canvas');
    composite.width = width;
    composite.height = height;
    // Make it completely invisible and non-interactive
    composite.style.display = 'none';
    composite.style.position = 'fixed';
    composite.style.top = '-9999px';
    composite.style.left = '-9999px';
    composite.style.pointerEvents = 'none';
    composite.style.visibility = 'hidden';
    composite.style.opacity = '0';
    document.body.appendChild(composite);
    
    const ctx = composite.getContext('2d');
    
    console.log('[Recorder] Created composite canvas:', width, 'x', height);
    return { canvas: composite, context: ctx, width, height };
  }

  // Composite all canvases into one (called every frame during recording)
  function compositeCanvases(canvases, compositeCtx, compositeWidth, compositeHeight) {
    // Clear composite canvas with black background (in case of transparency)
    compositeCtx.fillStyle = '#000000';
    compositeCtx.fillRect(0, 0, compositeWidth, compositeHeight);
    
    // Draw each canvas in order (WebGL first, then UI overlays on top)
    canvases.forEach((canvas, index) => {
      try {
        // Get actual canvas dimensions (use width/height properties, not CSS size)
        const canvasWidth = canvas.width || compositeWidth;
        const canvasHeight = canvas.height || compositeHeight;
        
        // Only draw if canvas has valid dimensions
        if (canvasWidth > 0 && canvasHeight > 0) {
          // Draw canvas to composite, scaling to fit composite dimensions
          compositeCtx.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, compositeWidth, compositeHeight);
        }
      } catch (error) {
        // Some canvases might not be drawable (e.g., if they're in a different origin)
        // Skip them but log a warning only for the first canvas (most important)
        if (index === 0) {
          console.warn('[Recorder] Could not composite canvas', index, ':', error);
        }
      }
    });
  }

  // Capture canvas stream and start recording
  async function startRecording() {
    const canvases = findAllCanvases();
    if (canvases.length === 0) {
      console.warn('[Recorder] No canvas found for recording');
      return;
    }

    // Collect device info at start of recording
    await collectDeviceInfo();

    try {
      const mainCanvas = canvases[0];
      if (!mainCanvas) {
        console.warn('[Recorder] No canvas available for recording');
        return;
      }
      
      // If multiple canvases detected (WebGL + UI overlay), use composite canvas
      if (canvases.length > 1) {
        console.log('[Recorder] Multiple canvases detected, creating composite canvas for recording');
        const composite = createCompositeCanvas(canvases);
        if (composite) {
          compositeCanvas = composite.canvas;
          compositeContext = composite.context;
          
          // Use composite canvas for recording
          stream = compositeCanvas.captureStream(30); // 30 FPS
          
          // Set up animation loop to continuously composite all canvases
          // This runs independently of the game's render loop and only affects the hidden composite canvas
          const compositeLoop = () => {
            // Continue compositing as long as we have a recorder and it's active, or recorder not created yet
            if ((recorder && (recorder.state === 'recording' || recorder.state === 'paused')) || !recorder) {
              // Only composite if canvases are still in the DOM
              if (canvases.length > 0 && canvases[0].isConnected) {
                compositeCanvases(canvases, compositeContext, composite.width, composite.height);
              }
              compositeAnimationFrame = requestAnimationFrame(compositeLoop);
            }
            // If recorder is inactive, stop the loop (cleanup will handle it)
          };
          
          // Start the compositing loop
          compositeAnimationFrame = requestAnimationFrame(compositeLoop);
        } else {
          // Fallback to main canvas if composite creation failed
          console.warn('[Recorder] Failed to create composite canvas, using main canvas only');
          stream = mainCanvas.captureStream(30);
        }
      } else {
        // Single canvas - use it directly
        stream = mainCanvas.captureStream(30); // 30 FPS
      }

      // Try different codecs for compatibility
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];

      let mimeType = mimeTypes.find(type => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch (e) {
          return false;
        }
      }) || 'video/webm';

      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 350000 // 350kbps
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          console.log('[Recorder] Chunk received:', chunks.length, 'total chunks, size:', e.data.size, 'bytes');
        }
      };

      recorder.onstop = () => {
        try {
          // Clear auto-stop timeout if it exists
          if (recorder._autoStopTimeout) {
            clearTimeout(recorder._autoStopTimeout);
          }
          
          // Clear force-complete timeout since onstop fired
          if (stopTimeoutId) {
            clearTimeout(stopTimeoutId);
            stopTimeoutId = null;
          }
          
          // Prevent duplicate processing
          if (recordingCompleteSent) {
            console.log('[Recorder] Recording already completed, ignoring onstop');
            return;
          }

          console.log('[Recorder] Recorder stopped, waiting for final chunks...');
          console.log('[Recorder] Current chunk count:', chunks.length);
          
          // CRITICAL: Wait for final chunk to be processed
          // MediaRecorder may still be processing the last chunk when onstop fires
          // Simple fixed wait - most browsers complete within 1000ms
          setTimeout(() => {
            try {
              console.log('[Recorder] Processing final data with', chunks.length, 'chunks...');
              console.log('[Recorder] Current gameScore:', gameScore);

                // ALWAYS re-check score at the end, even if gameScore was set earlier
                // This ensures we get the final score even if it was 0 initially
                console.log('[Recorder] Final score check - current gameScore:', gameScore);
                console.log('[Recorder] Score time series length:', scoreTimeSeries.length);
                if (scoreTimeSeries.length > 0) {
                  console.log('[Recorder] Last score in time series:', scoreTimeSeries[scoreTimeSeries.length - 1]);
                }
                
                // Re-detect score from gameState (always check, even if gameScore was set)
                let gs = null;
                let finalDetectedScore = null;

                // Try multiple ways to access gameState
                if (typeof window.getGameState === 'function') {
                  try {
                    gs = window.getGameState();
                    console.log('[Recorder] ✓ Found window.getGameState() function');
                  } catch (e) {
                    console.warn('[Recorder] Error calling window.getGameState():', e);
                  }
                } else if (typeof window.gameState !== 'undefined') {
                  gs = window.gameState;
                  console.log('[Recorder] ✓ Found window.gameState object');
                } else {
                  // Fallback: look through window object for anything named gameState
                  for (const key in window) {
                    if (key.toLowerCase().includes('gamestate') && typeof window[key] === 'object') {
                      gs = window[key];
                      console.log('[Recorder] ✓ Found gameState via window.' + key);
                      break;
                    }
                  }
                }

                if (gs) {
                  console.log('[Recorder] gameState object found, attempting auto-detection');
                  console.log('[Recorder] gameState contents:', {
                    totalScore: typeof gs.totalScore !== 'undefined' ? gs.totalScore : 'undefined',
                    score: typeof gs.score !== 'undefined' ? gs.score : 'undefined',
                    levelScore: typeof gs.levelScore !== 'undefined' ? gs.levelScore : 'undefined',
                    playerScore: gs.player && typeof gs.player.score !== 'undefined' ? gs.player.score : 'undefined',
                    gamePhase: gs.gamePhase || 'undefined',
                    allKeys: Object.keys(gs).slice(0, 15)
                  });

                  // Try common score property names
                  if (typeof gs.totalScore === 'number') {
                    finalDetectedScore = gs.totalScore;
                    console.log('[Recorder] ✓ Auto-detected score from gameState.totalScore:', finalDetectedScore);
                  } else if (typeof gs.score === 'number') {
                    finalDetectedScore = gs.score;
                    console.log('[Recorder] ✓ Auto-detected score from gameState.score:', finalDetectedScore);
                  } else if (gs.player && typeof gs.player.score === 'number') {
                    finalDetectedScore = gs.player.score;
                    console.log('[Recorder] ✓ Auto-detected score from gameState.player.score:', finalDetectedScore);
                  } else if (typeof gs.levelScore === 'number') {
                    finalDetectedScore = gs.levelScore;
                    console.log('[Recorder] ✓ Auto-detected score from gameState.levelScore:', finalDetectedScore);
                  } else {
                    console.warn('[Recorder] ✗ Could not auto-detect score from gameState - no score property found');
                  }
                  
                  // Update gameScore if we found a score (even if it's 0, use the detected value)
                  if (finalDetectedScore !== null) {
                    gameScore = finalDetectedScore;
                    console.log('[Recorder] Final score set to:', gameScore);
                  }
                } else {
                  console.warn('[Recorder] ✗ gameState not found - neither window.getGameState() nor window.gameState available');
                  const availableProps = Object.keys(window).filter(k => 
                    k.toLowerCase().includes('game') || k.toLowerCase().includes('score')
                  ).slice(0, 20);
                  console.log('[Recorder] Available window properties:', availableProps);
                }
                
                if (gameScore === null || gameScore === 0) {
                  console.warn('[Recorder] ⚠️ Final score is', gameScore, '- this may indicate the game has not started or player has not scored');
                }

                // Validate we have chunks before creating Blob
                if (chunks.length === 0) {
                  console.error('[Recorder] ERROR: No chunks collected! Cannot create video blob.');
                  console.error('[Recorder] Sending recordingComplete with empty video blob as fallback');
                  // Still send message but with empty video blob
                  recordingCompleteSent = true;
                  const emptyVideoBlob = new Blob([], { type: 'video/webm' });
                  const inputsBlob = new Blob([JSON.stringify({ events: inputEvents }, null, 2)], { type: 'application/json' });
                  const scoresBlob = new Blob([JSON.stringify({ finalScore: gameScore, scoreTimeSeries: scoreTimeSeries || [] }, null, 2)], { type: 'application/json' });
                  const metadataBlob = new Blob([JSON.stringify({
                    sessionId: sessionMetadata.sessionId,
                    gameId: sessionMetadata.gameId,
                    userId: sessionMetadata.userId,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: Math.round((Date.now() - startTime) / 1000),
                    error: 'No video chunks collected'
                  }, null, 2)], { type: 'application/json' });
                  
                  window.parent.postMessage({
                    action: 'recordingComplete',
                    sessionId: sessionMetadata.sessionId,
                    score: gameScore,
                    video: emptyVideoBlob,
                    inputs: inputsBlob,
                    scores: scoresBlob,
                    metadata: metadataBlob,
                    logs: new Blob([JSON.stringify(gameLogs || {}, null, 2)], { type: 'application/json' })
                  }, '*');
                  console.log('[Recorder] ✓ Recording complete message sent (with empty video)');
                  return;
                }
                
                // Log chunk information for debugging
                const totalChunkSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
                const totalSizeMB = (totalChunkSize / (1024*1024)).toFixed(2);
                console.log('[Recorder] Creating video blob from', chunks.length, 'chunks, total size:', totalSizeMB, 'MB');
                
                const videoBlob = new Blob(chunks, { type: 'video/webm' });
                const videoSizeMB = (videoBlob.size / (1024*1024)).toFixed(2);
                console.log('[Recorder] Video blob created, size:', videoSizeMB, 'MB');
                
                // Final score detection if not already set
                if (gameScore === null) {
                  gameScore = getCurrentScore();
                }
                
                // If we have a time series but no final score, use the last score from time series
                if (gameScore === null && scoreTimeSeries.length > 0) {
                  gameScore = scoreTimeSeries[scoreTimeSeries.length - 1].score;
                }
                
                // Try to extract score from game logs as a last resort
                if (gameScore === null || gameScore === 0) {
                  try {
                    // Check p.logs for score information
                    let logs = null;
                    if (window.p && window.p.logs) {
                      logs = window.p.logs;
                    } else if (window.gameInstance && window.gameInstance.logs) {
                      logs = window.gameInstance.logs;
                    } else {
                      const canvas = document.querySelector('canvas');
                      if (canvas && canvas._pInst && canvas._pInst.logs) {
                        logs = canvas._pInst.logs;
                      }
                    }
                    
                    if (logs) {
                      // Look for score in game_info logs
                      if (logs.game_info && Array.isArray(logs.game_info)) {
                        for (let i = logs.game_info.length - 1; i >= 0; i--) {
                          const log = logs.game_info[i];
                          if (log.data && typeof log.data.score === 'number') {
                            gameScore = log.data.score;
                            console.log('[Recorder] Found score in game logs:', gameScore);
                            break;
                          }
                        }
                      }
                      
                      // Also check player_info logs
                      if ((gameScore === null || gameScore === 0) && logs.player_info && Array.isArray(logs.player_info)) {
                        for (let i = logs.player_info.length - 1; i >= 0; i--) {
                          const log = logs.player_info[i];
                          if (typeof log.score === 'number' && log.score > 0) {
                            gameScore = log.score;
                            console.log('[Recorder] Found score in player logs:', gameScore);
                            break;
                          }
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('[Recorder] Error extracting score from logs:', e);
                  }
                }
                
                // Create inputs blob (without score data)
                const inputsBlob = new Blob(
                  [JSON.stringify({
                    events: inputEvents
                  }, null, 2)],
                  { type: 'application/json' }
                );

                // Create separate scores blob with score time series
                const scoresData = {
                  finalScore: gameScore,
                  scoreTimeSeries: scoreTimeSeries.length > 0 ? scoreTimeSeries : []
                };
                const scoresBlob = new Blob(
                  [JSON.stringify(scoresData, null, 2)],
                  { type: 'application/json' }
                );

                // Get canvas dimensions (use composite if available, otherwise main canvas)
                const canvasForDims = compositeCanvas || document.querySelector('canvas');
                const metadata = {
                  sessionId: sessionMetadata.sessionId,
                  gameId: sessionMetadata.gameId,
                  userId: sessionMetadata.userId,
                  startTime: new Date(startTime).toISOString(),
                  endTime: new Date().toISOString(),
                  duration: Math.round((Date.now() - startTime) / 1000),
                  fps: 30,
                  videoWidth: canvasForDims ? (canvasForDims.width || canvasForDims.offsetWidth || 0) : 0,
                  videoHeight: canvasForDims ? (canvasForDims.height || canvasForDims.offsetHeight || 0) : 0,
                  completed: true,
                  deviceInfo: deviceInfo || {
                    userAgent: navigator.userAgent,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    ip: null
                  }
                };

                const metadataBlob = new Blob(
                  [JSON.stringify(metadata, null, 2)],
                  { type: 'application/json' }
                );

                // Capture game logs if available
                // Try multiple ways to access logs (different games use different patterns)
                try {
                  // Pattern 1: p5.js games - window.p.logs
                  if (window.p && window.p.logs) {
                    gameLogs = window.p.logs;
                    console.log('[Recorder] Captured game logs from window.p:', gameLogs);
                  } 
                  // Pattern 2: Some games use window.gameInstance.logs
                  else if (window.gameInstance && window.gameInstance.logs) {
                    gameLogs = window.gameInstance.logs;
                    console.log('[Recorder] Captured game logs from gameInstance:', gameLogs);
                  } 
                  // Pattern 3: Non-p5 games that expose window.logs directly (e.g., fruit-merge)
                  else if (window.logs && typeof window.logs === 'object') {
                    gameLogs = window.logs;
                    console.log('[Recorder] Captured game logs from window.logs:', gameLogs);
                  } 
                  // Pattern 4: p5.js via canvas._pInst
                  else {
                    const canvas = document.querySelector('canvas');
                    if (canvas && canvas._pInst && canvas._pInst.logs) {
                      gameLogs = canvas._pInst.logs;
                      console.log('[Recorder] Captured game logs from canvas._pInst:', gameLogs);
                    } else {
                      console.warn('[Recorder] Could not find game logs in any location');
                      console.warn('[Recorder] Checked: window.p.logs, window.gameInstance.logs, window.logs, canvas._pInst.logs');
                    }
                  }
                } catch (e) {
                  console.warn('[Recorder] Error capturing game logs:', e);
                }

                // Create logs blob
                const logsBlob = new Blob(
                  [JSON.stringify(gameLogs || {}, null, 2)],
                  { type: 'application/json' }
                );

                // Mark as sent to prevent duplicates
                recordingCompleteSent = true;
                
                // Send to parent window
                console.log('[Recorder] Sending recordingComplete message with score:', gameScore, 'and logs');
                window.parent.postMessage({
                  action: 'recordingComplete',
                  sessionId: sessionMetadata.sessionId,
                  score: gameScore,
                  video: videoBlob,
                  inputs: inputsBlob,
                  scores: scoresBlob,
                  metadata: metadataBlob,
                  logs: logsBlob
                }, '*');

              console.log('[Recorder] ✓ Recording complete, data sent to parent');
              const durationSeconds = Math.round((Date.now() - startTime) / 1000);
              console.log('[Recorder] Summary - SessionId:', sessionMetadata.sessionId, ', Score:', gameScore, ', Duration:', durationSeconds, 's');
            } catch (error) {
              console.error('[Recorder] ERROR in onstop setTimeout callback:', error);
              // Try to send a minimal recordingComplete message even on error
              try {
                recordingCompleteSent = true;
                const errorBlob = new Blob([JSON.stringify({ error: String(error) }, null, 2)], { type: 'application/json' });
                window.parent.postMessage({
                  action: 'recordingComplete',
                  sessionId: sessionMetadata.sessionId,
                  score: gameScore || 0,
                  video: chunks.length > 0 ? new Blob(chunks, { type: 'video/webm' }) : new Blob([], { type: 'video/webm' }),
                  inputs: new Blob([JSON.stringify({ events: inputEvents || [] }, null, 2)], { type: 'application/json' }),
                  scores: new Blob([JSON.stringify({ finalScore: gameScore || 0, scoreTimeSeries: scoreTimeSeries || [] }, null, 2)], { type: 'application/json' }),
                  metadata: errorBlob,
                  logs: new Blob([JSON.stringify(gameLogs || {}, null, 2)], { type: 'application/json' })
                }, '*');
                console.log('[Recorder] ✓ Error recovery: Sent recordingComplete message despite error');
              } catch (fallbackError) {
                console.error('[Recorder] CRITICAL: Failed to send recordingComplete even in error recovery:', fallbackError);
              }
            }
          }, 1000); // Wait 1000ms for all chunks to be processed
        } catch (error) {
          console.error('[Recorder] Error in onstop handler:', error);
          // Try to send a minimal message even if onstop setup fails
          try {
            window.parent.postMessage({
              action: 'recordingComplete',
              sessionId: sessionMetadata.sessionId,
              score: gameScore || 0,
              video: new Blob([], { type: 'video/webm' }),
              inputs: new Blob([JSON.stringify({ events: inputEvents || [] }, null, 2)], { type: 'application/json' }),
              scores: new Blob([JSON.stringify({ finalScore: gameScore || 0, scoreTimeSeries: scoreTimeSeries || [] }, null, 2)], { type: 'application/json' }),
              metadata: new Blob([JSON.stringify({ error: 'onstop handler failed', sessionId: sessionMetadata.sessionId }, null, 2)], { type: 'application/json' }),
              logs: new Blob([JSON.stringify({}, null, 2)], { type: 'application/json' })
            }, '*');
            console.log('[Recorder] ✓ Error recovery: Sent minimal recordingComplete message');
          } catch (fallbackError) {
            console.error('[Recorder] CRITICAL: Failed to send recordingComplete in error handler:', fallbackError);
          }
        }
      };

      recorder.onerror = (e) => {
        console.error('[Recorder] MediaRecorder error:', e);
      };

      recorder.start(1000); // Record in 1-second chunks
      console.log('[Recorder] Recording started with', mimeType);

      // Start tracking score every frame
      trackScoreFrame();

      // Notify parent that recording started
      window.parent.postMessage({
        action: 'recorderStarted',
        mimeType
      }, '*');

      // Set 5-minute hard limit - auto-stop recording after 300 seconds
      const recordingTimeout = setTimeout(() => {
        if (recorder && recorder.state !== 'inactive') {
          console.log('[Recorder] 5-minute limit reached, auto-stopping recording');
          recorder.stop();
        }
      }, 300000); // 300 seconds = 5 minutes

      // Store timeout so it can be cleared if manually stopped earlier
      recorder._autoStopTimeout = recordingTimeout;
    } catch (error) {
      console.error('[Recorder] Failed to start recording:', error);
    }
  }

  // Log input events
  function logEvent(type, data) {
    try {
      inputEvents.push({
        timestamp: Date.now(),
        type,
        ...data
      });
    } catch (error) {
      console.error('[Recorder] Error logging event:', error);
    }
  }

  // Keyboard events
  window.addEventListener('keydown', (e) => {
    logEvent('keydown', { key: e.key, code: e.code });
  }, true);

  window.addEventListener('keyup', (e) => {
    logEvent('keyup', { key: e.key, code: e.code });
  }, true);

  // Mouse events
  window.addEventListener('mousedown', (e) => {
    logEvent('mousedown', { x: e.clientX, y: e.clientY, button: e.button });
  }, true);

  window.addEventListener('mouseup', (e) => {
    logEvent('mouseup', { x: e.clientX, y: e.clientY, button: e.button });
  }, true);

  // Throttled mousemove (every 50ms to reduce data)
  let lastMouseMove = 0;
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMouseMove > 50) {
      lastMouseMove = now;
      logEvent('mousemove', { x: e.clientX, y: e.clientY });
    }
  }, true);

  // Listen for start/stop commands from parent
  window.addEventListener('message', (e) => {
    try {
      if (e.data && e.data.action === 'startRecording') {
        console.log('[Recorder] Start command received, starting recording...');
        // Only start if not already recording
        if (!recorder) {
          startRecording();
        }
      } else if (e.data && e.data.action === 'stopRecording') {
        console.log('[Recorder] Stop command received, recorder state:', recorder?.state);
        
        // Prevent duplicate stop commands
        if (recordingCompleteSent) {
          console.log('[Recorder] Recording already completed, ignoring stop command');
          return;
        }
        
        // Stop score tracking immediately
        trackingActive = false;
        
        // Stop compositing loop
        if (compositeAnimationFrame) {
          cancelAnimationFrame(compositeAnimationFrame);
          compositeAnimationFrame = null;
        }
        
        // Clean up composite canvas
        if (compositeCanvas && compositeCanvas.parentNode) {
          compositeCanvas.parentNode.removeChild(compositeCanvas);
          compositeCanvas = null;
          compositeContext = null;
        }
        
        // Stop the canvas stream immediately to prevent new frames
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('[Recorder] Stopped canvas stream track');
          });
        }

        // Function to force complete recording if recorder gets stuck
        const forceCompleteRecording = () => {
          if (recordingCompleteSent) return;
          recordingCompleteSent = true;
          
          console.warn('[Recorder] ⚠️ Force completing recording - recorder may be stuck (common with Three.js games)');
          
          // Manually trigger the onstop handler logic
          // This handles cases where MediaRecorder.onstop never fires
          try {
            console.log('[Recorder] Processing final data with', chunks.length, 'chunks (forced)...');
            
            // Re-check score one final time
            const finalScore = getCurrentScore();
            if (finalScore !== null && (gameScore === null || finalScore > gameScore)) {
              gameScore = finalScore;
            }
            
            // If we have chunks, create video blob
            let videoBlob;
            if (chunks.length > 0) {
              videoBlob = new Blob(chunks, { type: 'video/webm' });
              const videoSizeMB = (videoBlob.size / (1024*1024)).toFixed(2);
              console.log('[Recorder] Video blob created (forced), size:', videoSizeMB, 'MB');
            } else {
              console.warn('[Recorder] No chunks available, creating empty video blob');
              videoBlob = new Blob([], { type: 'video/webm' });
            }
            
            // Create all required blobs
            const inputsBlob = new Blob(
              [JSON.stringify({ events: inputEvents }, null, 2)],
              { type: 'application/json' }
            );
            
            const scoresData = {
              finalScore: gameScore,
              scoreTimeSeries: scoreTimeSeries.length > 0 ? scoreTimeSeries : []
            };
            const scoresBlob = new Blob(
              [JSON.stringify(scoresData, null, 2)],
              { type: 'application/json' }
            );
            
            // Get canvas dimensions (use composite if available, otherwise main canvas)
            const canvasForDims = compositeCanvas || document.querySelector('canvas');
            const metadata = {
              sessionId: sessionMetadata.sessionId,
              gameId: sessionMetadata.gameId,
              userId: sessionMetadata.userId,
              startTime: new Date(startTime).toISOString(),
              endTime: new Date().toISOString(),
              duration: Math.round((Date.now() - startTime) / 1000),
              fps: 30,
              videoWidth: canvasForDims ? (canvasForDims.width || canvasForDims.offsetWidth || 0) : 0,
              videoHeight: canvasForDims ? (canvasForDims.height || canvasForDims.offsetHeight || 0) : 0,
              completed: true,
              forcedComplete: true, // Flag to indicate this was force-completed
              deviceInfo: deviceInfo || {
                userAgent: navigator.userAgent,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                ip: null
              }
            };
            
            const metadataBlob = new Blob(
              [JSON.stringify(metadata, null, 2)],
              { type: 'application/json' }
            );
            
            // Capture game logs if available
            try {
              if (window.p && window.p.logs) {
                gameLogs = window.p.logs;
              } else if (window.gameInstance && window.gameInstance.logs) {
                gameLogs = window.gameInstance.logs;
              } else if (window.logs && typeof window.logs === 'object') {
                gameLogs = window.logs;
              } else {
                const canvas = document.querySelector('canvas');
                if (canvas && canvas._pInst && canvas._pInst.logs) {
                  gameLogs = canvas._pInst.logs;
                }
              }
            } catch (e) {
              console.warn('[Recorder] Error capturing game logs:', e);
            }
            
            const logsBlob = new Blob(
              [JSON.stringify(gameLogs || {}, null, 2)],
              { type: 'application/json' }
            );
            
            // Send to parent window
            console.log('[Recorder] Sending recordingComplete message (forced) with score:', gameScore);
            window.parent.postMessage({
              action: 'recordingComplete',
              sessionId: sessionMetadata.sessionId,
              score: gameScore,
              video: videoBlob,
              inputs: inputsBlob,
              scores: scoresBlob,
              metadata: metadataBlob,
              logs: logsBlob
            }, '*');
            
            console.log('[Recorder] ✓ Recording complete message sent (forced)');
          } catch (error) {
            console.error('[Recorder] ERROR in forceCompleteRecording:', error);
            // Try to send minimal message even on error
            try {
              const errorBlob = new Blob([JSON.stringify({ error: String(error) }, null, 2)], { type: 'application/json' });
              window.parent.postMessage({
                action: 'recordingComplete',
                sessionId: sessionMetadata.sessionId,
                score: gameScore || 0,
                video: chunks.length > 0 ? new Blob(chunks, { type: 'video/webm' }) : new Blob([], { type: 'video/webm' }),
                inputs: new Blob([JSON.stringify({ events: inputEvents || [] }, null, 2)], { type: 'application/json' }),
                scores: new Blob([JSON.stringify({ finalScore: gameScore || 0, scoreTimeSeries: scoreTimeSeries || [] }, null, 2)], { type: 'application/json' }),
                metadata: errorBlob,
                logs: new Blob([JSON.stringify(gameLogs || {}, null, 2)], { type: 'application/json' })
              }, '*');
            } catch (fallbackError) {
              console.error('[Recorder] CRITICAL: Failed to send recordingComplete even in error recovery:', fallbackError);
            }
          }
        };

        // If recorder exists, request any remaining data and stop
        if (recorder && recorder.state !== 'inactive') {
          console.log('[Recorder] Requesting final data before stop');
          // Request any buffered data to be flushed
          try {
            recorder.requestData();
          } catch (reqError) {
            console.warn('[Recorder] requestData failed:', reqError);
          }
          
          // Wait for requestData to trigger ondataavailable, then stop
          setTimeout(() => {
            if (recorder && recorder.state !== 'inactive') {
              console.log('[Recorder] Stopping recorder after data flush');
              try {
                recorder.stop();
              } catch (stopError) {
                console.error('[Recorder] Error stopping recorder:', stopError);
                // If stop fails, force complete immediately
                forceCompleteRecording();
                return;
              }
              
              // Set timeout to force complete if onstop doesn't fire within 5 seconds
              // This handles cases where MediaRecorder gets stuck (common with Three.js)
              if (stopTimeoutId) {
                clearTimeout(stopTimeoutId);
              }
              stopTimeoutId = setTimeout(() => {
                if (!recordingCompleteSent && recorder && recorder.state !== 'inactive') {
                  console.warn('[Recorder] Recorder did not stop within 5 seconds, forcing completion');
                  forceCompleteRecording();
                }
              }, 5000); // 5 second timeout
            }
          }, 200);
        } else if (!recorder) {
          // If recorder doesn't exist yet, wait a bit and try again
          console.log('[Recorder] Recorder not ready yet, waiting...');
          setTimeout(() => {
            if (recorder && recorder.state !== 'inactive') {
              console.log('[Recorder] Stopping recorder after delay');
              try {
                recorder.requestData();
              } catch (reqError) {
                console.warn('[Recorder] requestData failed:', reqError);
              }
              setTimeout(() => {
                if (recorder && recorder.state !== 'inactive') {
                  try {
                    recorder.stop();
                    
                    // Set timeout to force complete if onstop doesn't fire
                    if (stopTimeoutId) {
                      clearTimeout(stopTimeoutId);
                    }
                    stopTimeoutId = setTimeout(() => {
                      if (!recordingCompleteSent && recorder && recorder.state !== 'inactive') {
                        console.warn('[Recorder] Recorder did not stop within 5 seconds, forcing completion');
                        forceCompleteRecording();
                      }
                    }, 5000);
                  } catch (stopError) {
                    console.error('[Recorder] Error stopping recorder:', stopError);
                    forceCompleteRecording();
                  }
                }
              }, 200);
            } else {
              // Recorder still doesn't exist, force complete with empty data
              console.warn('[Recorder] Recorder never initialized, force completing with empty data');
              forceCompleteRecording();
            }
          }, 500);
        } else {
          // Recorder is already inactive, force complete immediately
          console.log('[Recorder] Recorder already inactive, force completing');
          forceCompleteRecording();
        }
      }
    } catch (error) {
      console.error('[Recorder] Error handling message:', error);
    }
  });

  // Wait for startRecording message from parent instead of auto-starting
  // This ensures recording only starts when the timer starts
  console.log('[Recorder] Waiting for startRecording message from parent...');

  console.log('[Recorder] Script initialized for session:', sessionMetadata.sessionId);
})();
`.trim();
}