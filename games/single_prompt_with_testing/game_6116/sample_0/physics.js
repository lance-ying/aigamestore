// physics.js
// Collision detection and Physics utilities

import { GRAVITY, MAX_FALL_SPEED, BOUNCE_FACTOR } from './globals.js';

export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    get left() { return this.x; }
    get right() { return this.x + this.w; }
    get top() { return this.y; }
    get bottom() { return this.y + this.h; }
    
    set left(val) { this.x = val; }
    set right(val) { this.x = val - this.w; }
    set top(val) { this.y = val; }
    set bottom(val) { this.y = val - this.h; }

    overlaps(other) {
        return (
            this.left < other.right &&
            this.right > other.left &&
            this.top < other.bottom &&
            this.bottom > other.top
        );
    }
}

export function checkAABBCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Resolves collisions for a moving entity against a list of static platforms.
 * Handles separation and velocity modification (bouncing).
 */
export function resolveCollisions(entity, platforms, logs) {
    entity.grounded = false; // Assume in air until proven otherwise

    // X Axis Resolution
    entity.x += entity.vx;
    let entityBox = entity.getBounds();

    for (const platform of platforms) {
        const platformBox = platform.getBounds();
        
        if (checkAABBCollision(entityBox, platformBox)) {
            // Collision detected on X axis
            
            // Determine direction of collision based on velocity
            if (entity.vx > 0) {
                // Moving right, hit left side of platform
                entity.x = platform.x - entity.width;
                
                // BOUNCE LOGIC
                // Only bounce if airborne or explicitly moving fast
                if (Math.abs(entity.vx) > 1) {
                   // logs.game_info.push(`Bounce Left Wall: ${entity.vx}`);
                    entity.vx = -entity.vx * BOUNCE_FACTOR;
                    // Trigger wall hit effect?
                } else {
                    entity.vx = 0;
                }
            } else if (entity.vx < 0) {
                // Moving left, hit right side of platform
                entity.x = platform.x + platform.width;
                
                if (Math.abs(entity.vx) > 1) {
                   // logs.game_info.push(`Bounce Right Wall: ${entity.vx}`);
                    entity.vx = -entity.vx * BOUNCE_FACTOR;
                } else {
                    entity.vx = 0;
                }
            }
            
            // Update box for next checks
            entityBox = entity.getBounds();
        }
    }

    // Y Axis Resolution
    entity.y += entity.vy;
    entityBox = entity.getBounds();

    for (const platform of platforms) {
        const platformBox = platform.getBounds();

        if (checkAABBCollision(entityBox, platformBox)) {
            // Collision detected on Y axis

            if (entity.vy > 0) {
                // Falling down, hit top of platform
                // Only snap if we were previously above the platform
                // This prevents snapping when moving up into a platform from below
                
                // Precise check: Was the bottom of the player previously above the top of the platform?
                // We approximate this by checking position before Y update
                const prevBottom = (entity.y - entity.vy) + entity.height;
                
                if (prevBottom <= platform.y + 10) { // Tolerance
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                    entity.handleLanding(); // Trigger landing effects
                } else {
                    // Inside block (rare case for high speed), push out
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                }

            } else if (entity.vy < 0) {
                // Jumping up, hit bottom of platform
                entity.y = platform.y + platform.height;
                entity.vy = 0; // Bonk head
                // Maybe play bonk sound/particle
            }

            entityBox = entity.getBounds();
        }
    }
}

/**
 * Apply gravity to an entity
 */
export function applyPhysics(entity) {
    if (!entity.grounded) {
        entity.vy += GRAVITY;
        entity.vy = Math.min(entity.vy, MAX_FALL_SPEED);
    }
}