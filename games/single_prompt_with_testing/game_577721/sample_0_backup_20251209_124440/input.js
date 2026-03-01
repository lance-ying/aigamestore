/**
 * Input Handling System
 * 
 * Manages keyboard inputs, tracks key states, and maps inputs to game actions.
 * Supports both human input and automated testing controller injection.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key State Tracker
const keys = {};
const keyPressedOnce = {};

// Key Constants
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

/**
 * Register a key press event
 * @param {object} p - p5 instance
 */
export function handleKeyPress(p) {
    keys[p.keyCode] = true;
    keyPressedOnce[p.keyCode] = true;
    
    // Log input for debugging/replay
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'press',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Control
    handlePhaseControl(p);
}

/**
 * Register a key release event
 * @param {object} p - p5 instance
 */
export function handleKeyRelease(p) {
    keys[p.keyCode] = false;
    
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'release',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Check if a specific key is currently held down
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    // If in automated testing mode, override input
    if (gameState.controlMode !== 'HUMAN') {
        const action = get_automated_testing_action(gameState);
        if (action && action.keys) {
            return action.keys.includes(keyCode);
        }
    }
    return keys[keyCode] === true;
}

/**
 * Check if a key was pressed exactly on this frame (buffered)
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function wasKeyPressed(keyCode) {
    if (gameState.controlMode !== 'HUMAN') {
         const action = get_automated_testing_action(gameState);
        if (action && action.press === keyCode) {
            return true;
        }
    }
    
    const wasPressed = keyPressedOnce[keyCode] === true;
    // We do not clear here, we clear at end of frame
    return wasPressed;
}

/**
 * Clear the "pressed once" buffer at the end of the game loop
 */
export function clearInputBuffer() {
    for (const key in keyPressedOnce) {
        keyPressedOnce[key] = false;
    }
}

/**
 * Handle state transitions based on input (Start, Pause, Restart)
 * @param {object} p - p5 instance
 */
function handlePhaseControl(p) {
    const code = p.keyCode;

    // START -> PLAYING
    if (gameState.gamePhase === "START" && code === KEYS.ENTER) {
        gameState.gamePhase = "PLAYING";
        logPhaseChange(p, "PLAYING");
    }

    // PLAYING <-> PAUSED
    else if (code === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logPhaseChange(p, "PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logPhaseChange(p, "PLAYING");
        }
    }

    // GAME_OVER -> START
    else if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && code === KEYS.R) {
        // Full reset is handled in game.js by checking this transition
        gameState.gamePhase = "START"; 
        logPhaseChange(p, "START");
    }
}

function logPhaseChange(p, newPhase) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            event: 'phase_change',
            newPhase: newPhase,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
}