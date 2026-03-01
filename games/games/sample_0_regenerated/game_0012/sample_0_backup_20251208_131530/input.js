/**
 * Input handling system.
 * Manages keyboard state, input buffering, and control modes.
 */

import { gameState } from './globals.js';

// Key Constants
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

// Current raw key state
const keyState = {};
const keyPressedThisFrame = {};

export function handleKeyDown(p) {
    keyState[p.keyCode] = true;
    keyPressedThisFrame[p.keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Controls
    if (p.keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
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
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE" ||
            gameState.gamePhase === "PLAYING") {
            // Trigger restart logic via game.js (handled in update loop usually, 
            // but we can set a flag or rely on game loop to check R if we wanted direct restart)
            // For architecture, game.js usually handles the actual reset function call
            // We'll expose a signal or handle it in game.js specific checks
        }
    }
    
    // Input Buffering for tight controls
    if (gameState.gamePhase === "PLAYING") {
        if (p.keyCode === KEYS.SPACE) {
            gameState.inputBuffer.jump = 5; // Valid for 5 frames
        }
        if (p.keyCode === KEYS.Z) {
            gameState.inputBuffer.dash = 5; // Valid for 5 frames
        }
    }
}

export function handleKeyUp(p) {
    keyState[p.keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

export function wasKeyPressed(keyCode) {
    let result = !!keyPressedThisFrame[keyCode];
    return result;
}

export function clearFrameInputs() {
    for (let key in keyPressedThisFrame) {
        delete keyPressedThisFrame[key];
    }
    
    // Decrement buffers
    if (gameState.inputBuffer.jump > 0) gameState.inputBuffer.jump--;
    if (gameState.inputBuffer.dash > 0) gameState.inputBuffer.dash--;
}

export function getInputDirection() {
    let x = 0;
    let y = 0;
    
    if (isKeyDown(KEYS.LEFT)) x -= 1;
    if (isKeyDown(KEYS.RIGHT)) x += 1;
    if (isKeyDown(KEYS.UP)) y -= 1;
    if (isKeyDown(KEYS.DOWN)) y += 1;
    
    return { x, y };
}