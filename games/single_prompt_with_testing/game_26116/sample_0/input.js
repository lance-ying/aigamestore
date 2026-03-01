/**
 * Input handling module.
 * 
 * Manages keyboard state, tracks key presses vs holds,
 * and handles control mapping.
 */

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
    R: 82,
    D: 68 // Debug toggle
};

// State tracking
const keyState = {};
const keyPrevState = {};

/**
 * Updates the previous frame's key state.
 * Should be called at the end of the game loop.
 */
export function updateInputState() {
    for (const key in keyState) {
        keyPrevState[key] = keyState[key];
    }
}

/**
 * Handles p5 keyPressed event
 */
export function handleKeyPressed(p) {
    keyState[p.keyCode] = true;
    
    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            type: 'PRESS',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    // Global Phase Controls
    if (p.keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ event: "PHASE_CHANGE", phase: "PLAYING" });
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
        if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
            // Restart logic is handled in game.js via a flag or direct call, 
            // but for clean architecture we'll set a flag or handle in update
            gameState.shouldRestart = true; 
        }
    }

    // Debug
    if (p.keyCode === KEYS.D) {
        gameState.debugMode = !gameState.debugMode;
    }
    
    // Item Switching
    if (p.keyCode === KEYS.SHIFT && gameState.gamePhase === "PLAYING") {
        if (gameState.collectedItems.length > 0) {
            gameState.equippedItemIndex = (gameState.equippedItemIndex + 1) % gameState.collectedItems.length;
        }
    }
}

/**
 * Handles p5 keyReleased event
 */
export function handleKeyReleased(p) {
    keyState[p.keyCode] = false;
    
    if (p.logs) {
        p.logs.inputs.push({
            type: 'RELEASE',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

/**
 * Check if key is currently held down
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Check if key was pressed this specific frame (rising edge)
 */
export function wasKeyPressed(keyCode) {
    return !!keyState[keyCode] && !keyPrevState[keyCode];
}