/**
 * physics.js
 * Contains collision detection logic and physics utilities.
 * Uses AABB (Axis-Aligned Bounding Box) collision.
 */

import { gameState, TILE_SIZE } from './globals.js';

/**
 * Checks for intersection between two rectangles
 * @param {object} r1 - Rectangle 1 {x, y, w, h}
 * @param {object} r2 - Rectangle 2 {x, y, w, h}
 * @returns {boolean}
 */
export function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

/**
 * Checks collision between a rectangle and a triangle (spike)
 * Approximates triangle as a smaller hitbox for fairness
 * @param {object} rect - Player rect {x, y, w, h}
 * @param {object} tri - Spike object {x, y, w, h} (assumed pointing up)
 * @returns {boolean}
 */
export function checkRectTriangleCollision(rect, tri) {
    // 1. Broad phase: AABB check
    const triRect = { x: tri.x, y: tri.y, w: tri.w, h: tri.h };
    if (!checkRectCollision(rect, triRect)) {
        return false;
    }

    // 2. Narrow phase: Check center point of triangle bottom and tip
    // Simple approximation: Check if player bottom center is inside the triangle
    // Or simpler: shrink the hitbox of the spike slightly
    const margin = 5;
    const deadlyZone = {
        x: tri.x + margin,
        y: tri.y + margin,
        w: tri.w - margin * 2,
        h: tri.h - margin
    };
    
    return checkRectCollision(rect, deadlyZone);
}

/**
 * Resolves vertical collision between a dynamic entity and a static block
 * @param {object} entity - Moving entity (Player)
 * @param {object} block - Static obstacle
 * @returns {string|null} - 'TOP', 'BOTTOM', 'LEFT', 'RIGHT' or null
 */
export function resolveCollision(entity, block) {
    // Calculate overlap
    const dx = (entity.x + entity.w / 2) - (block.x + block.w / 2);
    const dy = (entity.y + entity.h / 2) - (block.y + block.h / 2);
    const width = (entity.w + block.w) / 2;
    const height = (entity.h + block.h) / 2;
    
    const crossWidth = width * dy;
    const crossHeight = height * dx;
    
    let collisionSide = null;

    if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
        if (crossWidth > crossHeight) {
            if (crossWidth > -crossHeight) {
                collisionSide = 'BOTTOM'; // Player hit bottom of block
            } else {
                collisionSide = 'LEFT'; // Player hit left side of block
            }
        } else {
            if (crossWidth > -crossHeight) {
                collisionSide = 'RIGHT'; // Player hit right side of block
            } else {
                collisionSide = 'TOP'; // Player hit top of block
            }
        }
    }
    
    return collisionSide;
}

/**
 * Checks if an entity is on screen (with buffer)
 */
export function isOnScreen(entity) {
    // Render buffer of 200px
    return (
        entity.x + entity.w > gameState.cameraX - 100 &&
        entity.x < gameState.cameraX + 600 + 100
    );
}