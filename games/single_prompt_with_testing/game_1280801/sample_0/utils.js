import { COLORS } from './globals.js';

// Random Number Generator helpers
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Color utilities
export function getColorObj(index) {
    if (index < 0 || index >= COLORS.length) return { r: 100, g: 100, b: 100 };
    return COLORS[index];
}

export function colorToP5(p, colObj, alpha = 255) {
    return p.color(colObj.r, colObj.g, colObj.b, alpha);
}

// Coordinate utilities
export function isWithinBounds(x, y, width, height) {
    return x >= 0 && x < width && y >= 0 && y < height;
}

export function manhattanDist(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Easing functions for animations
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export function easeInQuad(t) {
    return t * t;
}