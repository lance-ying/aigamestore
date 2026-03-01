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
const keyPressFrame = {}; // Track frame a key was pressed (for "just pressed" logic)

/**
 * Updates global key state on KeyPressed event
 * @param {number} keyCode 
 * @param {Object} p - p5 instance
 */
export function handleKeyDown(keyCode, p) {
    keyState[keyCode] = true;
    keyPressFrame[keyCode] = p.frameCount;
    
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
 * @param {number} currentFrame 
 * @returns {boolean}
 */
export function isKeyJustPressed(keyCode, currentFrame) {
    return keyState[keyCode] && keyPressFrame[keyCode] === currentFrame;
}