/**
 * utils.js
 * Helper functions for geometry, drawing, and math.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

/**
 * Draws a pixel-art style sprite defined by a binary or color map.
 * @param {p5} p - The p5 instance
 * @param {Array} map - 2D array representing the sprite
 * @param {Number} x - Center X position
 * @param {Number} y - Center Y position
 * @param {Number} scale - Pixel scale size
 * @param {Object} palette - Color mapping { 1: [r,g,b], 2: ... }
 * @param {Number} facing - 1 for right, -1 for left (flips horizontally)
 */
export function drawSprite(p, map, x, y, scale, palette, facing = 1) {
    p.push();
    p.translate(x, y);
    p.scale(facing, 1);
    
    const rows = map.length;
    const cols = map[0].length;
    const w = cols * scale;
    const h = rows * scale;
    
    // Center alignment
    p.translate(-w / 2, -h / 2);
    
    p.noStroke();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = map[r][c];
            if (val !== 0 && palette[val]) {
                p.fill(...palette[val]);
                p.rect(c * scale, r * scale, scale, scale);
            }
        }
    }
    p.pop();
}

/**
 * Simple AABB Collision detection
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
 * Circle collision detection
 */
export function checkCircle(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (c1.radius + c2.radius);
}

/**
 * Returns a random number between min and max
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Ease Out Cubic function for animations
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}