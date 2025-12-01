/**
 * Collision detection and physics logic
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, JUMP_FORCE, SUPER_JUMP_FORCE } from './globals.js';
import { ParticleSystem } from './particles.js';
import { collideRectRect, collideRectCircle, collideCircleCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

export function updateGamePhysics(p) {
    const player = gameState.player;
    if (!player) return;

    // Platform Collisions
    // Only check collision if player is falling
    if (player.vy > 0) {
        for (const platform of gameState.platforms) {
            if (platform.isBroken) continue;
            
            // Simple AABB check optimization before expensive check
            if (player.x + player.width/2 > platform.x && 
                player.x - player.width/2 < platform.x + platform.width &&
                player.y + player.height/2 > platform.y && 
                player.y + player.height/2 < platform.y + platform.height + player.vy + 5) {
                
                // Confirm previous position was above
                if (player.y - player.vy + player.height/2 <= platform.y + 10) {
                    // Hit!
                    if (platform.type === "BREAKABLE") {
                        platform.isBroken = true;
                        gameState.particles.push(new ParticleSystem(platform.x + platform.width/2, platform.y, [160, 100, 50]));
                        // Slight hop or fall through? Fall through usually.
                        // Let's give a tiny bounce to indicate hit, then fall
                        player.vy = 2; 
                    } else if (platform.hasSpring) {
                        platform.springActive = true;
                        player.jump(SUPER_JUMP_FORCE);
                        // Reset spring visual after short delay (logic handled in platform usually, simplified here)
                        setTimeout(() => platform.springActive = false, 200);
                    } else {
                        player.jump(JUMP_FORCE);
                    }
                }
            }
        }
    }

    // Enemy Collisions
    for (const enemy of gameState.enemies) {
        if (enemy.isDead) continue;
        
        // Player vs Enemy
        // Hitbox slightly smaller than sprite
        let hit = collideRectRect(
            player.x - player.width/3, player.y - player.height/3, player.width*0.6, player.height*0.6,
            enemy.x, enemy.y, enemy.width, enemy.height
        );
        
        if (hit) {
            // Check if Mario-style stomp
            if (player.vy > 0 && player.y < enemy.y) {
                enemy.isDead = true;
                player.jump(JUMP_FORCE);
                gameState.score += 100;
                gameState.particles.push(new ParticleSystem(enemy.x + enemy.width/2, enemy.y, [255, 0, 0]));
            } else {
                player.die();
            }
        }
    }

    // Projectile Collisions
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        
        // Vs Enemies
        for (const enemy of gameState.enemies) {
            if (enemy.isDead) continue;
            
            let hit = collideCircleCircle(proj.x, proj.y, proj.radius*2, enemy.x + enemy.width/2, enemy.y + enemy.height/2, Math.max(enemy.width, enemy.height));
            
            if (hit) {
                enemy.isDead = true;
                proj.active = false;
                gameState.score += 50;
                gameState.particles.push(new ParticleSystem(enemy.x + enemy.width/2, enemy.y, [255, 255, 0]));
                break; // One bullet, one kill
            }
        }
        
        if (!proj.active) {
            gameState.projectiles.splice(i, 1);
        }
    }

    // Collectible Collisions
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const c = gameState.collectibles[i];
        if (c.collected) continue;
        
        // Distance check
        const d = p.dist(player.x, player.y, c.x, c.y);
        if (d < player.width/2 + c.radius) {
            c.collected = true;
            gameState.score += 200;
            gameState.particles.push(new ParticleSystem(c.x, c.y, [255, 215, 0]));
            gameState.collectibles.splice(i, 1);
        }
    }
}