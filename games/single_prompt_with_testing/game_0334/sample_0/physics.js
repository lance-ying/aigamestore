// physics.js
import { gameState, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { checkCircleRectCollision } from './utils.js';

export function checkCollisions(p) {
    const player = gameState.player;
    if (!player) return;

    // 1. Player vs Walls
    // Predict next position based on velocity is handled in entity update, 
    // but here we resolve overlaps.
    
    gameState.walls.forEach(wall => {
        // Player is a rectangle for wall collision (hitbox)
        const playerRect = {
            x: player.x - player.width/2,
            y: player.y - player.height/2,
            w: player.width,
            h: player.height
        };
        const wallRect = { x: wall.x, y: wall.y, w: wall.w, h: wall.h };

        // Simple AABB resolution
        // Check X axis overlap
        if (playerRect.x < wallRect.x + wallRect.w &&
            playerRect.x + playerRect.w > wallRect.x &&
            playerRect.y < wallRect.y + wallRect.h &&
            playerRect.y + playerRect.h > wallRect.y) {
            
            // Resolve collision by pushing player out the shortest distance
            // Calculate overlaps
            const overlapX1 = (playerRect.x + playerRect.w) - wallRect.x;
            const overlapX2 = (wallRect.x + wallRect.w) - playerRect.x;
            const overlapY1 = (playerRect.y + playerRect.h) - wallRect.y;
            const overlapY2 = (wallRect.y + wallRect.h) - playerRect.y;

            const minOverlapX = Math.min(overlapX1, overlapX2);
            const minOverlapY = Math.min(overlapY1, overlapY2);

            if (minOverlapX < minOverlapY) {
                // Resolve X
                if (overlapX1 < overlapX2) player.x -= minOverlapX;
                else player.x += minOverlapX;
                player.vx = 0;
            } else {
                // Resolve Y
                if (overlapY1 < overlapY2) player.y -= minOverlapY;
                else player.y += minOverlapY;
                player.vy = 0;
            }
        }
    });

    // 2. Projectiles vs Walls/Player/Enemies
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        let destroyed = false;

        // Wall Collision
        for (let wall of gameState.walls) {
            if (checkCircleRectCollision({x: proj.x, y: proj.y, r: proj.radius}, {x: wall.x, y: wall.y, w: wall.w, h: wall.h})) {
                destroyed = true;
                break;
            }
        }

        if (destroyed) {
            gameState.projectiles.splice(i, 1);
            continue;
        }

        // Hostile Projectile vs Player
        if (proj.isHostile && player) {
            const dx = player.x - proj.x;
            const dy = player.y - proj.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < player.width/2 + proj.radius) {
                if (!player.isDashing) {
                    player.takeDamage(proj.damage);
                    destroyed = true;
                }
            }
        }
        // Player Projectile (if any, currently melee based) vs Enemies
        // Not implemented as player uses melee, but good for extensibility
        
        if (destroyed) {
            gameState.projectiles.splice(i, 1);
        }
    }
}