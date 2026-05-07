/**
 * Physics Engine
 * Handles collisions, movement integration, and resolution.
 * Uses p5.collide2D for detection and custom logic for resolution.
 */

import { 
    GRAVITY, FRICTION, GROUND_FRICTION, AIR_RESISTANCE, 
    TERMINAL_VELOCITY, BLOCK_SIZE, CANVAS_HEIGHT 
} from './globals.js';

function checkRectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    // Use p5.collide2D global if available, else manual AABB
    if (window.collideRectRect) {
        return window.collideRectRect(x1, y1, w1, h1, x2, y2, w2, h2);
    }
    return (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2);
}

/**
 * Update Physics for a single entity
 * @param {object} entity - The entity to update
 * @param {array} walls - Static geometry
 * @param {array} others - Other dynamic entities (for stacking/pushing)
 */
export function updateEntityPhysics(entity, walls, blocks, picos) {
    // 1. Apply Forces
    if (!entity.isStatic) {
        // Gravity
        entity.vy += GRAVITY;
        entity.vy = Math.min(entity.vy, TERMINAL_VELOCITY);
        
        // Friction
        const friction = entity.grounded ? GROUND_FRICTION : AIR_RESISTANCE;
        entity.vx *= friction;
        
        // Zero out small velocities
        if (Math.abs(entity.vx) < 0.01) entity.vx = 0;
    }

    entity.grounded = false;
    entity.stackedOn = null;

    // 2. Horizontal Movement & Collision
    entity.x += entity.vx;
    handleHorizontalCollisions(entity, walls, blocks, picos);

    // 3. Vertical Movement & Collision
    entity.y += entity.vy;
    handleVerticalCollisions(entity, walls, blocks, picos);

    // 4. Screen Bounds (World Limits)
    if (entity.y > 1000) { // Fell off world
        entity.dead = true;
    }
}

/**
 * Handle Horizontal Collisions
 */
function handleHorizontalCollisions(entity, walls, blocks, picos) {
    // Check Walls
    for (let wall of walls) {
        if (checkRectOverlap(entity.x, entity.y, entity.width, entity.height, wall.x, wall.y, wall.width, wall.height)) {
            // Resolve
            if (entity.vx > 0) { // Moving right
                entity.x = wall.x - entity.width;
            } else if (entity.vx < 0) { // Moving left
                entity.x = wall.x + wall.width;
            }
            entity.vx = 0;
        }
    }

    // Check Blocks (Pushing)
    for (let block of blocks) {
        if (entity === block) continue; // Don't collide self
        
        if (checkRectOverlap(entity.x, entity.y, entity.width, entity.height, block.x, block.y, block.width, block.height)) {
            // Pushing logic: If entity is a Pico, it can push the block
            if (entity.type === 'PICO' && !block.isStatic) {
                // Calculate push force
                const pushFactor = 0.5; // How fast block moves relative to pusher
                
                if (entity.vx > 0) { // Pushing right
                    // Check if block is blocked
                    if (!isBlocked(block, walls, blocks, 1, 0)) {
                        block.x = entity.x + entity.width;
                        block.vx = entity.vx * pushFactor;
                        // entity.x is already inside, resolve entity
                        entity.x = block.x - entity.width;
                    } else {
                        // Block is stuck, stop entity
                        entity.x = block.x - entity.width;
                        entity.vx = 0;
                    }
                } else if (entity.vx < 0) { // Pushing left
                     if (!isBlocked(block, walls, blocks, -1, 0)) {
                        block.x = entity.x - block.width;
                        block.vx = entity.vx * pushFactor;
                        entity.x = block.x + block.width;
                    } else {
                        entity.x = block.x + block.width;
                        entity.vx = 0;
                    }
                }
            } else {
                // Normal solid collision
                if (entity.vx > 0) {
                    entity.x = block.x - entity.width;
                } else if (entity.vx < 0) {
                    entity.x = block.x + block.width;
                }
                entity.vx = 0;
            }
        }
    }

    // Check Picos (Solid horizontal collision)
    if (entity.type === 'PICO') {
        for (let other of picos) {
            if (entity === other) continue;
            if (other.dead) continue;
            
            if (checkRectOverlap(entity.x, entity.y, entity.width, entity.height, other.x, other.y, other.width, other.height)) {
                // Resolve horizontal
                if (entity.vx > 0) {
                    entity.x = other.x - entity.width;
                } else if (entity.vx < 0) {
                    entity.x = other.x + other.width;
                }
                entity.vx = 0;
            }
        }
    }
}

/**
 * Handle Vertical Collisions
 */
function handleVerticalCollisions(entity, walls, blocks, picos) {
    // Check Walls
    for (let wall of walls) {
        if (checkRectOverlap(entity.x, entity.y, entity.width, entity.height, wall.x, wall.y, wall.width, wall.height)) {
            if (entity.vy > 0) { // Falling down
                entity.y = wall.y - entity.height;
                entity.grounded = true;
                entity.vy = 0;
            } else if (entity.vy < 0) { // Jumping up
                entity.y = wall.y + wall.height;
                entity.vy = 0;
            }
        }
    }

    // Check Blocks
    for (let block of blocks) {
        if (entity === block) continue;
        
        if (checkRectOverlap(entity.x, entity.y, entity.width, entity.height, block.x, block.y, block.width, block.height)) {
             if (entity.vy > 0) { // Landing on block
                entity.y = block.y - entity.height;
                entity.grounded = true;
                entity.stackedOn = block;
                entity.vy = 0;
                // Add friction from block movement
                entity.x += block.vx; 
            } else if (entity.vy < 0) { // Hitting head on block
                entity.y = block.y + block.height;
                entity.vy = 0;
            }
        }
    }
    
    // Check Other Picos (Stacking)
    // Only check if falling
    if (entity.type === 'PICO' && entity.vy >= 0) {
        for (let other of picos) {
            if (entity === other) continue;
            if (other.dead) continue;
            
            // Check intersection
            if (checkRectOverlap(entity.x, entity.y, entity.width, entity.height, other.x, other.y, other.width, other.height)) {
                // Determine if we are on top
                // Simple AABB resolution for top-down:
                const overlapY = (Math.min(entity.y + entity.height, other.y + other.height) - Math.max(entity.y, other.y));
                const overlapX = (Math.min(entity.x + entity.width, other.x + other.width) - Math.max(entity.x, other.x));
                
                // If overlap is mostly vertical (standing on head)
                if (overlapX > overlapY && entity.y < other.y) {
                    entity.y = other.y - entity.height;
                    entity.grounded = true;
                    entity.stackedOn = other;
                    entity.vy = 0;
                    
                    // Inherit velocity (platforms)
                    entity.x += other.vx;
                }
            }
        }
    }
}

/**
 * Helper to check if a pushed block would hit something
 */
function isBlocked(block, walls, blocks, dirX, dirY) {
    const testX = block.x + dirX * 2; // Look ahead slightly
    const testY = block.y + dirY * 2;
    
    for (let wall of walls) {
        if (checkRectOverlap(testX, testY, block.width, block.height, wall.x, wall.y, wall.width, wall.height)) {
            return true;
        }
    }
    
    for (let other of blocks) {
        if (block === other) continue;
        if (checkRectOverlap(testX, testY, block.width, block.height, other.x, other.y, other.width, other.height)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check collision between two rectangles
 */
export function checkCollision(a, b) {
    return checkRectOverlap(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height);
}