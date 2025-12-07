/**
 * input.js
 * Handles keyboard input events and state.
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
    SHIFT: 16,
    Z: 90,
    R: 82
};

export function handleInput(p) {
    // This is called inside p.keyPressed
    gameState.keys[p.keyCode] = true;
    
    // Global State Controls
    if (p.keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ event: "GAME_START", timestamp: Date.now() });
        } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
            // Next Level logic handled in game loop or level manager
            // but we signal it here
            gameState.requestNextLevel = true;
        }
    }
    
    if (p.keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (p.keyCode === KEYS.R) {
        if (["GAME_OVER_WIN", "GAME_OVER_LOSE", "PLAYING", "PAUSED"].includes(gameState.gamePhase)) {
            // Signal a reset
            gameState.requestReset = true;
        }
    }
    
    // Log Input
    p.logs.inputs.push({
        type: 'PRESS',
        key: p.key,
        keyCode: p.keyCode,
        frame: gameState.frameCount
    });
}

export function handleInputRelease(p) {
    gameState.keys[p.keyCode] = false;
    
    p.logs.inputs.push({
        type: 'RELEASE',
        key: p.key,
        keyCode: p.keyCode,
        frame: gameState.frameCount
    });
}

export function isKeyDown(keyCode) {
    return !!gameState.keys[keyCode];
}