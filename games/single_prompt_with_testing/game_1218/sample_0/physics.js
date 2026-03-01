/**
 * physics.js
 * Collision detection and resolution.
 */

// Removed: import { collideRectRect } from 'https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js';
import { gameState, CANVAS_WIDTH, WORLD_HEIGHT } from './globals.js';

export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    
    static fromEntity(entity) {
        return new AABB(entity.x - entity.width/2, entity.y - entity.height/2, entity.width, entity.height);
    }
}

/**
 * General rectangle collision check
 */
export function checkCollision(ent1, ent2, p) { // Added p parameter
    return p.collideRectRect( // Used p.collideRectRect
        ent1.x - ent1.width/2, ent1.y - ent1.height/2, ent1.width, ent1.height,
        ent2.x - ent2.width/2, ent2.y - ent2.height/2, ent2.width, ent2.height
    );
}

/**
 * Resolve Entity vs Platform collisions
 * Handles solid platforms and one-way (jump-through) platforms.
 */
export function resolveMapCollisions(entity, platforms, p) { // Added p parameter
    let grounded = false;

    // We check vertical and horizontal separately for better sliding
    // For this simple platformer, we primarily check vertical landing for one-way platforms
    // and full box for solid walls.
    
    // Sort platforms by proximity to optimize? optional.
    
    for (let platform of platforms) {
        // Simple AABB check first
        if (checkCollision(entity, platform, p)) { // Passed p to checkCollision
            
            // One-way platform logic (Jump through from bottom, land on top)
            if (platform.type === 'ONE_WAY') {
                // Only collide if falling downwards and previous frame position was above platform
                const entityBottom = entity.y + entity.height/2;
                const platformTop = platform.y - platform.height/2;
                const prevBottom = entity.prevY + entity.height/2;
                
                // Allow a small margin of error for high speeds
                if (entity.vy >= 0 && prevBottom <= platformTop + 5 && entityBottom >= platformTop) {
                    // Snap to top
                    entity.y = platformTop - entity.height/2;
                    entity.vy = 0;
                    grounded = true;
                }
            }
            // Solid platform logic
            else if (platform.type === 'SOLID') {
                // Determine direction of collision
                const dx = entity.x - platform.x;
                const dy = entity.y - platform.y;
                const combinedHalfW = entity.width/2 + platform.width/2;
                const combinedHalfH = entity.height/2 + platform.height/2;
                
                // Calculate overlap
                const overlapX = combinedHalfW - Math.abs(dx);
                const overlapY = combinedHalfH - Math.abs(dy);
                
                if (overlapX < overlapY) {
                    // Horizontal collision
                    if (dx > 0) { // Hit from right
                        entity.x += overlapX;
                    } else { // Hit from left
                        entity.x -= overlapX;
                    }
                    entity.vx = 0;
                } else {
                    // Vertical collision
                    if (dy > 0) { // Hit from bottom
                        entity.y += overlapY;
                        entity.vy = 0;
                    } else { // Hit from top (landing)
                        entity.y -= overlapY;
                        entity.vy = 0;
                        grounded = true;
                    }
                }
            }
        }
    }
    
    // World bounds collision
    if (entity.x - entity.width/2 < 0) {
        entity.x = entity.width/2;
        entity.vx = 0;
    }
    if (entity.x + entity.width/2 > CANVAS_WIDTH) {
        entity.x = CANVAS_WIDTH - entity.width/2;
        entity.vx = 0;
    }
    // Floor of the tower
    if (entity.y + entity.height/2 > WORLD_HEIGHT) {
        entity.y = WORLD_HEIGHT - entity.height/2;
        entity.vy = 0;
        grounded = true;
    }

    return grounded;
}

/**
 * Raycast utility
 */
export function raycast(x, y, dx, dy, length, typeFilter = 'SOLID') {
    const steps = 10;
    for (let i = 0; i < steps; i++) {
        const cx = x + (dx * length * (i/steps));
        const cy = y + (dy * length * (i/steps));
        
        for (let p of gameState.platforms) {
            if (p.type === typeFilter || typeFilter === 'ALL') {
                 if (cx > p.x - p.width/2 && cx < p.x + p.width/2 &&
                     cy > p.y - p.height/2 && cy < p.y + p.height/2) {
                     return { hit: true, x: cx, y: cy, entity: p };
                 }
            }
        }
    }
    return { hit: false };
}