"use client";

interface ExperimentProgressProps {
  currentGame: number;
  totalGames: number;
}

export default function ExperimentProgress({ currentGame, totalGames }: ExperimentProgressProps) {
  const progress = ((currentGame + 1) / totalGames) * 100;

  return (
    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">Progress</span>
        <span className="text-sm font-semibold text-black">
          Game {currentGame + 1} of {totalGames}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        <div
          className="h-full bg-black transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}


