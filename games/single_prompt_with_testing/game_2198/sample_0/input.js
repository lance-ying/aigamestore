/**
 * input.js
 * Handles keyboard input events and state management.
 * Maps raw key codes to game actions.
 */

import { gameState } from './globals.js';
import { resetGame } from './game.js';

// Key Codes
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_R = 82;

/**
 * Handles the keyPressed event from p5.js
 * @param {object} p - p5 instance
 */
export function handleKeyPressed(p) {
    const keyCode = p.keyCode;
    gameState.keys[keyCode] = true;

    // Log input
    logInput(p, 'press', keyCode);

    // Global Phase Transitions
    switch (gameState.gamePhase) {
        case "START":
            if (keyCode === KEY_ENTER) {
                startGame(p);
            }
            break;

        case "PLAYING":
            if (keyCode === KEY_ESC) {
                gameState.gamePhase = "PAUSED";
                gameState.isPaused = true;
            }
            break;

        case "PAUSED":
            if (keyCode === KEY_ESC) {
                gameState.gamePhase = "PLAYING";
                gameState.isPaused = false;
            }
            break;

        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            if (keyCode === KEY_R) {
                resetGame(p);
                gameState.gamePhase = "START";
            }
            break;
    }
}

/**
 * Handles the keyReleased event from p5.js
 * @param {object} p - p5 instance
 */
export function handleKeyReleased(p) {
    const keyCode = p.keyCode;
    gameState.keys[keyCode] = false;
    logInput(p, 'release', keyCode);
}

/**
 * Checks if a specific action key is currently pressed
 * @param {string} action - 'JUMP'
 * @returns {boolean}
 */
export function isActionPressed(action) {
    if (action === 'JUMP') {
        return gameState.keys[KEY_SPACE] || gameState.keys[KEY_UP];
    }
    return false;
}

/**
 * Helper to transition to Playing state
 */
function startGame(p) {
    resetGame(p); // Ensure fresh state
    gameState.gamePhase = "PLAYING";
}

/**
 * Log inputs to p.logs
 */
function logInput(p, type, code) {
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: type,
            keyCode: code,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}