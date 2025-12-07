/**
 * input.js
 * Handles keyboard input and state.
 */

import { gameState } from './globals.js';

export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    Z: 90,
    ENTER: 13,
    ESC: 27,
    R: 82
};

const keyState = {};

export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;
    
    // Phase Transitions
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            // Initialize game logic here if needed, or trigger a restart
            if (!gameState.player) {
                // This might happen if we start fresh
            }
        }
    }
    
    if (keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (keyCode === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Logic to signal a restart is needed
            // We'll handle the actual reset in the main game loop or a specific reset function
            // For now, let's set a flag or call a global reset if exposed
            if (window.resetGame) {
                window.resetGame(p);
            }
            gameState.gamePhase = "START";
        }
    }

    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keydown',
            data: { keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
    
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyup',
            data: { keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

// Helper to clear keys on reset
export function clearKeys() {
    for (let k in keyState) {
        keyState[k] = false;
    }
}