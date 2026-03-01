/**
 * Input handling module.
 * Manages keyboard state and maps keys to game actions.
 */

import { gameState } from './globals.js';

// Key Codes
const KEYS = {
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

// State tracking
const keyState = {};
const keyPressedThisFrame = {};

/**
 * Updates the key state when a key is pressed.
 * @param {Object} p - p5 instance
 */
export function handleKeyPressed(p) {
    const code = p.keyCode;
    keyState[code] = true;
    keyPressedThisFrame[code] = true;
    
    // Log Input
    p.logs.inputs.push({
        type: 'press',
        key: p.key,
        keyCode: code,
        frame: p.frameCount,
        time: Date.now()
    });

    // Global Phase Controls
    if (code === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ phase: "PLAYING", time: Date.now() });
        }
    }
    
    if (code === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (code === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart logic is handled in the main loop or via a callback, 
            // but we'll flag a reset here if we had a dedicated reset function exposed, 
            // otherwise the main loop checks this key or state.
            // For this architecture, we usually handle this in the draw loop or game.js
            // checking the input. We will handle it in game.js keyPressed actually.
        }
    }
}

/**
 * Updates the key state when a key is released.
 * @param {Object} p - p5 instance
 */
export function handleKeyReleased(p) {
    const code = p.keyCode;
    keyState[code] = false;
    
    p.logs.inputs.push({
        type: 'release',
        key: p.key,
        keyCode: code,
        frame: p.frameCount,
        time: Date.now()
    });
}

/**
 * Clears the "pressed this frame" buffer.
 * Should be called at the end of the game update loop.
 */
export function clearInputBuffer() {
    for (const key in keyPressedThisFrame) {
        delete keyPressedThisFrame[key];
    }
}

/**
 * Checks if a specific key is currently held down.
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Checks if a specific key was pressed exactly on this frame.
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function wasKeyPressed(keyCode) {
    return !!keyPressedThisFrame[keyCode];
}

// Export Key Constants for use in other files
export { KEYS };