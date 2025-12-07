/**
 * Physics engine handling collisions and movement.
 */
import { gameState, GRAVITY, MAX_FALL_SPEED, FRICTION, AIR_RESISTANCE, BOUNCE_FACTOR, CANVAS_WIDTH, WORLD_HEIGHT } from './globals.js';
// Removed: import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

export function applyPhysics(entity, p) { // Added p as an argument
    // Apply Gravity
    entity.vy += GRAVITY;
    
    // Cap falling speed
    if (entity.vy > MAX_FALL_SPEED) {
        entity.vy = MAX_FALL_SPEED;
    }

    // Apply Friction / Air Resistance
    if (entity.onGround) {
        entity.vx *= FRICTION;
    } else {
        entity.vx *= AIR_RESISTANCE;
    }
    
    // Stop completely if very slow
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;

    // Apply velocity to position
    // We do axis-separate collision detection for better stability
    
    // X Movement & Collision
    entity.x += entity.vx;
    checkWallCollisions(entity);
    checkPlatformCollisionsX(entity, p); // Pass p

    // Y Movement & Collision
    entity.y += entity.vy;
    
    // Reset ground flag before checking
    entity.onGround = false;
    checkPlatformCollisionsY(entity, p); // Pass p
    checkWorldBounds(entity);
}

function checkWorldBounds(entity) {
    // Floor (Bottom of the world)
    if (entity.y + entity.height >= WORLD_HEIGHT) {
        entity.y = WORLD_HEIGHT - entity.height;
        entity.vy = 0;
        entity.onGround = true;
    }

    // Walls (Left/Right)
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx *= BOUNCE_FACTOR; // Bounce
    } else if (entity.x + entity.width > CANVAS_WIDTH) {
        entity.x = CANVAS_WIDTH - entity.width;
        entity.vx *= BOUNCE_FACTOR; // Bounce
    }
}

function checkWallCollisions(entity) {
    // This is implicitly handled by checkPlatformCollisionsX and WorldBounds
    // But specific logic for bouncing off walls is handled there
}

function checkPlatformCollisionsX(entity, p) { // Added p as an argument
    for (const platform of gameState.platforms) {
        if (p.collideRectRect(entity.x, entity.y, entity.width, entity.height, // Use p.collideRectRect
                            platform.x, platform.y, platform.width, platform.height)) {
            
            // Resolve X collision
            if (entity.vx > 0) { // Moving right
                entity.x = platform.x - entity.width;
            } else if (entity.vx < 0) { // Moving left
                entity.x = platform.x + platform.width;
            }
            
            // Bounce
            entity.vx *= BOUNCE_FACTOR;
        }
    }
}

function checkPlatformCollisionsY(entity, p) { // Added p as an argument
    for (const platform of gameState.platforms) {
        if (p.collideRectRect(entity.x, entity.y, entity.width, entity.height, // Use p.collideRectRect
                            platform.x, platform.y, platform.width, platform.height)) {
            
            // Resolve Y collision
            if (entity.vy > 0) { // Falling down
                entity.y = platform.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
            } else if (entity.vy < 0) { // Jumping up (head bonk)
                entity.y = platform.y + platform.height;
                entity.vy = 0; // Stop upward momentum immediately
            }
        }
    }
}