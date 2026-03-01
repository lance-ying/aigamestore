/**
 * Rhythm System Logic
 * Handles BPM, beat calculation, and timing windows
 */

import { gameState, BPM, BEAT_MS, INPUT_WINDOW } from './globals.js';

export class RhythmManager {
    constructor() {
        this.beatProgress = 0; // 0 to 1, progress to next beat
    }

    /**
     * Update rhythm state based on current time
     * @param {number} currentTime - Current p5 millis()
     */
    update(currentTime) {
        if (gameState.gamePhase !== 'PLAYING') return;

        if (gameState.startTime === 0) {
            gameState.startTime = currentTime;
            gameState.nextBeatTime = currentTime + BEAT_MS;
        }

        const timeSinceStart = currentTime - gameState.startTime;
        const currentBeatRaw = timeSinceStart / BEAT_MS;
        
        // Check for new beat
        if (Math.floor(currentBeatRaw) > gameState.beatCount) {
            this.onNewBeat();
        }

        gameState.beatCount = Math.floor(currentBeatRaw);
        
        // Calculate progress (0.0 to 1.0) for visualizer
        // We want the pulse to peak exactly at the beat
        // Progress goes from 0 to 1 between beats
        this.beatProgress = currentBeatRaw % 1;
    }

    /**
     * Called exactly when a new beat threshold is crossed
     */
    onNewBeat() {
        // Trigger environment effects, enemy moves, etc.
        // Note: Enemy moves are processed in the game loop based on this flag if needed
        // But typically turn-based roguelikes process enemy turns AFTER player turn.
        // In NecroDancer, if player misses beat, enemies still move.
        
        // We handle enemy movement logic in the main update loop by checking if player acted
        // or if the window passed.
    }

    /**
     * Check if the current time is within the valid input window for the *nearest* beat
     * @param {number} currentTime 
     * @returns {string} "PERFECT", "GOOD", "MISS", or "EARLY"/"LATE" (simplified to boolean or status)
     */
    checkInputTiming(currentTime) {
        if (gameState.startTime === 0) return "MISS";

        const timeSinceStart = currentTime - gameState.startTime;
        const currentBeatFloat = timeSinceStart / BEAT_MS;
        const nearestBeat = Math.round(currentBeatFloat);
        const diff = Math.abs(nearestBeat * BEAT_MS - timeSinceStart);

        // Prevent double input on same beat
        if (nearestBeat === gameState.lastInputBeat) {
            return "ALREADY_ACTED";
        }

        if (diff <= INPUT_WINDOW) {
            gameState.lastInputBeat = nearestBeat;
            return "PERFECT";
        } else {
            // If we are completely off beat
            return "MISS";
        }
    }
    
    /**
     * Get the offset from the nearest beat for visualization (-0.5 to 0.5)
     */
    getBeatOffset() {
         // This is useful for visualizers. 0 means on beat.
         return (this.beatProgress > 0.5) ? this.beatProgress - 1 : this.beatProgress;
    }
}

export const rhythmManager = new RhythmManager();