/**
 * Physics engine for A Few Quick Matches.
 * Handles collision detection, resolution, and movement integration.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, AIR_RESISTANCE } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Check AABB collision between two rectangular entities.
 * Assumes entities have x, y, width, height properties (where x,y is Top-Left or Center handled consistently).
 * Our entities use Center X, Center Y for position, but width/height are full dimensions.
 */
export function checkCollision(a, b) {
    // Convert Center-based coordinates to Top-Left for collide2d
    const aX = a.x - a.width / 2;
    const aY = a.y - a.height / 2;
    const bX = b.x - b.width / 2;
    const bY = b.y - b.height / 2;
    
    return collideRectRect(aX, aY, a.width, a.height, bX, bY, b.width, b.height);
}

/**
 * Resolves collision between an entity (dynamic) and a platform (static).
 * Pushes the entity out of the platform based on the shallowest axis of penetration.
 */
export function resolvePlatformCollision(entity, platform) {
    const dx = entity.x - platform.x;
    const dy = entity.y - platform.y;
    
    const combinedHalfWidth = entity.width / 2 + platform.width / 2;
    const combinedHalfHeight = entity.height / 2 + platform.height / 2;
    
    const overlapX = combinedHalfWidth - Math.abs(dx);
    const overlapY = combinedHalfHeight - Math.abs(dy);
    
    if (overlapX > 0 && overlapY > 0) {
        // Collision detected
        // Resolve on the axis with smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision (Walls)
            if (dx > 0) {
                entity.x += overlapX; // Push right
            } else {
                entity.x -= overlapX; // Push left
            }
            entity.vx = 0;
        } else {
            // Vertical collision (Floor/Ceiling)
            if (dy > 0) {
                entity.y += overlapY; // Push down (hit ceiling)
                entity.vy = 0;
            } else {
                entity.y -= overlapY; // Push up (land on floor)
                entity.vy = 0;
                entity.isGrounded = true;
                entity.hasDoubleJump = true; // Reset double jump on land
                entity.canDash = true; // Reset dash on land
            }
        }
        return true;
    }
    return false;
}

/**
 * Applies knockback to an entity.
 */
export function applyKnockback(entity, forceX, forceY) {
    entity.vx = forceX;
    entity.vy = forceY;
    entity.isGrounded = false;
    // Add hitstun or state change logic if passed
}

/**
 * Updates physics for a generic entity.
 */
export function updatePhysics(entity) {
    // Apply gravity
    if (!entity.isGrounded) {
        entity.vy += GRAVITY;
    }

    // Apply Velocity
    entity.x += entity.vx;
    entity.y += entity.vy;

    // Apply Friction / Air Resistance
    if (entity.isGrounded) {
        entity.vx *= FRICTION;
    } else {
        entity.vx *= AIR_RESISTANCE;
    }

    // Terminal Velocity
    // entity.vy = Math.min(entity.vy, 15); // Handled by simple clamp if needed, but linear drag helps

    // Reset grounded state for next frame (re-verified by collision)
    entity.isGrounded = false;
    
    // Check World Bounds (Fall off logic)
    // If player falls too far, they die/take massive damage
    // For this map, we'll keep them in bounds horizontally, but allow pit falls
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    if (entity.x > 800) { // World width
        entity.x = 800;
        entity.vx = 0;
    }
}