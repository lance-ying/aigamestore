import { gameState } from './globals.js';

export const keys = {};

export function handleInput(p) {
    // Phase transitions handled in main key press events
    // Continuous input handling is done by checking the keys object
}

export function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

export const INPUT = {
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

// Input Logger Helper
export function logInput(p, type, key, code) {
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: type,
            key: key,
            keyCode: code,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
}