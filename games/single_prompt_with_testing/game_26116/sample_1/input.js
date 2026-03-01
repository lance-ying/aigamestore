/**
 * Input Handling System.
 * Manages keyboard events, key states, and phase transitions.
 */

import { gameState } from './globals.js';

// Key Codes
export const KEY = {
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

// Track key states
const keyState = {};
const keyPressedThisFrame = {};

/**
 * Update key state on press
 */
export function handleKeyPressed(p) {
    keyState[p.keyCode] = true;
    keyPressedThisFrame[p.keyCode] = true;

    // Log Input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'press',
            key_code: p.keyCode,
            key: p.key || '',
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Phase Transitions
    if (p.keyCode === KEY.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            if(p.logs) p.logs.game_info.push({ event: "phase_change", to: "PLAYING" });
        }
    }

    if (p.keyCode === KEY.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === KEY.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.shouldReset = true;
        }
    }
}

/**
 * Update key state on release
 */
export function handleKeyReleased(p) {
    keyState[p.keyCode] = false;
    
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'release',
            key_code: p.keyCode,
            key: p.key || '',
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Check if a key is currently held down
 */
export function isKeyDown(keyCode) {
    // Check real keys OR simulated keys (for automated testing)
    return !!keyState[keyCode] || (window.simulatedKeys && !!window.simulatedKeys[keyCode]);
}

/**
 * Check if a key was pressed exactly this frame
 */
export function wasKeyPressed(keyCode) {
    return !!keyPressedThisFrame[keyCode];
}

/**
 * Clear "just pressed" states at end of frame
 */
export function clearInputFrame() {
    for (let key in keyPressedThisFrame) {
        delete keyPressedThisFrame[key];
    }
}