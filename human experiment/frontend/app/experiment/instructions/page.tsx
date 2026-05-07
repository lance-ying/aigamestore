"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { initializeSession, type Game } from "@/lib/utils/experiment-session";

const INSTRUCTION_PAGES = [
  {
    title: "Experiment Structure",
    content: (
      <div className="space-y-4 text-black text-lg leading-relaxed">
        <p>
          This experiment consists of a sequence of 10 unique games presented consecutively on this screen. Each game is designed to be self-contained and is analogous to the type of simple, skill-based games you might encounter on popular mobile application stores.
        </p>
      </div>
    ),
  },
  {
    title: "Time Commitment and Goal",
    content: (
      <div className="space-y-4 text-black text-lg leading-relaxed">
        <div>
          <p className="font-semibold mb-2">Duration per Game:</p>
          <p>You will be allocated 2 minutes to play each of the 10 games. The interface will automatically transition you to the next game once this time expires.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Total Duration:</p>
          <p>The total completion time for the experiment is approximately 25 minutes.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Primary Objective:</p>
          <p>Your goal is to maximize your performance by achieving the highest possible score or making the maximum possible progress within the strict 2-minute time limit for every game. Focus on efficiency and maximizing output.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Input and Controls",
    content: (
      <div className="space-y-4 text-black text-lg leading-relaxed">
        <div>
          <p className="font-semibold mb-2">Exclusive Input:</p>
          <p>You are strictly required to use only the keyboard keys to control the games. The use of a mouse, trackpad, or any other input device is prohibited for gameplay control.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Game-Specific Controls:</p>
          <p>The specific set of control keys (e.g., WASD, Arrow Keys, Spacebar, Enter) will change for every single game.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Pre-Game Preparation:</p>
          <p>It is necessary that you carefully read the detailed instructions and the specific control scheme provided on the screen before the timer starts for each of the 10 games. Familiarize yourself with the controls before your 2-minute session begins.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Data Collection and Usage",
    content: (
      <div className="space-y-4 text-black text-lg leading-relaxed">
        <div>
          <p className="font-semibold mb-2">Recording:</p>
          <p>Please be aware that your entire session, including all keyboard inputs, screen movements, and in-game performance metrics, will be continuously recorded.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Research Use:</p>
          <p>The recorded gameplay data will be used solely for academic research purposes related to human factors, game design, and digital interaction studies. Your participation is anonymous and confidential.</p>
        </div>
        <div className="bg-red-50 border-2 border-red-500 p-4 rounded-lg mt-4">
          <p className="font-bold text-red-900 mb-2 text-lg">CRITICAL: Do NOT switch tabs!</p>
          <p className="text-red-800 text-sm">Keep this tab active and do <strong>not</strong> switch tabs or minimize the browser during gameplay. This can corrupt video recordings and cause data loss.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Getting Started",
    content: (
      <div className="space-y-4 text-black text-lg leading-relaxed">
        <p>
          When you are ready and have understood these instructions, please click the "Begin Experiment" button below. Good luck, and thank you for your focused effort!
        </p>
      </div>
    ),
  },
];

const COMPREHENSION_QUESTIONS = [
  {
    question: "How many games will you play in this experiment?",
    options: ["5 games", "10 games", "15 games", "20 games"],
    correctAnswer: 1, // Index of "10 games"
  },
  {
    question: "What input device should you use to control the games?",
    options: ["Mouse only", "Keyboard only", "Both mouse and keyboard", "Touchpad only"],
    correctAnswer: 1, // Index of "Keyboard only"
  },
  {
    question: "How long do you have to play each game?",
    options: ["1 minute", "2 minutes", "3 minutes", "5 minutes"],
    correctAnswer: 1, // Index of "2 minutes"
  },
];

// Configuration flags (Note: TEST_PHYSITYPE is now in experiment-session.ts)
const EXCLUDE_GAMES: string[] = []; // Games to exclude from manifest (currently none needed)

export default function InstructionsPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showComprehensionCheck, setShowComprehensionCheck] = useState(false);
  const [comprehensionAnswers, setComprehensionAnswers] = useState<number[]>([-1, -1, -1]);
  const [comprehensionError, setComprehensionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load games manifest from public folder
      const manifestResponse = await fetch('/games-manifest.json');
      if (!manifestResponse.ok) {
        throw new Error('Failed to load games manifest');
      }
      let gamesManifest = await manifestResponse.json();

      // Filter out excluded games from manifest
      if (EXCLUDE_GAMES.length > 0) {
        gamesManifest = gamesManifest.filter((game: any) =>
          !EXCLUDE_GAMES.includes(game.originalName)
        );
      }

      // Load all games and initialize session with random 20 games
      // Transform manifest data to match Game type
      const games: Game[] = gamesManifest.map((game: any) => ({
        id: game.id,
        title: game.title,
        description: game.description || '',
        controls: game.controls || '',
        path: game.path,
        originalName: game.originalName || game.id,
        originalGameName: game.originalGameName,
        originalGameUrl: game.originalGameUrl,
        hidden: game.hidden,
      }));
      const session = await initializeSession(games);

      if (!session) {
        setError("Failed to initialize experiment session. Please try again.");
        setLoading(false);
        return;
      }

      // Navigate to first game
      router.push("/experiment/game/0");
    } catch (err) {
      console.error("Error starting experiment:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleComprehensionSubmit = () => {
    // Check if all questions are answered
    if (comprehensionAnswers.some(answer => answer === -1)) {
      setComprehensionError("Please answer all questions");
      return;
    }

    // Check if all answers are correct
    const allCorrect = comprehensionAnswers.every(
      (answer, index) => answer === COMPREHENSION_QUESTIONS[index].correctAnswer
    );

    if (!allCorrect) {
      // If any answer is wrong, go back to the beginning
      setComprehensionError("One or more answers are incorrect. Please review the instructions and try again.");
      setShowComprehensionCheck(false);
      setCurrentPage(0);
      setComprehensionAnswers([-1, -1, -1]);
      setComprehensionError(null);
      return;
    }

    // All correct - proceed to start experiment
    handleStart();
  };

  const currentInstruction = INSTRUCTION_PAGES[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === INSTRUCTION_PAGES.length - 1;

  // Show comprehension check if enabled
  if (showComprehensionCheck) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="max-w-3xl w-full bg-white border-2 border-black p-8">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-black mb-6 text-center">
              Comprehension Check
            </h1>
            <p className="text-lg text-gray-700 mb-6 text-center">
              Please answer the following questions to ensure you understand the instructions.
            </p>

            <div className="space-y-8">
              {COMPREHENSION_QUESTIONS.map((q, questionIndex) => (
                <div key={questionIndex} className="space-y-3">
                  <label className="block text-lg font-semibold text-black">
                    {questionIndex + 1}. {q.question}
                  </label>
                  <div className="space-y-2">
                    {q.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center space-x-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={optionIndex}
                          checked={comprehensionAnswers[questionIndex] === optionIndex}
                          onChange={() => {
                            const newAnswers = [...comprehensionAnswers];
                            newAnswers[questionIndex] = optionIndex;
                            setComprehensionAnswers(newAnswers);
                            setComprehensionError(null);
                          }}
                          className="w-4 h-4 text-black focus:ring-black"
                        />
                        <span className="text-base text-gray-800">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {comprehensionError && (
              <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-lg">
                <p className="font-semibold">{comprehensionError}</p>
              </div>
            )}

            <div className="flex justify-center pt-6">
              <button
                onClick={handleComprehensionSubmit}
                disabled={loading}
                className="px-8 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? "Starting..." : "Submit Answers"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full bg-white border-2 border-black p-8">
        <div className="space-y-6">
          {/* Page indicator */}
          <div className="flex justify-center items-center space-x-2 mb-4">
            {INSTRUCTION_PAGES.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentPage
                    ? "bg-black"
                    : index < currentPage
                    ? "bg-gray-400"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <h1 className="text-3xl font-bold text-black mb-6 text-center">
            {currentInstruction.title}
          </h1>

          <div className={isFirstPage || isLastPage ? "min-h-[150px]" : "min-h-[300px]"}>
            {currentInstruction.content}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-lg">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {isFirstPage ? (
              <Link
                href="/experiment/prolific"
                className="px-6 py-3 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-lg transition-colors"
              >
                Back
              </Link>
            ) : (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-6 py-3 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-lg transition-colors"
              >
                Previous
              </button>
            )}

            {isLastPage ? (
              <button
                onClick={() => setShowComprehensionCheck(true)}
                className="px-8 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
              >
                Continue to Comprehension Check
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-8 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
