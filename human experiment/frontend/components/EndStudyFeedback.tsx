"use client";

import { useState } from "react";
import { uploadEndStudyFeedbackClient } from "@/lib/firebase/client-storage";

interface EndStudyFeedbackProps {
  onComplete: () => void;
}

export default function EndStudyFeedback({ onComplete }: EndStudyFeedbackProps) {
  // Feedback state
  const [technicalIssues, setTechnicalIssues] = useState("");
  const [confusingParts, setConfusingParts] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [funCriteria, setFunCriteria] = useState("");

  // Demographics state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [gamingFrequency, setGamingFrequency] = useState("");
  const [gamingExperience, setGamingExperience] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const prolificId = localStorage.getItem("prolificId");
      const userId = prolificId || 'demo_user';

      const feedbackData = {
        prolificId,
        feedback: {
          technicalIssues: technicalIssues || "None",
          confusingParts: confusingParts || "None",
          suggestions: suggestions || "None",
          funCriteria: funCriteria || "None",
        },
        demographics: {
          age: age === "prefer-not-say" ? "Prefer not to say" : age,
          gender: gender === "prefer-not-say" ? "Prefer not to say" : gender,
          gamingFrequency: gamingFrequency === "prefer-not-say" ? "Prefer not to say" : gamingFrequency,
          gamingExperience: gamingExperience === "prefer-not-say" ? "Prefer not to say" : gamingExperience,
        },
      };

      // Upload feedback directly to Firebase Storage
      console.log('[EndStudyFeedback] Uploading feedback to Firebase Storage...');
      await uploadEndStudyFeedbackClient(userId, feedbackData);
      console.log('[EndStudyFeedback] Feedback uploaded successfully');

      onComplete();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError("Failed to submit feedback. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-black mb-3">
          Thank You for Participating!
        </h1>
        <p className="text-gray-700">
          Before we finish, we'd appreciate your feedback on this experience. Your responses will help us improve our research.
        </p>
      </div>

      {/* Technical Issues */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-black font-semibold mb-2">
            Did you encounter any technical issues during the study?
          </label>
          <textarea
            value={technicalIssues}
            onChange={(e) => setTechnicalIssues(e.target.value)}
            placeholder="Please describe any technical issues you faced..."
            rows={3}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black placeholder-gray-400 resize-vertical"
          />
        </div>
      </div>

      {/* Confusing Parts */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-black font-semibold mb-2">
            Was any part of the experiment confusing?
          </label>
          <textarea
            value={confusingParts}
            onChange={(e) => setConfusingParts(e.target.value)}
            placeholder="Please tell us what was confusing or unclear..."
            rows={3}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black placeholder-gray-400 resize-vertical"
          />
        </div>
      </div>

      {/* General Suggestions */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-black font-semibold mb-2">
            Do you have any suggestions or feedback to improve the study?
          </label>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="Your suggestions will help us improve these basic 2D games..."
            rows={3}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black placeholder-gray-400 resize-vertical"
          />
        </div>
      </div>

      {/* Decision Criteria */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-black font-semibold mb-2">
            How did you decide whether a game was fun or not?
          </label>
          <textarea
            value={funCriteria}
            onChange={(e) => setFunCriteria(e.target.value)}
            placeholder="What criteria did you use to evaluate the games?"
            rows={3}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black placeholder-gray-400 resize-vertical"
          />
        </div>
      </div>

      {/* Demographics */}
      <div className="bg-gray-100 border border-gray-400 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-black mb-2">Demographics</h2>
          <p className="text-gray-700 text-sm">
            This information helps us understand our participant pool better. All responses are anonymous.
          </p>
        </div>

        {/* Age */}
        <div>
          <label className="block text-black font-semibold mb-2">Age</label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black bg-white"
          >
            <option value="">Select age range</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55-64">55-64</option>
            <option value="65+">65+</option>
            <option value="prefer-not-say">Prefer not to say</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-black font-semibold mb-2">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black bg-white"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
            <option value="prefer-not-say">Prefer not to say</option>
          </select>
        </div>

        {/* Gaming Frequency */}
        <div>
          <label className="block text-black font-semibold mb-2">
            How often do you play video games?
          </label>
          <select
            value={gamingFrequency}
            onChange={(e) => setGamingFrequency(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black bg-white"
          >
            <option value="">Prefer not to say</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Rarely">Rarely</option>
            <option value="Never">Never</option>
          </select>
        </div>

        {/* Gaming Experience */}
        <div>
          <label className="block text-black font-semibold mb-2">
            How would you rate your experience with video games?
          </label>
          <select
            value={gamingExperience}
            onChange={(e) => setGamingExperience(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-black bg-white"
          >
            <option value="">Prefer not to say</option>
            <option value="Novice">Novice</option>
            <option value="Casual">Casual</option>
            <option value="Experienced">Experienced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border border-black rounded-lg transition-colors font-bold text-lg"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback & Complete Study"}
        </button>
      </div>
    </form>
  );
}
