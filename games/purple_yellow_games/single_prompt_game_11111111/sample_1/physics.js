/**
 * Physics engine and collision detection
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, PLATFORM_HEIGHT, PLATFORM_WIDTH } from './globals.js';
import { Platform } from './entities.js';

// Simple collision detection helpers
function collideRectCircle(rx, ry, rw, rh, cx, cy, diameter) {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    
    // Calculate distance between circle center and closest point
    const distX = cx - closestX;
    const distY = cy - closestY;
    const distSquared = (distX * distX) + (distY * distY);
    
    // Check if distance is less than radius
    const radius = diameter / 2;
    return distSquared < (radius * radius);
}

export function updatePhysics(p) {
    const player = gameState.player;
    if (!player) return;

    // Apply Gravity
    player.vy += GRAVITY;
    
    // Apply Friction to Horizontal Movement
    player.vx *= gameState.friction || 0.85;

    // Update Position
    player.x += player.vx;
    player.y += player.vy;

    // Screen Wrap-around
    if (player.x > CANVAS_WIDTH) {
        player.x = 0;
    } else if (player.x < 0) {
        player.x = CANVAS_WIDTH;
    }

    // Check Platform Collisions (Only when falling)
    if (player.vy > 0) {
        // Simple optimization: check only nearby platforms
        for (let platform of gameState.platforms) {
            // Check bounds manually for AABB + slight forgiveness
            // Player feet must be near platform top
            const playerBottom = player.y + player.height / 2;
            const platformTop = platform.y;
            
            // Allow a small threshold for collision detection to feel good
            const withinVerticalThreshold = playerBottom >= platformTop && playerBottom <= platformTop + 20;
            const withinHorizontalBounds = player.x + player.width/4 > platform.x && player.x - player.width/4 < platform.x + platform.width;

            if (withinVerticalThreshold && withinHorizontalBounds) {
                // Determine bounce force based on platform type
                if (platform.type !== 'BROKEN') {
                    player.jump(platform.type === 'SPRING' ? 'HIGH' : 'NORMAL');
                    platform.onJump();
                    
                    // Spawn landing particles
                    // Note: In a full system we'd import createParticles here, avoiding circular dep by passing logic or events
                } else {
                    // Break the platform
                    platform.break();
                }
            }
        }
    }
    
    // Check Enemy Collisions
    for (let enemy of gameState.enemies) {
        const hit = collideRectCircle(
            player.x - player.width/2, player.y - player.height/2, player.width, player.height,
            enemy.x, enemy.y, enemy.radius * 2
        );
        
        if (hit && !enemy.isDead) {
            // If player falls onto enemy, maybe kill enemy? 
            // Design choice: Classic doodle jump is instant death on touch unless shooting.
            // Let's make it instant death for simplicity and challenge.
            player.die();
        }
    }

    // Check Collectible Collisions
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const c = gameState.collectibles[i];
        const hit = collideRectCircle(
            player.x - player.width/2, player.y - player.height/2, player.width, player.height,
            c.x, c.y, c.radius * 2
        );
        
        if (hit) {
            c.collect();
        }
    }
    
    // Check Projectile Collisions with Enemies
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        let projRemoved = false;
        
        // Remove if off screen
        if (proj.y < gameState.cameraY - 100) {
            gameState.projectiles.splice(i, 1);
            continue;
        }

        for (let e = gameState.enemies.length - 1; e >= 0; e--) {
            const enemy = gameState.enemies[e];
            const hit = collideRectCircle(
                proj.x - proj.width/2, proj.y - proj.height/2, proj.width, proj.height,
                enemy.x, enemy.y, enemy.radius * 2
            );
            
            if (hit) {
                enemy.die();
                gameState.projectiles.splice(i, 1);
                projRemoved = true;
                break;
            }
        }
    }

    // Check Death (Falling below screen)
    // The "bottom" of the screen is cameraY + CANVAS_HEIGHT
    if (player.y > gameState.cameraY + CANVAS_HEIGHT + 50) {
        player.die();
    }
}