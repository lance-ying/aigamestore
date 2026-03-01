/**
 * Input handling system.
 * Manages keyboard events and maps them to game actions.
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
    Z: 90,
    SHIFT: 16,
    R: 82,
    P: 80
};

/**
 * Handles key press events from p5.js
 * @param {object} p - p5 instance
 */
export function handleKeyPressed(p) {
    const code = p.keyCode;
    gameState.keys[code] = true;

    // Log Input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: code },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Controls
    if (code === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase Changed to PLAYING");
        }
    }

    if (code === KEYS.ESC || code === KEYS.P) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Game Paused");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Game Resumed");
        }
    }

    if (code === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart handled in main loop to ensure clean reset
            gameState.requestRestart = true;
        }
    }
    
    // Player specific 'trigger' inputs (Jump, Attack)
    // Continuous inputs (Move) are handled in the update loop via checks
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (code === KEYS.SPACE) {
            gameState.player.jump();
        }
        if (code === KEYS.Z) {
            gameState.player.attack();
        }
        if (code === KEYS.SHIFT) {
            gameState.player.dash();
        }
    }
}

/**
 * Handles key release events from p5.js
 * @param {object} p - p5 instance
 */
export function handleKeyReleased(p) {
    const code = p.keyCode;
    gameState.keys[code] = false;

    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: code },
            framecount: p.frameCount,
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
    return !!gameState.keys[keyCode];
}

/**
 * Helper to log game info
 */
function logGameInfo(p, message) {
    if (p.logs) {
        p.logs.game_info.push({
            data: { message: message, gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}