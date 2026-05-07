/**
 * Utility functions for math, colors, and helpers.
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
 * Check collision between two rectangles
 */
export function rectIntersect(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
    return (r1x < r2x + r2w && 
            r1x + r1w > r2x && 
            r1y < r2y + r2h && 
            r1y + r1h > r2y);
}

/**
 * Calculate distance between two points
 */
export function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Generate a random integer between min and max (inclusive) using p5 instance if available, 
 * or Math.random as fallback (though we should strictly use p5.random)
 */
export function randomInt(p, min, max) {
    return Math.floor(p.random(min, max + 1));
}

/**
 * Returns a random element from an array
 */
export function randomChoice(p, arr) {
    return arr[Math.floor(p.random(arr.length))];
}