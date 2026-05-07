"use client";

import { useEffect, useState, useRef } from "react";
import { getSession, getRemainingTime } from "@/lib/utils/experiment-session";

interface ExperimentTimerProps {
  gameIndex: number;
  onExpire: () => void;
}

export default function ExperimentTimer({ gameIndex, onExpire }: ExperimentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(2 * 60 * 1000); // 2 minutes in ms
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    hasExpiredRef.current = false;
    
    // Load initial time from session
    const session = getSession();
    if (session) {
      const remaining = getRemainingTime(session, gameIndex);
      setTimeRemaining(remaining);
      
      // If already expired, trigger immediately
      if (remaining === 0) {
        setTimeout(() => {
          hasExpiredRef.current = true;
          onExpire();
        }, 100);
        return;
      }
    }

    // Start countdown - recalculate from session every second for accuracy
    intervalRef.current = setInterval(() => {
      const session = getSession();
      if (session) {
        const remaining = getRemainingTime(session, gameIndex);
        setTimeRemaining(remaining);

        // Check if expired
        if (remaining === 0 && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          setTimeout(() => {
            onExpire();
          }, 100);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameIndex, onExpire]);

  // Format time as MM:SS
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Color based on remaining time (black and white theme)
  const getColorClass = () => {
    if (timeRemaining <= 30000) return "text-gray-500"; // Less than 30 seconds - lighter
    if (timeRemaining <= 60000) return "text-gray-700"; // Less than 1 minute - medium
    return "text-black"; // Full time - darkest
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-center">
      <div className="text-xs text-gray-600 mb-1">Time Remaining</div>
      <div className={`text-3xl font-mono font-bold ${getColorClass()}`}>
        {formattedTime}
      </div>
    </div>
  );
}

