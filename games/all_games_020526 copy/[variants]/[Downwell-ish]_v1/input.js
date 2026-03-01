import { gameState, resetGameState } from './globals.js';

const keys = {};

export function handleKeyPress(p) {
    keys[p.keyCode] = true;

    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Phase management
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Cancel auto-restart if Enter is pressed
            gameState.autoRestartTimer = null; 
            resetGameState();
            // Note: game logic will re-init level in main loop if player is null
        }
    }

    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Cancel auto-restart if R is pressed (manual restart takes priority)
            gameState.autoRestartTimer = null; 
            resetGameState();
            // Start Screen logic expects phase to be START after reset usually, or we can jump to playing
            // The instructions say "R - restart; returns to the start screen"
            gameState.gamePhase = "START";
        }
    }
}

export function handleKeyRelease(p) {
    keys[p.keyCode] = false;
    
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    ENTER: 13,
    ESC: 27,
    R: 82,
    SHIFT: 16,
    Z: 90
};