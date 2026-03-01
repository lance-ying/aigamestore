/**
 * input.js
 * Handles keyboard input and state.
 */

import { gameState } from './globals.js';

// Key codes
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

const keyState = {};
const keyPressedThisFrame = {};

export function handleInput(p) {
    // This is called inside p5's keyPressed and keyReleased
}

export function onKeyPressed(p) {
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

    // Global phase transitions
    if (p.keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase changed to PLAYING");
        }
    }
    
    if (p.keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Phase changed to PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase changed to PLAYING");
        }
    }
    
    if (p.keyCode === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Signal to main game loop to reset
            gameState.gamePhase = "RESTART_PENDING"; 
            logGameInfo(p, "Restart requested");
        }
    }
}

export function onKeyReleased(p) {
    keyState[p.keyCode] = false;
    
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
    const result = !!keyPressedThisFrame[keyCode];
    return result;
}

export function clearInputFrame() {
    for (let key in keyPressedThisFrame) {
        delete keyPressedThisFrame[key];
    }
}

function logGameInfo(p, message) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: { message: message, gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}