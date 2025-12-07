/**
 * Input handling
 */
import { gameState } from './globals.js';

export const keys = {};

export function handleInput(p) {
    // This is called inside p.keyPressed and p.keyReleased
    // Logic is handled in the p5 instance hooks in game.js to ensure proper event capturing
}

export function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

// Key Constants
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

export function getInputVector() {
    let dx = 0;
    let dy = 0;
    if (isKeyPressed(KEY_LEFT)) dx -= 1;
    if (isKeyPressed(KEY_RIGHT)) dx += 1;
    if (isKeyPressed(KEY_UP)) dy -= 1;
    if (isKeyPressed(KEY_DOWN)) dy += 1;
    
    // Normalize if diagonal (optional, but good for smooth movement)
    if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;
    }
    
    return { x: dx, y: dy };
}