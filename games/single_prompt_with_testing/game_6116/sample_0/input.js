// input.js
// Input Handling System

import { gameState } from './globals.js';

export const keys = {};

export function handleInput(p) {
    // Reset inputs array if needed, but per requirements we just append
    // This function is called every frame to process continuous input
}

export function setupInputHandlers(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        // Log raw input
        p.logs.inputs.push({
            type: 'PRESS',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });

        // Phase Transitions
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                gameState.startTime = Date.now();
                p.logs.game_info.push("Game Started");
            } else if (gameState.gamePhase === "GAME_OVER_WIN") {
                // Return to start or restart directly?
                // Instructions say R for restart. Enter can do nothing or same.
            }
        }

        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
                p.logs.game_info.push("Game Paused");
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
                p.logs.game_info.push("Game Resumed");
            }
        }

        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                // Handled in main loop or trigger reset here
                // We'll let the main loop detect the need to reset via a flag or direct call if possible.
                // Since resetGameState is imported in game.js, we can't easily call it here without circular deps
                // or passing it down.
                // We will rely on game.js checking this key or expose a reset function on window/gameInstance.
                window.gameInstance.resetGame();
            }
        }
        
        // Human Mode toggle (Debug/Dev feature, mapped to H maybe? Not required but useful)
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            type: 'RELEASE',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    };
}

export function isKeyDown(keyCode) {
    return keys[keyCode] === true;
}

// Key Mapping
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