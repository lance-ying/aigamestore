/**
 * input.js
 * Handles keyboard events and translates them into game actions.
 * Supports "Automated Testing" overrides.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key Codes
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

// Internal state for keys
const keyState = {};
const keyPressedThisFrame = {};

/**
 * Update key state on key press
 */
export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;
    keyPressedThisFrame[keyCode] = true;
}

/**
 * Update key state on key release
 */
export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
}

/**
 * Clear "pressed this frame" buffer. Called at end of frame.
 */
export function clearInputBuffer() {
    for (const key in keyPressedThisFrame) {
        keyPressedThisFrame[key] = false;
    }
}

/**
 * Check if a key is currently held down.
 * Accounts for Automated Testing overrides.
 */
export function isKeyDown(keyCode) {
    // Check automation first
    const autoAction = get_automated_testing_action(gameState);
    if (autoAction && autoAction.held && autoAction.held.includes(keyCode)) {
        return true;
    }
    return !!keyState[keyCode];
}

/**
 * Check if a key was pressed specifically on this frame.
 * Accounts for Automated Testing overrides.
 */
export function wasKeyPressed(keyCode) {
    // Check automation first
    const autoAction = get_automated_testing_action(gameState);
    if (autoAction && autoAction.pressed && autoAction.pressed.includes(keyCode)) {
        return true;
    }
    return !!keyPressedThisFrame[keyCode];
}

/**
 * Reset all input states (e.g., on game restart)
 */
export function resetInputs() {
    for (const key in keyState) delete keyState[key];
    for (const key in keyPressedThisFrame) delete keyPressedThisFrame[key];
}