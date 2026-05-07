"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConsentPage() {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAge18, setIsAge18] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [wantsToParticipate, setWantsToParticipate] = useState(false);
  const router = useRouter();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleContinue = () => {
    if (hasScrolledToBottom && isAge18 && hasRead && wantsToParticipate) {
      router.push("/experiment/prolific");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="max-w-4xl w-full mx-auto bg-white border border-gray-300 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Research Study Consent Form</h1>

        <div
          className="h-[500px] overflow-y-auto border border-gray-300 p-6 mb-6 bg-white rounded"
          onScroll={handleScroll}
        >
          <div className="text-sm text-black leading-relaxed">
            <h2 className="text-xl font-bold mb-4 text-black">Welcome to our study!</h2>
            <p className="mb-4">
              By agreeing to this consent form, you agree to participate in a study conducted by researchers from the Massachusetts Institute of Technology (MIT). The purpose of this study is to rate new video games for how fun and playable they are. The results will inform research in artificial intelligence and cognitive science.
            </p>

            <ul className="list-disc list-inside space-y-3 mb-6">
              <li>
                <strong className="text-black">Eligibility:</strong> You must be at least 18 years old to participate.
              </li>
              <li>
                <strong className="text-black">Risks & Benefits:</strong> There are no specific benefits or anticipated risks associated with participation in this study.
              </li>
              <li>
                <strong className="text-black">Voluntary Participation:</strong> Your participation is completely voluntary. You may withdraw at any time by simply exiting the study. You may decline to answer any or all questions. Choosing not to participate or withdrawing will result in no penalty.
              </li>
              <li>
                <strong className="text-black">Anonymity & Data Use:</strong> We record keyboard/mouse interactions and a brief canvas video. Data are anonymous and used for research. Your anonymity is assured; the researchers will not receive any personal information about you. We may release anonymized gameplay data as part of open-source research. Please do not participate unless you are comfortable with your gameplay traces being shared in this way.
              </li>
              <li>
                <strong className="text-black">Contact:</strong> If you have questions about this research, please contact the researchers at{' '}
                <a href="mailto:katiemc@mit.edu" className="text-blue-600 underline hover:text-blue-700">
                  katiemc@mit.edu
                </a>. For questions regarding your rights as a participant, or if problems arise which you do not feel you can discuss with the researchers, please contact the MIT Committee on the Use of Humans as Experimental Subjects (COUHES).
              </li>
              <li>
                <strong className="text-black">Records:</strong> You may print a copy of this consent form for your records.
              </li>
            </ul>

            <p className="text-gray-600 italic">
              Please scroll to the bottom to continue.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {!hasScrolledToBottom && (
            <p className="text-sm text-gray-600">
              Please scroll to the bottom of the consent form to continue
            </p>
          )}

          <div className="flex flex-col space-y-3 w-full">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="age18"
                checked={isAge18}
                onChange={(e) => setIsAge18(e.target.checked)}
                disabled={!hasScrolledToBottom}
                className={`w-5 h-5 mr-3 rounded border-gray-300 ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              />
              <label
                htmlFor="age18"
                className={`text-black ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                I am age 18 or older
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasRead"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                disabled={!hasScrolledToBottom}
                className={`w-5 h-5 mr-3 rounded border-gray-300 ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              />
              <label
                htmlFor="hasRead"
                className={`text-black ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                I have read and understand the information above
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="wantsToParticipate"
                checked={wantsToParticipate}
                onChange={(e) => setWantsToParticipate(e.target.checked)}
                disabled={!hasScrolledToBottom}
                className={`w-5 h-5 mr-3 rounded border-gray-300 ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              />
              <label
                htmlFor="wantsToParticipate"
                className={`text-black ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                I want to participate in this research and continue with the experiment
              </label>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-black border border-gray-300 rounded-lg transition-colors text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!hasScrolledToBottom || !isAge18 || !hasRead || !wantsToParticipate}
              className={`px-8 py-3 rounded font-semibold transition-colors flex-1 border ${
                hasScrolledToBottom && isAge18 && hasRead && wantsToParticipate
                  ? 'bg-black hover:bg-gray-800 text-white border-black cursor-pointer'
                  : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
              }`}
            >
              Agree and Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

