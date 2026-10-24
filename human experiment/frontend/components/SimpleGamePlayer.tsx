"use client";

import { useRef, useState } from "react";

interface SimpleGamePlayerProps {
  gameId: string;
  gameTitle: string;
}

export default function SimpleGamePlayer({
  gameId,
  gameTitle,
}: SimpleGamePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey] = useState(Date.now()); // Force fresh iframe load

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-4xl aspect-video bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <iframe
          key={`${gameId}-${iframeKey}`}
          ref={iframeRef}
          src={`/api/games/${gameId}?t=${iframeKey}`}
          title={gameTitle}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
        />
      </div>
    </div>
  );
}
