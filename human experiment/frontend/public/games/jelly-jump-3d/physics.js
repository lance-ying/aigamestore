import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONFIG } from './globals.js';
import { checkAABB } from './utils.js';

export function updatePhysics(timeScale) {
    if (!gameState.player) return;

    const player = gameState.player;

    // Apply Gravity
    if (!player.onGround) {
        // Scale gravity by timeScale
        player.velocity.y += GAME_CONFIG.GRAVITY * timeScale;
    }

    // Apply Velocity
    // Scale position change by timeScale
    player.mesh.position.add(player.velocity.clone().multiplyScalar(timeScale));

    // Ground Check reset
    player.onGround = false;

    // Check collisions with Platforms
    handlePlatformCollisions(player);

    // Check Liquid Collision
    if (gameState.liquid) {
        // Liquid is 50 units high, so top is position.y + 25
        const liquidTop = gameState.liquid.mesh.position.y + 25; 
        const playerBottom = player.mesh.position.y - 0.5;
        
        if (playerBottom < liquidTop) {
            // Drowning logic
            player.takeDamage(100); // Instakill
        }
    }

    // Instant Game Over if falling off map (missed platform)
    // If player falls significantly below the latest spawned platform, they are dead.
    // 15 units is roughly 5 platforms height.
    if (player.mesh.position.y < gameState.lastPlatformHeight - 15) {
        player.takeDamage(100);
    }
}

function handlePlatformCollisions(player) {
    const playerBox = new THREE.Box3().setFromObject(player.mesh);
    
    // Shrink horizontal bounds to avoid snagging on walls, but keep Y accurate for landing
    // We only shrink X and Z so walls don't "grab" the player too easily
    const shrinkXZ = 0.1;
    playerBox.min.x += shrinkXZ; playerBox.max.x -= shrinkXZ;
    playerBox.min.z += shrinkXZ; playerBox.max.z -= shrinkXZ;
    // We do NOT shrink Y. Shrinking Y causes jitter on the floor and missed landings.

    let landed = false;

    for (const platformPair of gameState.platforms) {
        // PlatformPair consists of leftBlock and rightBlock
        const blocks = [platformPair.leftBlock, platformPair.rightBlock];

        for (const block of blocks) {
            const blockBox = new THREE.Box3().setFromObject(block);
            
            if (checkAABB(playerBox, blockBox)) {
                handleSingleBlockCollision(player, block, blockBox, playerBox);
                // Check if we landed (collision from top)
                if (player.velocity.y === 0 && player.onGround) {
                    landed = true;
                }
            }
        }
    }
    
    // Safety floor (invisible ground at start)
    if (player.mesh.position.y <= 1.0 && !landed) {
         if (player.velocity.y < 0) {
             player.mesh.position.y = 1.0;
             player.velocity.y = 0;
             player.onGround = true;
             player.land();
         }
    }
}

function handleSingleBlockCollision(player, block, blockBox, playerBox) {
    // Determine collision normal
    const playerBottom = playerBox.min.y;
    const playerTop = playerBox.max.y;
    const blockTop = blockBox.max.y;
    const blockBottom = blockBox.min.y;
    
    // Top collision (Landing)
    // Increased tolerance to catch fast falling players or edge cases.
    // If feet are within the top 90% of the block while falling, we snap to top.
    const landingTolerance = 0.9; 
    
    if (player.velocity.y <= 0 && 
        playerBottom >= blockTop - landingTolerance) {
        
        player.mesh.position.y = blockTop + 0.5; // Half player height
        player.velocity.y = 0;
        player.onGround = true;
        player.land();
        return;
    }
    
    // Bottom collision (Bonk head)
    if (player.velocity.y > 0 && playerTop <= blockBottom + 0.5) {
        player.mesh.position.y = blockBottom - 0.5;
        player.velocity.y = 0;
        return;
    }
    
    // Side collision (Push or Squish)
    // If blocks are moving (closing), they push the player
    // If player moves into static block, stop player
    
    const overlapX = Math.min(playerBox.max.x, blockBox.max.x) - Math.max(playerBox.min.x, blockBox.min.x);
    const overlapZ = Math.min(playerBox.max.z, blockBox.max.z) - Math.max(playerBox.min.z, blockBox.min.z);
    
    // Resolve smallest overlap (X or Z)
    if (overlapX < overlapZ) {
        const sign = player.mesh.position.x > block.position.x ? 1 : -1;
        player.mesh.position.x += overlapX * sign;
        player.velocity.x = 0;
    } else {
        const sign = player.mesh.position.z > block.position.z ? 1 : -1;
        player.mesh.position.z += overlapZ * sign;
        player.velocity.z = 0;
    }
}