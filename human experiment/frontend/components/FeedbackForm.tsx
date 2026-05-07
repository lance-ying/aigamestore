"use client";

import { useState } from "react";

interface FeedbackFormProps {
  gameName: string;
}

export default function FeedbackForm({ gameName }: FeedbackFormProps) {
  const [username, setUsername] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !feedback.trim()) {
      setErrorMessage("Please fill in all fields");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameName,
          username: username.trim(),
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setStatus("success");
      setUsername("");
      setFeedback("");
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Feedback submission error:", error);
      setStatus("error");
      setErrorMessage("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
          Your Name
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-800 focus:border-gray-700 focus:outline-none text-white placeholder-gray-600"
          disabled={status === "submitting"}
        />
      </div>

      <div>
        <label htmlFor="feedback" className="block text-sm font-medium text-gray-400 mb-2">
          Your Feedback
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="w-full px-4 py-2 rounded bg-gray-900 border border-gray-800 focus:border-gray-700 focus:outline-none text-white placeholder-gray-600 resize-none"
          disabled={status === "submitting"}
        />
      </div>

      {status === "success" && (
        <div className="bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded">
          Thank you for your feedback!
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full px-4 py-3 bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed font-medium rounded transition-colors"
      >
        {status === "submitting" ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}



