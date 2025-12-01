import { gameState } from './globals.js';

// Axis Aligned Bounding Box collision check
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Resolve rectangle vs platforms collision
// Returns updated position and collision flags
export function resolvePlatformCollisions(entity, platforms) {
    let onGround = false;
    let hitCeiling = false;
    let hitWallLeft = false;
    let hitWallRight = false;

    // Check vertical collisions first
    let entityRectY = {
        x: entity.x + entity.vx, // Predictive x for corner catching
        y: entity.y + entity.vy,
        width: entity.width,
        height: entity.height
    };
    
    // We strictly separate X and Y checks for better sliding
    // 1. Y Axis
    for (let platform of platforms) {
        if (checkAABB({x: entity.x, y: entity.y + entity.vy, width: entity.width, height: entity.height}, platform)) {
            // Moving Down
            if (entity.vy > 0) {
                // Land on top
                // Only snap if we were previously above the platform
                if (entity.y + entity.height <= platform.y + 10) { // Tolerance
                     entity.y = platform.y - entity.height;
                     entity.vy = 0;
                     onGround = true;
                }
            }
            // Moving Up
            else if (entity.vy < 0) {
                // Hit bottom
                if (entity.y >= platform.y + platform.height - 10) {
                    entity.y = platform.y + platform.height;
                    entity.vy = 0;
                    hitCeiling = true;
                }
            }
        }
    }

    // 2. X Axis
    for (let platform of platforms) {
        if (checkAABB({x: entity.x + entity.vx, y: entity.y, width: entity.width, height: entity.height}, platform)) {
            // Moving Right
            if (entity.vx > 0) {
                entity.x = platform.x - entity.width;
                entity.vx = 0;
                hitWallRight = true;
            }
            // Moving Left
            else if (entity.vx < 0) {
                entity.x = platform.x + platform.width;
                entity.vx = 0;
                hitWallLeft = true;
            }
        }
    }

    entity.onGround = onGround;
    return { onGround, hitCeiling, hitWallLeft, hitWallRight };
}

export function checkAttackHitbox(attacker, hitboxRect, targetList) {
    let hits = [];
    for (let target of targetList) {
        if (target === attacker) continue; // Don't hit self
        if (target.invincible) continue;
        
        if (checkAABB(hitboxRect, target)) {
            hits.push(target);
        }
    }
    return hits;
}