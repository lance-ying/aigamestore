/**
 * physics.js
 * Handles collision detection, resolution, and physics calculations.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Checks AABB collision between two rectangular entities
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
 * Resolves collision between a dynamic entity (player/enemy) and static platforms.
 * Uses a separated axis approach for stability.
 */
export function resolvePlatformCollisions(entity, platforms) {
    entity.onGround = false;
    entity.isWallSliding = false;
    
    // Optimization: Only check platforms near the entity
    // A simple spatial check: platform is within X range of entity
    const checkRange = TILE_SIZE * 3;
    
    for (const platform of platforms) {
        // Broad phase culling
        if (Math.abs((platform.x + platform.width/2) - (entity.x + entity.width/2)) > checkRange + platform.width) {
            continue;
        }

        if (checkAABB(entity, platform)) {
            // Determine penetration depths
            const overlapX = (entity.width + platform.width) / 2 - Math.abs((entity.x + entity.width / 2) - (platform.x + platform.width / 2));
            const overlapY = (entity.height + platform.height) / 2 - Math.abs((entity.y + entity.height / 2) - (platform.y + platform.height / 2));

            // Resolve along the axis of least penetration
            if (overlapX < overlapY) {
                // Horizontal Collision
                if (entity.x < platform.x) {
                    entity.x -= overlapX; // Push left
                    // Wall interaction logic could go here
                } else {
                    entity.x += overlapX; // Push right
                }
                entity.vx = 0;
            } else {
                // Vertical Collision
                if (entity.y < platform.y) {
                    entity.y -= overlapY; // Land on top
                    entity.vy = 0;
                    entity.onGround = true;
                    // Special interaction for jump pads
                    if (platform.type === 'BOUNCE') {
                        entity.vy = -15; // Bounce!
                        entity.onGround = false;
                    }
                } else {
                    entity.y += overlapY; // Hit head
                    entity.vy = 0;
                }
            }
        }
    }
}

/**
 * Apply general physics (gravity, friction) to an entity
 */
export function applyPhysics(entity, gravityStrength, frictionStrength) {
    // Apply gravity
    entity.vy += gravityStrength;
    
    // Apply friction to horizontal movement
    if (entity.onGround) {
        entity.vx *= frictionStrength;
    } else {
        entity.vx *= 0.95; // Air resistance
    }
    
    // Update position
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // Terminal velocity
    if (entity.vy > 15) entity.vy = 15;
    
    // Very small velocities to zero
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;
}

/**
 * Helper to determine if a point is inside a rect
 */
export function pointInRect(x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}