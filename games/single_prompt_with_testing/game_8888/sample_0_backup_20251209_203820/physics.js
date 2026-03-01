/**
 * Physics engine and collision detection utilities.
 * Uses p5.collide2D for precise shape interaction.
 */

import { collideRectRect, collideRectCircle, collideCircleCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

/**
 * Simple AABB collision check
 */
export function checkAABB(rect1, rect2) {
    return collideRectRect(
        rect1.x, rect1.y, rect1.width, rect1.height,
        rect2.x, rect2.y, rect2.width, rect2.height
    );
}

/**
 * Check collision between a rectangle (entity) and a circle (collectible/particle)
 */
export function checkRectCircle(rect, circle) {
    return collideRectCircle(
        rect.x, rect.y, rect.width, rect.height,
        circle.x, circle.y, circle.radius
    );
}

/**
 * Apply basic physics to an entity
 * @param {object} entity - Must have x, y, vx, vy, ax, ay properties
 */
export function applyPhysics(entity) {
    // Apply Acceleration
    entity.vx += entity.ax;
    entity.vy += entity.ay;

    // Apply Friction (Horizontal)
    entity.vx *= entity.friction || 1;

    // Apply Velocity
    entity.x += entity.vx;
    entity.y += entity.vy;

    // Reset Acceleration
    entity.ax = 0;
    entity.ay = 0;
}

/**
 * Constrain entity to world bounds (optional, mostly for Y axis to prevent falling forever if no pit)
 */
export function constrainToWorld(entity, worldHeight) {
    if (entity.y > worldHeight + 200) {
        // Entity fell off the world
        if (entity.die) entity.die("falling");
    }
}

/**
 * Camera utility to convert World Space to Screen Space
 */
export function worldToScreen(x, y) {
    return {
        x: x - gameState.cameraX,
        y: y - gameState.cameraY
    };
}

/**
 * Check if entity is potentially visible on screen (Broad phase culling)
 */
export function isOnScreen(entity, buffer = 100) {
    const screenPos = entity.x - gameState.cameraX;
    return (screenPos > -buffer && screenPos < CANVAS_WIDTH + buffer);
}