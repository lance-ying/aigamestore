/**
 * Utility functions for math, colors, and general helpers.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function distSq(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Converts a hex color to RGB array
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

/**
 * Collision Helper: Point in Rect
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Collision Helper: Circle Rect
 * Returns detailed collision info or null
 */
export function checkCircleRectCollision(circle, rect) {
    // Find the closest point on the rectangle to the center of the circle
    let testX = circle.x;
    let testY = circle.y;

    // Check X axis
    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;

    // Check Y axis
    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;

    // Distance from closest edges
    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    if (distance <= circle.radius) {
        return {
            collided: true,
            normalX: distX / (distance || 1), // Avoid div by zero
            normalY: distY / (distance || 1),
            overlap: circle.radius - distance,
            testX: testX,
            testY: testY
        };
    }
    return null;
}

/**
 * Camera Shake
 */
export function addCameraShake(amount) {
    gameState.camera.shakeAmount = amount;
}