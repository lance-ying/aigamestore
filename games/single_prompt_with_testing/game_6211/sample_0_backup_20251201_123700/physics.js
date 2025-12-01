// physics.js
// Collision detection and resolution

import { TILE_SIZE } from './globals.js';

// AABB Collision check
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Resolve collisions between a dynamic entity and static platforms
export function resolveMapCollision(entity, platforms) {
    entity.onGround = false;
    entity.isWallSliding = false;
    
    // We separate X and Y axis resolution to prevent getting stuck
    
    // --- X Axis ---
    entity.x += entity.vx;
    let entityRect = getEntityRect(entity);
    
    for (let platform of platforms) {
        if (checkAABB(entityRect, platform)) {
            // Collision detected on X axis
            if (entity.vx > 0) { // Moving Right
                entity.x = platform.x - entity.width;
                // If in air and moving into wall, enable wall slide
                if (entity.vy > 0) entity.isWallSliding = true;
            } else if (entity.vx < 0) { // Moving Left
                entity.x = platform.x + platform.width;
                if (entity.vy > 0) entity.isWallSliding = true;
            }
            entity.vx = 0;
            // Update rect for Y check
            entityRect = getEntityRect(entity);
        }
    }
    
    // --- Y Axis ---
    entity.y += entity.vy;
    entityRect = getEntityRect(entity);
    
    for (let platform of platforms) {
        if (checkAABB(entityRect, platform)) {
            // Collision detected on Y axis
            if (entity.vy > 0) { // Falling down
                entity.y = platform.y - entity.height;
                entity.onGround = true;
                entity.vy = 0;
                entity.isWallSliding = false; // Cannot slide if on ground
            } else if (entity.vy < 0) { // Jumping up
                entity.y = platform.y + platform.height;
                entity.vy = 0; // Bonk head
            }
        }
    }
}

function getEntityRect(entity) {
    return {
        x: entity.x,
        y: entity.y,
        width: entity.width,
        height: entity.height
    };
}

// Raycast helper for AI
export function raycast(x, y, dx, dy, length, platforms) {
    const endX = x + dx * length;
    const endY = y + dy * length;
    
    // Simple line check against rectangles
    // Note: This is a simplified check, checking discrete points along the ray
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
        const checkX = x + (dx * length * (i/steps));
        const checkY = y + (dy * length * (i/steps));
        
        for (let p of platforms) {
            if (checkX >= p.x && checkX <= p.x + p.width &&
                checkY >= p.y && checkY <= p.y + p.height) {
                return true; // Hit
            }
        }
    }
    return false;
}