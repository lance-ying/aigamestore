import { gameState } from './globals.js';

// Key state tracking
const keys = {};

// Key constants
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    R: 82,
    SHIFT: 16,
    Z: 90
};

export function handleKeyPress(p) {
    keys[p.keyCode] = true;

    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    // Global Phase Controls
    if (p.keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START" || gameState.gamePhase === "GAME_OVER_WIN") {
            window.startGame();
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
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "LEVEL_COMPLETE") {
            window.restartLevel();
        }
    }
}

export function handleKeyRelease(p) {
    keys[p.keyCode] = false;
    
    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

export function isKeyDown(keyCode) {
    return keys[keyCode] === true;
}

// Helper to get virtual input from automated tests
export function getInputState() {
    return keys;
}

// Allow external control for automated tests
export function simulateKeyPress(keyCode) {
    keys[keyCode] = true;
}

export function simulateKeyRelease(keyCode) {
    keys[keyCode] = false;
}