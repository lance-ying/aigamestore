/**
 * Physics and collision detection system.
 * Handles AABB collisions, entity movement, and world interactions.
 */

import { gameState, GRAVITY, FRICTION, AIR_RESISTANCE, TERMINAL_VELOCITY, CANVAS_HEIGHT } from './globals.js';

// Import p5.collide2D functions (assuming loaded globally in index, but good to wrap)
// Since we are in a module and constraints say "Allowed libraries: p5.collide2D", 
// we assume window.collideRectRect etc are available or we implement AABB manually for robustness.
// For this strict implementation, I will implement custom AABB for tilemaps and use p5.collide2D for entities.

/**
 * Base Physics Body class that Entities inherit from.
 */
export class PhysicsBody {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = 1; // 1 Right, -1 Left
    }

    applyPhysics() {
        // Gravity
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // Friction
        if (this.isGrounded) {
            this.vx *= FRICTION;
        } else {
            this.vx *= AIR_RESISTANCE;
        }

        // Near-zero cleanup
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
}

/**
 * Checks AABB Collision between two rectangles.
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
 * Resolves collisions between an entity and the tilemap.
 * @param {PhysicsBody} entity 
 * @param {Level} level 
 */
export function resolveMapCollision(entity, level) {
    entity.isGrounded = false;

    // We check corners and midpoints for collision
    // A simplified robust method: separate X and Y axis checks
    // But since we already updated X and Y in applyPhysics, we need to correct.
    
    // This is a naive implementation. A better one updates X, checks X collision, corrects X.
    // Then updates Y, checks Y collision, corrects Y.
    // We will refactor the update loop in entities to do this split step if possible, 
    // or we do "resolve" here by pushing out.
    
    // Get tiles around entity
    const startCol = Math.floor(entity.x / level.tileSize);
    const endCol = Math.floor((entity.x + entity.width) / level.tileSize);
    const startRow = Math.floor(entity.y / level.tileSize);
    const endRow = Math.floor((entity.y + entity.height) / level.tileSize);

    // Check Wall Collisions (Horizontal)
    // We essentially need the previous position to know which way to push, 
    // but we can infer from velocity.
    
    // To be precise: collision usually handled by moving X, check, moving Y, check.
    // We'll do a corrective pass.
    
    // Check Ground/Ceiling
    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            const tile = level.getTile(c, r);
            if (tile && tile.solid) {
                const tileRect = {
                    x: c * level.tileSize,
                    y: r * level.tileSize,
                    width: level.tileSize,
                    height: level.tileSize
                };

                // Calculate overlap
                const ox = (Math.min(entity.x + entity.width, tileRect.x + tileRect.width) - Math.max(entity.x, tileRect.x));
                const oy = (Math.min(entity.y + entity.height, tileRect.y + tileRect.height) - Math.max(entity.y, tileRect.y));

                if (ox > 0 && oy > 0) {
                    // Resolve along the axis of least penetration
                    if (ox > oy) {
                        // Vertical Collision
                        if (entity.vy > 0) { // Falling
                            entity.y -= oy;
                            entity.vy = 0;
                            entity.isGrounded = true;
                        } else if (entity.vy < 0) { // Jumping into ceiling
                            entity.y += oy;
                            entity.vy = 0;
                        }
                    } else {
                        // Horizontal Collision
                        // Only resolve X if we are not stepping up a small slope (not implemented)
                        // and if overlap Y is significant (to avoid snagging on floor seams)
                        if (oy > 2) { 
                            if (entity.vx > 0 || (entity.vx === 0 && entity.x < tileRect.x)) { // Moving Right
                                entity.x -= ox;
                                entity.vx = 0;
                            } else if (entity.vx < 0 || (entity.vx === 0 && entity.x > tileRect.x)) { // Moving Left
                                entity.x += ox;
                                entity.vx = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    // World Bounds
    if (entity.x < 0) { entity.x = 0; entity.vx = 0; }
    if (entity.y > CANVAS_HEIGHT + 200) { 
        // Fell off world
        if (entity.die) entity.die();
    }
}

/**
 * Checks if an entity is on a platform.
 * Used for AI logic.
 */
export function isEntityOnGround(entity, level) {
    // Check points just below feet
    const y = entity.y + entity.height + 2;
    const leftX = entity.x;
    const rightX = entity.x + entity.width;
    
    const tile1 = level.getTileAt(leftX, y);
    const tile2 = level.getTileAt(rightX, y);
    
    return (tile1 && tile1.solid) || (tile2 && tile2.solid);
}