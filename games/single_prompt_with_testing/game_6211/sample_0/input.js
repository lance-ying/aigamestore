// input.js
// Handles keyboard input and input state

import { gameState, logGameInfo } from './globals.js';

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
    R: 82
};

export function handleInput(p) {
    p.keyPressed = function() {
        gameState.keys[p.keyCode] = true;

        // Log input
        logGameInfo(p, "inputs", { type: "press", key: p.key, code: p.keyCode });

        // Global Game Phase Controls
        if (p.keyCode === KEYS.ENTER) {
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                logGameInfo(p, "game_info", { msg: "Game Started" });
            } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                 // Enter on game over screen acts like Restart
                 resetGame(p);
            }
        }

        if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }

        if (p.keyCode === KEYS.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                resetGame(p);
            }
        }

        // Gameplay immediate actions
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            if (p.keyCode === KEYS.SPACE) {
                gameState.player.tryJump();
            }
            if (p.keyCode === KEYS.Z) {
                gameState.player.trySpin();
            }
        }
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        
        // Log input
        logGameInfo(p, "inputs", { type: "release", key: p.key, code: p.keyCode });

        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            if (p.keyCode === KEYS.SPACE) {
                gameState.player.cancelJump();
            }
        }
    };
}

// Helper to check if key is held down
export function isKeyDown(keyCode) {
    return !!gameState.keys[keyCode];
}

// Import resetGame to link functionality
import { resetGame } from './game.js';