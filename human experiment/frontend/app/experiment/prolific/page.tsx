"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProlificIdPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!prolificId.trim()) {
      alert("Please enter your Prolific ID");
      return;
    }

    // Store Prolific ID in localStorage
    localStorage.setItem("prolificId", prolificId.trim());

    // Navigate directly to instructions
    router.push("/experiment/instructions");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white border-2 border-black p-8 space-y-6">
          <h1 className="text-3xl font-bold text-black text-center mb-8">
            Welcome to the Game Rating Study
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="prolificId"
                className="block text-lg font-semibold text-black mb-3"
              >
                Please enter your Prolific ID:
              </label>
              <input
                type="text"
                id="prolificId"
                value={prolificId}
                onChange={(e) => setProlificId(e.target.value)}
                placeholder="Enter your Prolific ID"
                className="w-full px-4 py-3 text-black bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Continue
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-4">
            Your Prolific ID will be used to track your session and ensure you receive credit for participation.
          </p>
        </div>
      </div>
    </div>
  );
}
