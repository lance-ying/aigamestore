import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

/**
 * Check AABB collision between two rectangular entities
 */
export function checkAABB(ent1, ent2) {
    return (
        ent1.x < ent2.x + ent2.width &&
        ent1.x + ent1.width > ent2.x &&
        ent1.y < ent2.y + ent2.height &&
        ent1.y + ent1.height > ent2.y
    );
}

/**
 * Check if entity intersects with any platform
 */
export function checkPlatformCollisions(entity) {
    let grounded = false;
    
    for (let platform of gameState.platforms) {
        if (checkAABB(entity, platform)) {
            // Determine side of collision
            
            // Overlap amounts
            const overlapLeft = (entity.x + entity.width) - platform.x;
            const overlapRight = (platform.x + platform.width) - entity.x;
            const overlapTop = (entity.y + entity.height) - platform.y;
            const overlapBottom = (platform.y + platform.height) - entity.y;
            
            // Find smallest overlap
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapTop) {
                // Landed on top
                if (entity.vy >= 0) { // Only if falling or flat
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    grounded = true;
                }
            } else if (minOverlap === overlapBottom) {
                // Hit head on bottom
                if (entity.vy < 0) {
                    entity.y = platform.y + platform.height;
                    entity.vy = 0;
                }
            } else if (minOverlap === overlapLeft) {
                // Hit left side of platform (wall)
                entity.x = platform.x - entity.width;
                entity.vx = 0; // Stop horizontal movement if wall hit
            } else if (minOverlap === overlapRight) {
                // Hit right side (rare in auto-runner unless moving back)
                entity.x = platform.x + platform.width;
            }
        }
    }
    
    return grounded;
}

/**
 * Handle collisions between player and enemies
 * Returns true if player died
 */
export function checkEnemyCollisions(player) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        let enemy = gameState.enemies[i];
        if (checkAABB(player, enemy)) {
            // Check if stomp (player bottom is above enemy center and falling)
            const playerBottom = player.y + player.height;
            const enemyTop = enemy.y;
            const enemyCenterY = enemy.y + enemy.height / 2;
            
            // If player is falling and their feet are above the enemy's vertical center + buffer
            if (player.vy > 0 && playerBottom < enemyCenterY + 15) {
                // STOMP!
                enemy.die();
                player.vy = -6; // Bounce off
                gameState.score += 100;
                return false;
            } else {
                // Player hit enemy from side/bottom
                return true; // Player dies
            }
        }
    }
    return false;
}

/**
 * Check collision with collectibles
 */
export function checkCollectibleCollisions(player) {
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        let item = gameState.collectibles[i];
        // Circle-Rect collision approx (using center point distance for coins)
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        
        // Simple AABB for coins is usually sufficient
        if (checkAABB(player, item)) {
            item.collect();
        }
    }
}