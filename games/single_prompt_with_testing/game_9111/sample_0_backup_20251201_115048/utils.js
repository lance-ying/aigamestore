import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Simple AABB Collision
export function checkRectOverlap(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

// Check if a point is inside a rect
export function pointInRect(x, y, r) {
    return (
        x >= r.x &&
        x <= r.x + r.w &&
        y >= r.y &&
        y <= r.y + r.h
    );
}

// Random range
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Create a unique ID
let idCounter = 0;
export function generateID() {
    return ++idCounter;
}