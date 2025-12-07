import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

// Random number generator seeded by p5 randomSeed in setup
export function randomRange(p, min, max) {
    return p.random(min, max);
}

export function randomInt(p, min, max) {
    return Math.floor(p.random(min, max));
}

export function randomChoice(p, arr) {
    return arr[Math.floor(p.random(arr.length))];
}

// AABB Collision check
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Check if a rectangle is on screen (for culling)
export function isOnScreen(x, y, w, h) {
    const screenX = x - gameState.cameraX;
    return screenX + w > -50 && screenX < CANVAS_WIDTH + 50;
}