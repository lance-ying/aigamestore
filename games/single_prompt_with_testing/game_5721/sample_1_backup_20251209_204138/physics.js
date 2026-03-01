/**
 * Physics Engine
 * Handles collisions, resolution, and spatial queries.
 */

import { gameState, GRAVITY, FRICTION_GROUND, FRICTION_AIR, BOUNCE_RESTITUTION, TERMINAL_VELOCITY } from './globals.js';
import { checkCircleRectCollision, addCameraShake } from './utils.js';
import { Platform, Spike, Collectible, Goal } from './entities.js';

export function updatePhysics(p) {
    const player = gameState.player;
    if (!player) return;

    // 1. Apply Gravity
    player.vy += GRAVITY;
    
    // 2. Apply Air Resistance / Friction
    if (player.onGround) {
        player.vx *= FRICTION_GROUND;
    } else {
        player.vx *= FRICTION_AIR;
    }
    
    // 3. Terminal Velocity
    player.vy = Math.min(player.vy, TERMINAL_VELOCITY);
    player.vy = Math.max(player.vy, -TERMINAL_VELOCITY);

    // 4. Update Position (Provisional)
    player.x += player.vx;
    player.y += player.vy;

    // Reset ground flag
    player.onGround = false;

    // 5. Collision Detection
    // We check platforms, obstacles, and collectibles
    
    // -- Platforms --
    // Optimization: Only check platforms near the player (Simple spatial partitioning by X)
    const renderBuffer = 200;
    const nearbyPlatforms = gameState.platforms.filter(plat => 
        Math.abs(plat.x - player.x) < renderBuffer + plat.width && 
        plat.active
    );

    for (let plat of nearbyPlatforms) {
        const col = checkCircleRectCollision(player, plat);
        if (col) {
            resolvePlatformCollision(player, plat, col);
        }
    }

    // -- Obstacles (Spikes) --
    const nearbyObstacles = gameState.obstacles.filter(obs => 
        Math.abs(obs.x - player.x) < renderBuffer
    );

    for (let obs of nearbyObstacles) {
        if (obs instanceof Spike) {
            // Simple distance check usually sufficient for spikes + radius
            // Or use point in triangle if refined
            if (obs.checkCollision(player)) {
                player.die();
                addCameraShake(10);
                return; // Stop physics processing on death
            }
        }
    }

    // -- Collectibles --
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const item = gameState.collectibles[i];
        if (item.active && Math.abs(item.x - player.x) < 50) { // Broad phase
            if (item.checkCollision(player)) {
                item.collect();
            }
        }
    }

    // -- World Bounds --
    if (player.y > gameState.camera.y + gameState.camera.viewportHeight + 200) {
        player.die(); // Fell off the world
    }
}

function resolvePlatformCollision(player, platform, collision) {
    // Push out
    player.x -= collision.normalX * collision.overlap;
    player.y -= collision.normalY * collision.overlap;

    // Velocity reflection logic
    // Dot product of velocity and normal
    const dot = player.vx * collision.normalX + player.vy * collision.normalY;

    // Only bounce if moving towards the object
    if (dot < 0) {
        // Calculate restitution (bounciness)
        let restitution = BOUNCE_RESTITUTION;
        if (platform.type === 'BOUNCY') restitution = 1.2; // Super bounce

        // Reflect velocity vector: V_new = V - (1 + e) * (V . N) * N
        const impulse = -(1 + restitution) * dot;
        
        player.vx += impulse * collision.normalX;
        player.vy += impulse * collision.normalY;

        // Ground detection
        // If normalY is roughly -1 (pointing up), we are on top
        if (collision.normalY < -0.7) {
            player.onGround = true;
            player.canDoubleJump = true; // Reset jump ability
            
            // Special platform logic
            if (platform.type === 'VANISHING') {
                platform.triggerVanish();
            }
            if (platform.type === 'MOVING') {
                // Add platform velocity to player (friction)
                player.x += platform.vx;
                player.y += platform.vy;
            }
        }
    }
}