"use client";

import { useState } from "react";
import EndStudyFeedback from "@/components/EndStudyFeedback";

export default function FeedbackTestPage() {
  const [showThankYou, setShowThankYou] = useState(false);

  const handleFeedbackComplete = () => {
    setShowThankYou(true);
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {!showThankYou && (
        <EndStudyFeedback onComplete={handleFeedbackComplete} />
      )}

      {showThankYou && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-black mb-4">
              Thank You!
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              Your feedback has been submitted successfully.
            </p>
          </div>

          <div className="space-y-4 text-black mb-8">
            <p>
              Thank you for your feedback. Your responses will be valuable for our research.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setShowThankYou(false);
                window.location.reload();
              }}
              className="px-6 py-3 bg-black hover:bg-gray-800 text-white border border-black rounded-lg transition-colors font-semibold"
            >
              Submit Another
            </button>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-black border border-gray-400 rounded-lg transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

