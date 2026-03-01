/**
 * utils.js
 * Helper functions for geometry, math, and general utilities.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function distSq(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

export function distance(x1, y1, x2, y2) {
    return Math.sqrt(distSq(x1, y1, x2, y2));
}

export function lerp(start, end, amt) {
    return start + (end - start) * amt;
}

// Check if a point is within canvas with padding
export function isWithinBounds(x, y, padding = 20) {
    return (
        x >= padding &&
        x <= CANVAS_WIDTH - padding &&
        y >= padding &&
        y <= CANVAS_HEIGHT - padding
    );
}

// Generate a unique ID
let idCounter = 0;
export function generateID() {
    return ++idCounter;
}

// Get random position far from existing points
export function getValidSpawnPosition(existingPoints, minDistance, p) {
    let attempts = 0;
    while (attempts < 50) {
        const x = p.random(40, CANVAS_WIDTH - 40);
        const y = p.random(40, CANVAS_HEIGHT - 40);
        
        let valid = true;
        for (const point of existingPoints) {
            if (distance(x, y, point.x, point.y) < minDistance) {
                valid = false;
                break;
            }
        }
        
        if (valid) return { x, y };
        attempts++;
    }
    return null; // Failed to find position
}

// Ease out function for animations
export function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}

// Color helpers
export function setStrokeColor(p, colorArr, alpha = 255) {
    p.stroke(colorArr[0], colorArr[1], colorArr[2], alpha);
}

export function setFillColor(p, colorArr, alpha = 255) {
    p.fill(colorArr[0], colorArr[1], colorArr[2], alpha);
}