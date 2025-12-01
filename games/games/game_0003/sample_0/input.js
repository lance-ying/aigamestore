import { gameState } from './globals.js';
import { setupLevel } from './levels.js';

const keys = {};

export function handleInput(p) {
    // Record inputs for logging
    if (p.keyIsPressed) {
        // Just minimal logging to avoid spam, usually handled in events
    }
}

export function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

export function handleKeyPress(p) {
    keys[p.keyCode] = true;

    // Log input
    p.logs.inputs.push({
        type: 'press',
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });

    // Global Game Flow Controls
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.currentLevelIndex = 0;
            setupLevel(gameState.currentLevelIndex);
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
        } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
             gameState.currentLevelIndex++;
             // Check if we have more levels, else win game
             // For now simple logic:
             if (gameState.currentLevelIndex >= 3) { // Assuming 3 levels
                 gameState.gamePhase = "GAME_OVER_WIN";
             } else {
                 setupLevel(gameState.currentLevelIndex);
                 gameState.gamePhase = "PLAYING";
             }
        }
    }

    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "GAME_OVER_LOSE") {
            setupLevel(gameState.currentLevelIndex);
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
}

export function handleKeyRelease(p) {
    keys[p.keyCode] = false;
    
    p.logs.inputs.push({
        type: 'release',
        key: p.key,
        keyCode: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });
}

// Control Mapping
export const CONTROLS = {
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    SPACE: 32
};