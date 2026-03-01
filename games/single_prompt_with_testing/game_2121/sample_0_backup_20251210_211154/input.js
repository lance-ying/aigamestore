// Input Handling

import { gameState } from './globals.js';

// Key Codes
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

// Input State
const keyState = {};
const keyPressFrame = {}; // Frame count when key was pressed (for buffering/just pressed)

export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;
    keyPressFrame[keyCode] = p.frameCount;

    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'DOWN',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    // Global Game Phase Controls
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
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
            // Restart handled in game.js loop check or external reset
            // We set a flag or handle it immediately. 
            // Better to trigger a reset function from game.js, but since this is module, 
            // we can signal via gameState or return value.
            // Let's set a transient flag or check in draw.
            // Actually, simplest is to reset here if we imported reset function, 
            // but to avoid circular deps, let's just set phase to START and let game loop handle re-init.
            gameState.gamePhase = "START";
            // We will need to re-init entities in the main loop when entering START/PLAYING.
        }
    }
}

export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
    
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'UP',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

/**
 * Returns true if key is currently held down.
 */
export function isKeyDown(keyCode) {
    return keyState[keyCode] === true;
}

/**
 * Returns true if key was pressed strictly on the current frame (or within buffer).
 */
export function isJustPressed(p, keyCode, buffer = 0) {
    return keyState[keyCode] && (p.frameCount - keyPressFrame[keyCode] <= buffer);
}

/**
 * Clears inputs (useful on game over or pause).
 */
export function clearInputs() {
    for (let k in keyState) {
        keyState[k] = false;
    }
}

/**
 * Helper to get directional input vector.
 */
export function getInputVector() {
    let x = 0;
    let y = 0;
    if (isKeyDown(KEYS.RIGHT)) x += 1;
    if (isKeyDown(KEYS.LEFT)) x -= 1;
    if (isKeyDown(KEYS.DOWN)) y += 1;
    if (isKeyDown(KEYS.UP)) y -= 1;
    return { x, y };
}