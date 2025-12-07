/**
 * input.js
 * Handles keyboard input events and state.
 */

import { gameState } from './globals.js';

export function handleKeyPress(p) {
    const code = p.keyCode;
    gameState.keys[code] = true;
    
    // Log input
    p.logs.inputs.push({
        type: "PRESS",
        key: code,
        frame: p.frameCount
    });
    
    // Global State Controls
    if (code === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            startGame();
        }
    }
    
    if (code === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (code === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PLAYING") {
            resetGame();
        }
    }
    
    // Gameplay Controls (One-shot actions)
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (code === 32) { // SPACE - Hover/Jump boost
             // Logic handled in update loop for continuous or specific timing
        }
        if (code === 16) { // SHIFT - Slam
            if (!gameState.player.isGrounded) {
                gameState.player.slam();
            }
        }
    }
}

export function handleKeyRelease(p) {
    const code = p.keyCode;
    gameState.keys[code] = false;
}

export function isKeyDown(code) {
    return gameState.keys[code] === true;
}

// Helpers for game control
function startGame() {
    gameState.gamePhase = "PLAYING";
}

function resetGame() {
    // Rely on game.js initGame logic, but we need to trigger it.
    // The easiest way is to set phase to START and let the loop handle or re-init directly.
    // We'll expose a global reset method or callback.
    if (window.gameInstance && window.gameInstance.resetGame) {
        window.gameInstance.resetGame();
    }
}

// Key constants
export const KEYS = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    ENTER: 13,
    ESC: 27,
    R: 82,
    Z: 90
};