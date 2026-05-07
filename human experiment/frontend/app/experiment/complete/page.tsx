"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/utils/experiment-session";
import EndStudyFeedback from "@/components/EndStudyFeedback";

export default function CompletePage() {
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    // Check if session exists
    const session = getSession();
    if (!session) {
      // No session, redirect to consent
      router.push("/experiment/consent");
      return;
    }
  }, [router]);

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setShowThankYou(true);

    // Clear session after feedback submission
    clearSession();
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {showFeedback && (
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
              You have completed the experimental gaming session.
            </p>
          </div>

          <div className="space-y-4 text-black mb-8">
            <p>
              Thank you for your participation in this research study. Your responses and
              gameplay data will be valuable for our research.
            </p>
            <p>
              If you have any questions or concerns, please don't hesitate to reach out.
            </p>
          </div>

          {/* Completion Code */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-6 mb-8">
            <p className="text-sm text-gray-700 mb-2 font-semibold">
              Your Completion Code:
            </p>
            <div className="text-3xl font-bold text-black tracking-wider bg-white border border-gray-300 rounded py-3 px-6 inline-block">
             C1PRP85D
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Please copy this code and paste it into Prolific to receive credit for your participation.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-black hover:bg-gray-800 text-white border border-black rounded-lg transition-colors font-semibold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


