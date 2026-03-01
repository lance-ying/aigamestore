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
            // Manual restart via ENTER (less common, but handled)
            resetGameState();
            gameState.gamePhase = "START"; // Go to start screen
            if (gameState.autoRestartTimer !== null) { // Cancel pending auto-restart
                gameState.autoRestartTimer = null;
            }
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
            resetGameState();
            // Manual restart (R key) always returns to START screen
            gameState.gamePhase = "START"; 
            if (gameState.autoRestartTimer !== null) { // Cancel pending auto-restart
                gameState.autoRestartTimer = null;
            }
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