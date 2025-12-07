/**
 * Physics Engine and Collision Detection
 */
import { GRAVITY, FRICTION_GROUND, FRICTION_AIR, TERMINAL_VELOCITY, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { collideRectRect, collideLineRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Applies basic physics integration (Euler) to an entity
 * @param {Object} entity - The entity to update
 */
export function applyPhysics(entity) {
    if (entity.isStatic) return;

    // Apply Acceleration
    entity.vx += entity.ax;
    entity.vy += entity.ay;

    // Apply Gravity (if not disabled, e.g., climbing)
    if (entity.usesGravity) {
        entity.vy += GRAVITY * entity.gravityScale;
    }

    // Apply Friction
    const friction = entity.onGround ? FRICTION_GROUND : FRICTION_AIR;
    entity.vx *= friction;
    entity.vy *= 0.99; // Slight air drag vertical

    // Terminal Velocity
    entity.vy = Math.min(entity.vy, TERMINAL_VELOCITY);
    
    // Reset acceleration
    entity.ax = 0;
    entity.ay = 0;
}

/**
 * Checks and resolves collisions with static world geometry (Platforms)
 * Updates entity position and velocity directly.
 * @param {Object} entity 
 * @param {Array} platforms 
 */
export function resolveWorldCollisions(entity, platforms) {
    entity.onGround = false;
    entity.onWall = false;

    // Horizontal Collision
    entity.x += entity.vx;
    
    // World Bounds X
    if (entity.x < 0) { entity.x = 0; entity.vx = 0; }
    if (entity.x > WORLD_WIDTH - entity.width) { entity.x = WORLD_WIDTH - entity.width; entity.vx = 0; }

    for (let platform of platforms) {
        if (checkAABB(entity, platform)) {
            // Resolve X
            if (entity.vx > 0) { // Moving Right
                entity.x = platform.x - entity.width;
            } else if (entity.vx < 0) { // Moving Left
                entity.x = platform.x + platform.width;
            }
            entity.vx = 0;
            entity.onWall = true;
        }
    }

    // Vertical Collision
    entity.y += entity.vy;

    // World Bounds Y (Death pit or bottom)
    if (entity.y > WORLD_HEIGHT + 200) {
        // Falling out of world handling is usually done in entity update
    }

    for (let platform of platforms) {
        // One-way platforms logic could go here, but for now simple solid blocks
        if (checkAABB(entity, platform)) {
            // Resolve Y
            if (entity.vy > 0) { // Falling Down
                entity.y = platform.y - entity.height;
                entity.onGround = true;
                entity.vy = 0;
            } else if (entity.vy < 0) { // Jumping Up
                entity.y = platform.y + platform.height;
                entity.vy = 0;
            }
        }
    }
}

/**
 * Axis-Aligned Bounding Box check
 */
export function checkAABB(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Check if an entity is overlapping a pole
 * @param {Object} entity 
 * @param {Array} poles 
 * @returns {Object|null} The pole object or null
 */
export function checkPoleOverlap(entity, poles) {
    const centerX = entity.x + entity.width / 2;
    const centerY = entity.y + entity.height / 2;
    
    for (let pole of poles) {
        // Treat pole as a thin rect for overlap
        // Pole visual width is small, but interaction width is larger
        if (centerX >= pole.x - 10 && centerX <= pole.x + pole.width + 10 &&
            centerY >= pole.y && centerY <= pole.y + pole.height) {
            return pole;
        }
    }
    return null;
}

/**
 * Simple raycast for AI vision
 */
export function raycast(start, end, obstacles) {
    // This is a simplified check, checking if the line segment intersects any obstacle rect
    for (let obs of obstacles) {
        const hit = collideLineRect(
            start.x, start.y, end.x, end.y,
            obs.x, obs.y, obs.width, obs.height
        );
        if (hit) return true; // Hit an obstacle
    }
    return false; // Clear line of sight
}