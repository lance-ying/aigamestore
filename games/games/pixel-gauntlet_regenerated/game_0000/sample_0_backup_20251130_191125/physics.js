import { collideRectRect } from 'https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js';
import { gameState } from './globals.js';

export function checkCollision(entityA, entityB) {
    // Simple AABB collision
    return (
        entityA.x < entityB.x + entityB.width &&
        entityA.x + entityA.width > entityB.x &&
        entityA.y < entityB.y + entityB.height &&
        entityA.y + entityA.height > entityB.y
    );
}

export function resolvePlatformCollisions(entity) {
    entity.onGround = false;
    
    // Broad phase optimization could go here (spatial hash), 
    // but iterating all platforms is fine for this scale.
    for (const platform of gameState.platforms) {
        // Only check if entity is close to platform
        if (entity.x + entity.width > platform.x && 
            entity.x < platform.x + platform.width) {
            
            // Checking falling down onto platform
            if (entity.vy >= 0 && 
                entity.y + entity.height <= platform.y + platform.height && // Was above or inside
                entity.y + entity.height + entity.vy >= platform.y) { // Will be below or touching
                
                // Snap to top
                if (entity.y + entity.height <= platform.y + 10) { // Tolerance
                   entity.y = platform.y - entity.height;
                   entity.vy = 0;
                   entity.onGround = true;
                }
            }
        }
    }
}

export function checkAttackCollision(attackBox, enemies) {
    const hits = [];
    for (const enemy of enemies) {
        if (checkCollision(attackBox, enemy)) {
            hits.push(enemy);
        }
    }
    return hits;
}