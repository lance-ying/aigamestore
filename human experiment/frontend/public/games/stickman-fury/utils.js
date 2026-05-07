/**
 * utils.js
 * Helper functions for math, geometry, and common utilities.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

/**
 * Linear interpolation
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Clamps a value between min and max
 */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * Returns a random number between min and max
 * NOTE: In p5 instance mode, we should ideally use p.random, but for pure logic
 * independent of the p5 instance (if needed), this uses Math.random.
 * For this game, we prefer passing the 'p' instance to functions.
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Calculates distance between two points
 */
export function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Checks if a point is on screen (with some margin)
 */
export function isOnScreen(x, y, margin = 50) {
    return (
        x > -margin && 
        x < CANVAS_WIDTH + margin && 
        y > -margin && 
        y < CANVAS_HEIGHT + margin
    );
}

/**
 * Easing function for smooth animations (Ease Out Cubic)
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for smooth animations (Ease Out Elastic)
 */
export function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

/**
 * Formats a number with commas for score display
 */
export function formatScore(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}