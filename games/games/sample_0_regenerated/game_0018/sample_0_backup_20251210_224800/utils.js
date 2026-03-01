/**
 * Utility functions for math, geometry, and helpers.
 */

/**
 * Linear interpolation
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Constrain a value between min and max
 */
export function constrain(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

/**
 * Random range (float)
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random range (int)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Simple AABB Collision check
 */
export function checkAABB(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

/**
 * Calculate distance between two points
 */
export function dist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate a unique ID for entities
 */
let idCounter = 0;
export function generateID() {
    return ++idCounter;
}