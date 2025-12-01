// input.js
// Handles keyboard input

import { gameState } from './globals.js';

const keys = {};

export function handleInput(p) {
    // Phase transitions are handled in keyPressed/keyReleased in game.js
    // This function checks continuous input state for movement
}

export function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

export function updateKeyState(keyCode, isPressed, p) {
    keys[keyCode] = isPressed;
    
    // Log input change
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: isPressed ? 'keyPressed' : 'keyReleased',
            data: { key: p.key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

// Key Constants
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