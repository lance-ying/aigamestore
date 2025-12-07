/**
 * utils.js
 * Mathematical helpers, color manipulation, and random generators.
 */

// Linear interpolation
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Random float between min and max
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Random integer between min and max (inclusive)
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Distance between two points (2D)
export function dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Clamp a value between min and max
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Easing function (Ease Out Quad)
export function easeOutQuad(t) {
    return t * (2 - t);
}

// Convert Hex to RGB object
export function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Creates a pulsing effect value based on time.
 * @param {number} frameCount Current frame count
 * @param {number} speed Speed of pulse
 * @param {number} min Min value
 * @param {number} max Max value
 */
export function pulse(frameCount, speed, min, max) {
    const sinVal = Math.sin(frameCount * speed); // -1 to 1
    const norm = (sinVal + 1) / 2; // 0 to 1
    return lerp(min, max, norm);
}

/**
 * Checks if a point is inside a rectangle (Logic Coordinates)
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh);
}

/**
 * Simple 1D collision check
 */
export function checkOverlap(min1, max1, min2, max2) {
    return max1 >= min2 && min1 <= max2;
}

/**
 * Generate a random color variant
 */
export function randomColorVariant(baseR, baseG, baseB, variance) {
    const r = clamp(baseR + randomInt(-variance, variance), 0, 255);
    const g = clamp(baseG + randomInt(-variance, variance), 0, 255);
    const b = clamp(baseB + randomInt(-variance, variance), 0, 255);
    return [r, g, b];
}