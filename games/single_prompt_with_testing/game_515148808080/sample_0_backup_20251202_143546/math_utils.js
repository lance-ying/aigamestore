/**
 * math_utils.js
 * Utility functions for calculations and random generation.
 */

// Linear interpolation
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Constrain value between min and max
export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

// Check intersection between two rectangles (AABB)
export function checkAABB(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

// Get a random integer between min and max (inclusive)
export function randomInt(p, min, max) {
    return Math.floor(p.random(min, max + 1));
}

// Get a random element from an array
export function randomChoice(p, arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(p.random(arr.length))];
}

// Easing function for smooth animations
export function easeOutQuad(t) {
    return t * (2 - t);
}

// Generate a unique ID
export function generateID() {
    return Math.random().toString(36).substr(2, 9);
}