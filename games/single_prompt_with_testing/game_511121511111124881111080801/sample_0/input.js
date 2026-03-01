/**
 * Cavern Tale - Input Manager
 * Handles keyboard state tracking and control mapping.
 */

import { gameState } from './globals.js';

// Key Codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

const keyState = {};
const justPressedState = {}; // Track keys pressed this frame

/**
 * Updates global key state on KeyPressed event
 * @param {number} keyCode 
 * @param {Object} p - p5 instance
 */
export function handleKeyDown(keyCode, p) {
    // Only register as "just pressed" if it wasn't already held down
    if (!keyState[keyCode]) {
        justPressedState[keyCode] = true;
    }
    
    keyState[keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'DOWN',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    // Global Game Phase Controls
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
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
            // Trigger restart
            // Reset is handled in game.js main loop usually, or we can flag it
            window.gameInstance.resetGame();
        }
    }
}

/**
 * Updates global key state on KeyReleased event
 * @param {number} keyCode 
 * @param {Object} p - p5 instance
 */
export function handleKeyUp(keyCode, p) {
    keyState[keyCode] = false;
    justPressedState[keyCode] = false; // Clear justPressed on release
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'UP',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

/**
 * Checks if a key is currently held down.
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Checks if a key was pressed specifically on the current frame (trigger once).
 * @param {number} keyCode 
 * @param {number} currentFrame - Ignored in new implementation, kept for compatibility
 * @returns {boolean}
 */
export function isKeyJustPressed(keyCode, currentFrame) {
    return !!justPressedState[keyCode];
}

/**
 * Clears the "just pressed" flags. Should be called at the end of the game loop.
 */
export function clearInputFrame() {
    for (const key in justPressedState) {
        justPressedState[key] = false;
    }
}