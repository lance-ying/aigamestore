/**
 * input.js
 * Handles keyboard input and command queuing.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleInput(p) {
    if (gameState.gamePhase !== "PLAYING") return;

    // AI Control override
    if (gameState.controlMode !== "HUMAN") {
        const aiAction = get_automated_testing_action(gameState);
        if (aiAction) {
             processKey(aiAction.keyCode);
        }
        return; // Don't process keyboard if AI is active
    }
    
    // Human Input is handled via p.keyPressed in game.js pushing to queue indirectly, 
    // but here we can handle polling if needed. 
    // Actually, discrete grid movement is best handled by event (keyPressed).
    // The instructions say "Input handling and keyboard state management".
}

export function handleKeyPress(p) {
    const k = p.keyCode;
    
    // Global controls
    if (k === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (k === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (k === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.reset(); // Reset variables
            gameState.gamePhase = "START";
            // Re-seed manually if we want exact same run, but p5 randomSeed(42) in setup is once.
            // If we want "Same Run" again, we might need to reset seed.
            // Constraint says "No other random seeding". Okay.
        }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === "PLAYING") {
        processKey(k);
    }
}

function processKey(k) {
    let dx = 0;
    let dy = 0;
    let valid = false;

    if (k === 37) { dx = -1; valid = true; } // Left
    if (k === 38) { dy = -1; valid = true; } // Up
    if (k === 39) { dx = 1; valid = true; }  // Right
    if (k === 40) { dy = 1; valid = true; }  // Down
    if (k === 32) { valid = true; }          // Space (Wait: dx=0, dy=0)

    if (valid) {
        // Queue input. 
        // We limit queue size to prevent massive buffered actions
        if (gameState.inputQueue.length < 2) {
            gameState.inputQueue.push({ dx, dy });
        }
    }
}