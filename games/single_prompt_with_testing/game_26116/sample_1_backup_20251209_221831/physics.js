/**
 * Physics Engine and Collision Detection.
 * Handles AABB collisions, raycasting helpers, and simple dynamics.
 */

import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState, GRAVITY, TERMINAL_VELOCITY, CANVAS_HEIGHT } from './globals.js';

/**
 * Apply general physics to an entity (gravity, velocity integration)
 */
export function applyPhysics(entity) {
    // Apply Gravity
    if (entity.useGravity && !entity.grounded) {
        entity.vy += GRAVITY;
    }

    // Terminal Velocity
    if (entity.vy > TERMINAL_VELOCITY) entity.vy = TERMINAL_VELOCITY;

    // Apply Velocity to Position
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // Bounds Check (Floor Death)
    if (entity.y > CANVAS_HEIGHT + 100) {
        entity.active = false; // Kill entity if it falls too far
        if (entity.type === 'PLAYER') {
            entity.die();
        }
    }
}

/**
 * Check and resolve collisions between a dynamic entity and static platforms
 */
export function resolvePlatformCollisions(entity, platforms) {
    entity.grounded = false;

    // Horizontal Collision First
    let tempX = entity.x;
    let tempY = entity.y - entity.vy; // Previous Y
    
    // We check overlap on current frame. 
    // To solve correctly, we often separate axes, but for simple p5, we can do:
    // Check floor/ceiling (Y axis)
    
    for (let platform of platforms) {
        if (checkAABB(entity, platform)) {
            resolveAABB(entity, platform);
        }
    }
}

/**
 * Simple AABB collision check
 */
export function checkAABB(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

/**
 * Resolve AABB collision by pushing entity out of static rect.
 * Determines collision side based on previous position overlap.
 */
export function resolveAABB(entity, staticRect) {
    // Calculate overlap
    const dx = (entity.x + entity.w / 2) - (staticRect.x + staticRect.w / 2);
    const dy = (entity.y + entity.h / 2) - (staticRect.y + staticRect.h / 2);
    const width = (entity.w + staticRect.w) / 2;
    const height = (entity.h + staticRect.h) / 2;
    
    const crossWidth = width * dy;
    const crossHeight = height * dx;
    
    let collisionSide = 'none';

    if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
        if (crossWidth > crossHeight) {
            if (crossWidth > -crossHeight) {
                collisionSide = 'bottom'; // Entity hitting from bottom (head bonk)
            } else {
                collisionSide = 'left'; // Entity hitting left side of platform
            }
        } else {
            if (crossWidth > -crossHeight) {
                collisionSide = 'right'; // Entity hitting right side of platform
            } else {
                collisionSide = 'top'; // Entity landing on top
            }
        }
    }

    // React to collision
    if (collisionSide === 'top') {
        // One way platforms logic could go here
        if (entity.vy >= 0) { // Only land if falling down
            entity.y = staticRect.y - entity.h;
            entity.vy = 0;
            entity.grounded = true;
        }
    } else if (collisionSide === 'bottom') {
        entity.y = staticRect.y + staticRect.h;
        entity.vy = 0;
    } else if (collisionSide === 'left') {
        entity.x = staticRect.x - entity.w;
        entity.vx = 0;
    } else if (collisionSide === 'right') {
        entity.x = staticRect.x + staticRect.w;
        entity.vx = 0;
    }
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(x, y, rect) {
    return (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
}

/**
 * Get entities within a radius
 */
export function getEntitiesInRadius(x, y, radius, type = null) {
    return gameState.entities.filter(e => {
        if (!e.active) return false;
        if (type && e.type !== type) return false;
        const dist = Math.sqrt(Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2));
        return dist <= radius;
    });
}