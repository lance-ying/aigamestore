/**
 * Input handling module
 */
import { gameState } from './globals.js';

const keys = {};

export function handleInput(p) {
    // Key Logic is handled in p.keyPressed/p.keyReleased events in game.js
    // This function can be used for continuous checks if needed
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export function setKey(keyCode, isPressed) {
    keys[keyCode] = isPressed;
}

export function resetInputs() {
    for (let key in keys) {
        keys[key] = false;
    }
}

// Key Constants
export const KEY = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82,
    P: 80
};