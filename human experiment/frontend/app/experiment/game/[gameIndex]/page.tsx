"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import GamePlayer from "@/components/GamePlayer";
import GameFeedbackForm from "@/components/GameFeedbackForm";
import {
  getSession,
  advanceToNextGame,
  getRemainingTime,
  GAME_DURATION_MS,
  type Game,
  type ExperimentSession,
} from "@/lib/utils/experiment-session";

export default function GameSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<ExperimentSession | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [prolificId, setProlificId] = useState<string | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_MS);
  const [timerExpired, setTimerExpired] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [recordingStopped, setRecordingStopped] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const gamePlayerRef = useRef<{ endGame: () => void } | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const gameIndex = parseInt(params.gameIndex as string, 10);

  // Load prolificId from localStorage on mount
  useEffect(() => {
    const storedProlificId = localStorage.getItem("prolificId");
    setProlificId(storedProlificId);
  }, []);

  useEffect(() => {
    // Load session from storage
    const loadedSession = getSession();
    
    if (!loadedSession) {
      // No session found, redirect to consent
      router.push("/experiment/consent");
      return;
    }

    // Validate game index
    if (isNaN(gameIndex) || gameIndex < 0 || gameIndex >= loadedSession.games.length) {
      notFound();
      return;
    }

    // Get current game
    const currentGame = loadedSession.games[gameIndex];
    if (!currentGame) {
      notFound();
      return;
    }

    setSession(loadedSession);
    setGame(currentGame);
    setLoading(false);
    setGameLoading(true); // Reset loading state for new game
    setTimerExpired(false); // Reset timer expired state for new game
    setRecordingStopped(false); // Reset recording stopped state
    setRecordingStatus('idle'); // Reset recording status
    setUploadComplete(false); // Reset upload complete state
    setShowFeedback(false); // Reset feedback state
    setFeedbackSubmitted(false); // Reset feedback submitted state
  }, [gameIndex, router]);

  // Handle timer expiration - stop recording and wait for upload
  const handleTimerExpired = useCallback(() => {
    console.log('[GamePage] Timer expired, stopping recording...');
    
    // Stop the recording immediately
    if (gamePlayerRef.current) {
      gamePlayerRef.current.endGame();
      setRecordingStopped(true);
    }
  }, []);

  // Timer countdown effect - only starts when gameLoading is false (user pressed enter)
  useEffect(() => {
    if (!session || gameLoading) {
      // Reset timer to full duration when not playing
      setTimeRemaining(GAME_DURATION_MS);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Start timer countdown - timer should already be initialized by handlePlayStart
    timerIntervalRef.current = setInterval(() => {
      if (!session) return;
      
      const remaining = getRemainingTime(session, gameIndex);
      setTimeRemaining(remaining);

      if (remaining <= 0 && !timerExpired) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        // Timer expired - stop recording and wait for upload
        setTimerExpired(true);
        handleTimerExpired();
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [session, gameIndex, gameLoading, timerExpired, handleTimerExpired]);

  // Callback when user starts playing (first interaction detected by GamePlayer)
  const handlePlayStart = () => {
    if (!session) return;
    
    // Initialize timer start time when play starts
    const updatedSession = { ...session };
    updatedSession.gameTimers[gameIndex] = {
      startTime: Date.now(),
    };
    setSession(updatedSession);
    
    // Set gameLoading to false to start the timer countdown
    setGameLoading(false);
    
    // Initialize time remaining display
    setTimeRemaining(GAME_DURATION_MS);
  };

  const handleNextGameClick = useRef(() => {
    if (!session) return;

    // Check if this is the last game
    if (gameIndex >= session.games.length - 1) {
      router.push("/experiment/complete");
    } else {
      // Advance to next game
      const updatedSession = advanceToNextGame(session);
      setSession(updatedSession);
      router.push(`/experiment/game/${gameIndex + 1}`);
    }
  });

  // Update the ref when session or gameIndex changes
  useEffect(() => {
    handleNextGameClick.current = () => {
      if (!session) return;

      // Check if this is the last game
      if (gameIndex >= session.games.length - 1) {
        router.push("/experiment/complete");
      } else {
        // Advance to next game
        const updatedSession = advanceToNextGame(session);
        setSession(updatedSession);
        router.push(`/experiment/game/${gameIndex + 1}`);
      }
    };
  }, [session, gameIndex, router]);

  const handleNextGame = async () => {
    // If recording hasn't been stopped yet, stop it first
    if (!recordingStopped && gamePlayerRef.current) {
      gamePlayerRef.current.endGame();
      setRecordingStopped(true);
      
      // Wait for upload to complete
      // Wait longer to ensure upload completes and video file is properly finalized
      // This prevents corrupted video files from incomplete MediaRecorder processing
      // Increased wait time to account for:
      // - requestData() flush (500ms)
      // - onstop delay with chunk stabilization (up to 3000ms under heavy load)
      // - Blob creation and upload (2000-3000ms)
      await new Promise(resolve => setTimeout(resolve, 7000)); // Wait 7 seconds for upload
    } else if (recordingStatus === 'uploading') {
      // If still uploading, wait a bit more
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Advance to next game
    handleNextGameClick.current();
  };

  const handleGamePlayerReady = (methods: { endGame: () => void }) => {
    gamePlayerRef.current = methods;
  };

  // Track recording status from GamePlayer
  const handleRecordingStatusChange = (status: { recordingStatus: 'idle' | 'recording' | 'uploading' | 'uploaded' | 'error' }) => {
    setRecordingStatus(status.recordingStatus);
    
    // Once upload completes (or errors), show feedback form
    if (status.recordingStatus === 'uploaded' || status.recordingStatus === 'error') {
      setUploadComplete(true);
      setShowFeedback(true);
    }
  };

  // Handle feedback completion - proceed to next game
  const handleFeedbackComplete = useCallback(() => {
    setFeedbackSubmitted(true);
    // Proceed to next game after feedback is submitted
    // Check if this is the last game
    if (!session) return;
    
    if (gameIndex >= session.games.length - 1) {
      router.push("/experiment/complete");
    } else {
      // Advance to next game
      const updatedSession = advanceToNextGame(session);
      setSession(updatedSession);
      router.push(`/experiment/game/${gameIndex + 1}`);
    }
  }, [session, gameIndex, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game || !session) {
    return null;
  }

  // Show feedback form after upload completes
  if (showFeedback && !feedbackSubmitted) {
    // Generate a consistent sessionId based on participantId, gameIndex, and gameId
    // This matches the format used by GamePlayer: session_${timestamp}_${random}
    const sessionId = `session_${session.participantId}_${gameIndex}_${game.id.replace(/\//g, '_')}`;
    
    return (
      <GameFeedbackForm
        gameTitle={game.title}
        gameId={game.id}
        sessionId={sessionId}
        userId={prolificId || 'anonymous'}
        onComplete={handleFeedbackComplete}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col relative">
      {/* Warning: Do not switch tabs */}
      <div className="absolute top-4 left-4 z-10 bg-red-50 border-2 border-red-500 rounded-lg px-4 py-2">
        <p className="text-red-700 font-bold text-sm">
          ⚠️ Do NOT switch tabs during gameplay!
        </p>
      </div>
      
      {/* Blue warning: If stuck at preparing upload */}
      <div className="absolute top-20 left-4 z-10 bg-blue-50 border-2 border-blue-500 rounded-lg px-4 py-2">
        <p className="text-blue-700 font-bold text-sm">
          ℹ️ If the page is stuck at "preparing upload", please refresh the page and play again!
        </p>
      </div>
      
      {/* Game Counter - Top Right */}
      <div className="absolute top-4 right-4 z-10 bg-white border-2 border-gray-300 rounded-lg px-4 py-2">
        <div className="text-sm">
          <span className="text-gray-600 font-medium">Game:</span>
          <span className="ml-2 font-bold text-gray-900">{gameIndex + 1}/{session.games.length}</span>
        </div>
      </div>

      {/* Main Layout: Centered Game with Description on Left, Controls on Right, Timer at Bottom */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 pt-16 px-8">
        <div className="flex flex-row items-center justify-center w-full max-w-[1600px] mx-auto">
          {/* Left Side - Description (centered vertically) */}
          <div className="w-72 flex-shrink-0 flex items-center justify-end pr-8">
            {game.description && (
              <div className="w-full max-w-sm">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-800 leading-relaxed">{game.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Center - Game Player (centered) */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0">
            {/* Game Player - Centered (hidden when timer expired) */}
            <div className={`flex items-center justify-center ${timerExpired ? 'opacity-0 pointer-events-none' : ''}`} style={timerExpired ? { height: 0, overflow: 'hidden' } : {}}>
              <GamePlayer
                gameId={game.id}
                gameTitle={game.title}
                prolificId={prolificId || undefined}
                enableRecording={true}
                onPlayStart={handlePlayStart}
                onReady={handleGamePlayerReady}
                onStatusChange={handleRecordingStatusChange}
              />
            </div>
          </div>

          {/* Right Side - Controls (centered vertically) */}
          <div className="w-96 flex-shrink-0 flex items-center justify-start pl-8">
            {game.controls && (
              <div className="w-full max-w-md">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Controls</h3>
                  <p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                    {game.controls}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom - Timer and Proceed Button (centered horizontally) */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center mt-8 space-y-4">
          {!timerExpired ? (
            <div className="text-3xl font-mono font-bold text-gray-800">
              {Math.max(0, Math.ceil(timeRemaining / 1000))}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-lg font-semibold text-gray-800">
                Time's up! Recording is being saved...
              </div>
              {!uploadComplete && recordingStatus === 'uploading' && (
                <div className="text-sm text-gray-600">
                  Uploading recording... Please wait.
                </div>
              )}
              {/* Button removed - feedback form will be shown instead after upload completes */}
              {!uploadComplete && recordingStatus !== 'uploading' && recordingStopped && (
                <div className="text-sm text-gray-500 italic">
                  Preparing upload... Please wait.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


