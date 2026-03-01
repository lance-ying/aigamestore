/**
 * utils.js
 * Math helpers and collision detection wrappers.
 */
import { collideRectRect, collideRectCircle, collideLineRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState } from './globals.js';

export function checkCollision(entityA, entityB) {
    // Simple AABB
    return (
        entityA.x < entityB.x + entityB.width &&
        entityA.x + entityA.width > entityB.x &&
        entityA.y < entityB.y + entityB.height &&
        entityA.y + entityA.height > entityB.y
    );
}

export function distSq(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

// Check if an entity is on a platform
export function resolvePlatformCollision(entity) {
    let onGround = false;
    
    // Bottom of the world safety net
    if (entity.y + entity.height >= gameState.worldHeight) {
        entity.y = gameState.worldHeight - entity.height;
        entity.vy = 0;
        onGround = true;
        
        // If it's the player falling into the void, teleport to top and take damage
        if (entity.type === 'PLAYER') {
            entity.y = 0;
            entity.x = 100; // Reset to start
            entity.takeDamage(10); // Penalty
            onGround = false;
        }
    }

    // Check platforms
    // Optimization: Only check platforms roughly near the entity
    for (const plat of gameState.platforms) {
        // Broad phase check
        if (entity.x + entity.width > plat.x && entity.x < plat.x + plat.width) {
            
            // Checking feet against platform top (Landing)
            // Previous frame entity was above platform, current frame is inside/below
            const prevBottom = (entity.y - entity.vy) + entity.height;
            
            if (prevBottom <= plat.y && entity.y + entity.height >= plat.y) {
                // Snap to top
                entity.y = plat.y - entity.height;
                entity.vy = 0;
                onGround = true;
            }
        }
    }
    
    return onGround;
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}