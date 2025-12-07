// utils.js
// Helper functions for math and RNG

/**
 * Linear interpolation
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Constrain a value between min and max
 */
export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

/**
 * Check if a rectangle is inside the camera view
 */
export function isInsideCamera(x, y, w, h, camera) {
    const margin = 100; // Draw slightly outside to prevent pop-in
    return (
        x + w > camera.x - margin &&
        x < camera.x + 600 + margin &&
        y + h > camera.y - margin &&
        y < camera.y + 400 + margin
    );
}

/**
 * Simple AABB collision check
 */
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Get random integer between min (inclusive) and max (exclusive)
 * using p5's random if available, or Math.random
 */
export function randomInt(p, min, max) {
    return Math.floor(p.random(min, max));
}

/**
 * Distance between two points
 */
export function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}