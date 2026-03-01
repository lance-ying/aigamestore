/**
 * input.js
 * Handles keyboard input events and maps them to game actions.
 * Supports both human input and automated testing input injection.
 */

import { gameState } from './globals.js';

// Key Codes map
const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32, // Jump
    SHIFT: 16, // Block
    Z: 90,     // Attack
    ENTER: 13, // Start
    ESC: 27,   // Pause
    R: 82      // Restart
};

// Internal key state tracking
const keyState = {};
const keyPressedThisFrame = {};

/**
 * Updates the gameState.input object based on current key states.
 * Should be called once per frame at the start of update.
 * @param {p5} p - The p5 instance
 */
export function handleInput(p) {
    // Reset frame-specific flags
    gameState.input.jump = false;
    gameState.input.attack = false;
    gameState.input.enter = false;
    gameState.input.escape = false;
    gameState.input.restart = false;

    // Handle Human Input
    gameState.input.left = keyState[KEYS.LEFT] || false;
    gameState.input.right = keyState[KEYS.RIGHT] || false;
    gameState.input.up = keyState[KEYS.UP] || false;
    gameState.input.down = keyState[KEYS.DOWN] || false;
    gameState.input.block = keyState[KEYS.SHIFT] || false;
    
    // Triggers (Events that happen once per press)
    if (wasPressed(KEYS.SPACE)) gameState.input.jump = true;
    if (wasPressed(KEYS.Z)) gameState.input.attack = true;
    if (wasPressed(KEYS.ENTER)) gameState.input.enter = true;
    if (wasPressed(KEYS.ESC)) gameState.input.escape = true;
    if (wasPressed(KEYS.R)) gameState.input.restart = true;

    // Clear the "pressed this frame" buffer
    for (let key in keyPressedThisFrame) {
        keyPressedThisFrame[key] = false;
    }
}

// p5.js event hooks (to be called from game.js)
export function onKeyPressed(p, keyCode) {
    keyState[keyCode] = true;
    keyPressedThisFrame[keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'press',
            keyCode: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

export function onKeyReleased(p, keyCode) {
    keyState[keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'release',
            keyCode: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

// Helper to check if a key was just pressed this frame
function wasPressed(keyCode) {
    return keyPressedThisFrame[keyCode] === true;
}