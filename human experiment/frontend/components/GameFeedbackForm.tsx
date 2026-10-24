"use client";

import { useState } from "react";

interface GameFeedbackFormProps {
  gameTitle: string;
  gameId: string;
  sessionId: string;
  userId: string;
  onComplete: () => void;
}

export default function GameFeedbackForm({
  gameTitle,
  gameId,
  sessionId,
  userId,
  onComplete,
}: GameFeedbackFormProps) {
  const [similarGame, setSimilarGame] = useState<number | null>(null); // 0-100 slider (0 = not similar, 100 = very similar)
  const [similarSliderTouched, setSimilarSliderTouched] = useState(false);
  const [playFrequency, setPlayFrequency] = useState<string>("");
  const [funRating, setFunRating] = useState<number | null>(null); // 0-100 slider
  const [challengeRating, setChallengeRating] = useState<number | null>(null); // 0-100 slider
  const [funSliderTouched, setFunSliderTouched] = useState(false);
  const [challengeSliderTouched, setChallengeSliderTouched] = useState(false);
  const [textFeedback, setTextFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (similarGame === null || !playFrequency || funRating === null || challengeRating === null || 
        !similarSliderTouched || !funSliderTouched || !challengeSliderTouched) {
      setError("Please answer all questions and interact with all sliders");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData = {
        gameId,
        gameTitle,
        sessionId,
        userId,
        similarGame,
        playFrequency,
        funRating,
        challengeRating,
        textFeedback: textFeedback.trim() || null,
        timestamp: new Date().toISOString(),
      };

      // Upload feedback to Firebase Storage
      const feedbackBlob = new Blob(
        [JSON.stringify(feedbackData, null, 2)],
        { type: "application/json" }
      );

      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { storage } = await import("@/lib/firebase/config");
      
      if (!storage) {
        throw new Error("Firebase storage not initialized");
      }
      
      const feedbackRef = ref(
        storage,
        `game_feedback/${userId}/${sessionId}/${gameId}/feedback.json`
      );
      
      await uploadBytes(feedbackRef, feedbackBlob, {
        contentType: "application/json",
      });
      
      const feedbackUrl = await getDownloadURL(feedbackRef);
      console.log("[GameFeedbackForm] Feedback uploaded:", feedbackUrl);

      // Also store in Firestore via API
      const response = await fetch("/api/sessions/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          gameId,
          feedback: feedbackData,
          feedbackUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save feedback to database");
      }

      onComplete();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Failed to submit feedback. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white border-2 border-black p-8">
        <h2 className="text-2xl font-bold text-black mb-6">Please provide feedback</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1: Similar game */}
          <div>
            <label className="block text-lg font-semibold text-black mb-3">
              Does this game feel similar to some games that you played?
            </label>
            <p className="text-sm text-gray-700 mb-2">
              0 - nothing like the games I have played
            </p>
            <p className="text-sm text-gray-700 mb-3">
              100 - I have played an identical game before
            </p>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={similarGame ?? 0}
                onChange={(e) => {
                  setSimilarGame(parseInt(e.target.value));
                  setSimilarSliderTouched(true);
                }}
                onMouseDown={() => setSimilarSliderTouched(true)}
                onTouchStart={() => setSimilarSliderTouched(true)}
                className={`w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black ${similarSliderTouched ? 'slider-touched' : ''}`}
              />
              {similarSliderTouched && (
                <div
                  className="absolute top-8 transform -translate-x-1/2 text-sm font-semibold text-black bg-white border-2 border-black rounded px-2 py-1 pointer-events-none"
                  style={{
                    left: `calc(${((similarGame ?? 0) / 100) * 100}% - ${((similarGame ?? 0) / 100) * 16}px)`,
                  }}
                >
                  {similarGame ?? 0}
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Question 2: Play frequency */}
          <div>
            <label className="block text-lg font-semibold text-black mb-3">
              How frequent do you play this style of game?
            </label>
            <select
              value={playFrequency}
              onChange={(e) => setPlayFrequency(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
              required
            >
              <option value="">Select an option</option>
              <option value="never">Never</option>
              <option value="once-a-year">Once a year</option>
              <option value="once-a-month">Once a month</option>
              <option value="once-a-week">Once a week</option>
              <option value="every-day">Every day</option>
            </select>
          </div>

          {/* Question 3: Fun rating */}
          <div>
            <label className="block text-lg font-semibold text-black mb-3">
              How fun is this game?
            </label>
            <p className="text-sm text-gray-700 mb-2">
              0 - Not fun at all
            </p>
            <p className="text-sm text-gray-700 mb-2">
              50 - Somewhat fun
            </p>
            <p className="text-sm text-gray-700 mb-3">
              100 - Extremely fun
            </p>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={funRating ?? 0}
                onChange={(e) => {
                  setFunRating(parseInt(e.target.value));
                  setFunSliderTouched(true);
                }}
                onMouseDown={() => setFunSliderTouched(true)}
                onTouchStart={() => setFunSliderTouched(true)}
                className={`w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black ${funSliderTouched ? 'slider-touched' : ''}`}
              />
              {funSliderTouched && (
                <div
                  className="absolute top-8 transform -translate-x-1/2 text-sm font-semibold text-black bg-white border-2 border-black rounded px-2 py-1 pointer-events-none"
                  style={{
                    left: `calc(${((funRating ?? 0) / 100) * 100}% - ${((funRating ?? 0) / 100) * 16}px)`,
                  }}
                >
                  {funRating ?? 0}
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Question 4: Challenge rating */}
          <div>
            <label className="block text-lg font-semibold text-black mb-3">
              How challenging is this game?
            </label>
            <p className="text-sm text-gray-700 mb-2">
              0 - Not at all challenging
            </p>
            <p className="text-sm text-gray-700 mb-3">
              100 - Extremely challenging
            </p>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={challengeRating ?? 0}
                onChange={(e) => {
                  setChallengeRating(parseInt(e.target.value));
                  setChallengeSliderTouched(true);
                }}
                onMouseDown={() => setChallengeSliderTouched(true)}
                onTouchStart={() => setChallengeSliderTouched(true)}
                className={`w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black ${challengeSliderTouched ? 'slider-touched' : ''}`}
              />
              {challengeSliderTouched && (
                <div
                  className="absolute top-8 transform -translate-x-1/2 text-sm font-semibold text-black bg-white border-2 border-black rounded px-2 py-1 pointer-events-none"
                  style={{
                    left: `calc(${((challengeRating ?? 0) / 100) * 100}% - ${((challengeRating ?? 0) / 100) * 16}px)`,
                  }}
                >
                  {challengeRating ?? 0}
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Question 5: Text feedback */}
          <div>
            <label className="block text-lg font-semibold text-black mb-3">
              Additional feedback (optional) (if something is wrong please let us know here)
            </label>
            <textarea
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              placeholder="Share any additional thoughts about this game..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black resize-y"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded-lg">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {(similarGame === null || !playFrequency || !funSliderTouched || !challengeSliderTouched) ? (
            <div className="w-full px-8 py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg text-center">
              Please answer all questions and interact with both sliders
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback & Continue"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

