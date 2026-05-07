/**
 * input.js
 * Handles keyboard input, state tracking, and input buffering.
 */

import { gameState, getGameState } from './globals.js';

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

// State of keys currently pressed
const keyState = {};

// Track key presses for one-time actions (like menu navigation)
const keyPressBuffer = {};

/**
 * Setup input listeners.
 * Note: p5.js handles event listeners via p.keyPressed and p.keyReleased,
 * so we delegate to those in game.js, but logic resides here.
 */

export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;
    keyPressBuffer[keyCode] = true;

    // Log Input
    if (p.logs) {
        p.logs.inputs.push({
            type: 'keydown',
            keyCode: keyCode,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Handling
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            startGame();
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
            restartGame();
        }
    }
}

export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
    delete keyPressBuffer[keyCode];
}

/**
 * Checks if a key is currently held down.
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Checks if a key was just pressed (buffered).
 * Clears the buffer for that key after reading.
 */
export function wasKeyPressed(keyCode) {
    if (keyPressBuffer[keyCode]) {
        keyPressBuffer[keyCode] = false; // Consume event
        return true;
    }
    return false;
}

/**
 * Helper to start the game
 */
function startGame() {
    gameState.gamePhase = "PLAYING";
    // Initialize things if needed
}

/**
 * Helper to restart the game
 */
// The initGame function is internal to the p5 sketch in game.js.
// The gameInstance.resetGameFn() already handles resetting and re-initializing.
function restartGame() {
    if (window.gameInstance) {
        // Call the 'resetGame' function defined on the p5 instance itself
        window.gameInstance.resetGame(); 
    }
}