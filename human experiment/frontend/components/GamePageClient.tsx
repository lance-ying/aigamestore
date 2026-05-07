"use client";

import { useState } from "react";
import Link from "next/link";
import GamePlayer from "@/components/GamePlayer";
import FeedbackForm from "@/components/FeedbackForm";

interface Game {
  id: string;
  title: string;
  description: string;
  controls: string;
  path: string;
  originalName: string;
  originalGameName?: string;
  originalGameUrl?: string;
  hidden?: boolean;
}

interface GamePageClientProps {
  game: Game;
  prolificId?: string;
  modelId?: string;
}

export default function GamePageClient({ game, prolificId, modelId }: GamePageClientProps) {
  const [status, setStatus] = useState<{
    aps: number;
    recordingStatus: 'idle' | 'recording' | 'uploading' | 'uploaded' | 'error';
    handleEndGame: () => void;
  }>({
    aps: 0,
    recordingStatus: 'idle',
    handleEndGame: () => {}
  });

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="max-w-full mx-auto">
          <Link
            href={
              prolificId || modelId
                ? `/?${new URLSearchParams({
                    ...(prolificId && { PROLIFIC_PID: prolificId }),
                    ...(modelId && { MODEL_ID: modelId }),
                  }).toString()}`
                : "/"
            }
            className="text-gray-400 hover:text-white transition-colors inline-block mb-2 text-sm"
          >
            ← Back to Games
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">{game.title}</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 px-3 py-3 mx-auto flex-1 overflow-hidden items-center" style={{ maxWidth: '100vw' }}>
        {/* Left Column - About & Original Game */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-3 overflow-hidden lg:self-stretch">
          {/* About & Controls */}
          {(game.description || game.controls) && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col overflow-hidden flex-1 min-h-0">
              <h2 className="text-lg font-semibold text-white mb-3 flex-shrink-0">About & Controls</h2>
              <div className="space-y-3 overflow-y-auto pr-2 text-base" style={{ minHeight: 0, flex: 1 }}>
                {game.description && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-500 mb-2">About</h3>
                    <p id="about" className="text-gray-400 leading-relaxed">{game.description}</p>
                  </div>
                )}
                {game.controls && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-500 mb-2">Controls</h3>
                    <p id="controls" className="text-gray-400 whitespace-pre-line leading-relaxed">{game.controls}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Original Game Link */}
          {game.originalGameName && game.originalGameUrl && (
            <a
              href={game.originalGameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-2 transition-colors flex-shrink-0"
            >
              <div className="text-xs text-gray-500 mb-0.5">Based on</div>
              <div className="text-xs font-semibold text-white mb-0.5">{game.originalGameName}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                View Original
                <span className="text-gray-600">→</span>
              </div>
            </a>
          )}
        </div>

        {/* Center Column - Game Canvas */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <GamePlayer
            gameId={game.id}
            gameTitle={game.title}
            prolificId={prolificId}
            modelId={modelId}
            onStatusChange={setStatus}
          />
        </div>
        
        {/* Right Column - Feedback Form + End Game + APS */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 overflow-hidden lg:self-stretch flex flex-col gap-3">
          {/* Feedback Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col flex-1 min-h-0">
            <h2 className="text-sm font-bold text-white mb-2 flex-shrink-0">Feedback</h2>
            <div className="overflow-y-auto flex-1 min-h-0">
              <FeedbackForm gameName={game.title} />
            </div>
          </div>

          {/* End Game Button */}
          <button
            onClick={status.handleEndGame}
            disabled={status.recordingStatus === 'uploading'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors duration-200 text-sm flex-shrink-0"
          >
            {status.recordingStatus === 'uploading' ? 'Uploading...' : 'End Game'}
          </button>

          {/* APS Meter */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono shadow-lg flex-shrink-0">
            <div className="text-gray-400 mb-1">
              Actions/sec: <span className={`font-bold ml-1 ${status.aps >= 10 ? 'text-red-400' : status.aps >= 7 ? 'text-yellow-400' : 'text-green-400'}`}>{status.aps}</span><span className="text-gray-600">/10</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden border border-gray-700">
              <div
                className={`h-full transition-all duration-75 ${
                  status.aps >= 10 ? 'bg-red-500' : status.aps >= 7 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(status.aps / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

