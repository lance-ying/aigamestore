/**
 * Utility functions for math, randomization, and geometry.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, gameState } from './globals.js';

/**
 * Calculates distance between two points.
 */
export function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Linearly interpolates between two values.
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Constrains a value between min and max.
 */
export function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low);
}

/**
 * Checks if a point is within a rectangle.
 */
export function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Checks if a rectangular entity is on screen.
 * Used for culling rendering.
 */
export function isOnScreen(entity, margin = 100) {
    const screenX = entity.x - gameState.camera.x;
    const screenY = entity.y - gameState.camera.y;
    
    return (
        screenX + entity.width + margin > 0 &&
        screenX - margin < CANVAS_WIDTH &&
        screenY + entity.height + margin > 0 &&
        screenY - margin < CANVAS_HEIGHT
    );
}

/**
 * Generates a random integer between min and max (inclusive).
 * Note: Should use p5's random in the main loop for seed consistency, 
 * but this is a helper for non-p5 contexts if needed.
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Screen shake effect helper.
 * Adds offset to camera based on trauma.
 */
export class ScreenShake {
    constructor() {
        this.trauma = 0;
        this.decay = 0.9;
        this.maxOffset = 20;
    }

    add(amount) {
        this.trauma = Math.min(this.trauma + amount, 1.0);
    }

    update() {
        if (this.trauma > 0) {
            this.trauma *= this.decay;
            if (this.trauma < 0.01) this.trauma = 0;
        }
    }

    getOffset(p) {
        if (this.trauma <= 0) return { x: 0, y: 0 };
        
        const shake = this.trauma * this.trauma;
        const offsetX = this.maxOffset * shake * (p.random() * 2 - 1);
        const offsetY = this.maxOffset * shake * (p.random() * 2 - 1);
        
        return { x: offsetX, y: offsetY };
    }
}

export const screenShake = new ScreenShake();