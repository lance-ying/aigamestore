import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, BOUNCE_STRENGTH, checkSphereBoxCollision } from './globals.js';
import { triggerCameraShake } from './camera.js';
import { spawnLandingParticles, spawnPerfectText } from './entities.js';

export function updatePhysics() {
    if (!gameState.player) return;
    
    const player = gameState.player;
    const dt = 1.0; // Fixed time step scaling logic handled in game loop, usually just 1 per frame here

    // 1. Apply Gravity
    player.velocity.y += GRAVITY * dt;
    
    // 2. Update Position
    player.mesh.position.add(player.velocity.clone().multiplyScalar(dt));
    
    // 3. Collision Detection with Tiles
    // Only check collision if falling downward to allow jumping through bottom (though not applicable here really)
    // or just generally when close to surface.
    if (player.velocity.y < 0) {
        let landed = false;
        
        // Optimization: Only check tiles nearby
        // We can sort or just iterate. Since we remove old tiles, array isn't huge (10-20 tiles).
        for (const tile of gameState.tiles) {
            // Check if player is somewhat above the tile vertically
            // Tile top is at tile.y + height/2
            const tileTop = tile.mesh.position.y + tile.height / 2;
            const playerBottom = player.mesh.position.y - player.radius;
            
            // Broad phase vertical check
            if (playerBottom <= tileTop && playerBottom >= tileTop - 0.5) {
                // Narrow phase: Horizontal check
                // Simple AABB check for the tile vs Sphere center
                // We project sphere to XZ plane
                
                const minX = tile.mesh.position.x - tile.width / 2;
                const maxX = tile.mesh.position.x + tile.width / 2;
                const minZ = tile.mesh.position.z - tile.depth / 2;
                const maxZ = tile.mesh.position.z + tile.depth / 2;
                
                if (player.mesh.position.x >= minX - player.radius && 
                    player.mesh.position.x <= maxX + player.radius &&
                    player.mesh.position.z >= minZ - player.radius &&
                    player.mesh.position.z <= maxZ + player.radius) {
                    
                    // COLLISION CONFIRMED
                    handleBounce(player, tile);
                    landed = true;
                    break;
                }
            }
        }
    }
    
    // 4. Kill Z/Y check
    if (player.mesh.position.y < -10) {
        handleDeath();
    }
    
    // 5. Collectible Collision
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const c = gameState.collectibles[i];
        const dist = player.mesh.position.distanceTo(c.mesh.position);
        if (dist < (player.radius + c.radius)) {
            // Collect
            gameState.score += 50;
            gameState.floatingTexts.push(spawnPerfectText(c.mesh.position, "+50"));
            gameState.scene.remove(c.mesh);
            gameState.collectibles.splice(i, 1);
        }
    }
}

function handleBounce(player, tile) {
    // Reset vertical velocity
    player.velocity.y = BOUNCE_STRENGTH;
    
    // Snap to top of tile slightly to prevent sinking
    const tileTop = tile.mesh.position.y + tile.height / 2;
    player.mesh.position.y = tileTop + player.radius;
    
    // Squash effect
    player.mesh.scale.set(1.4, 0.6, 1.4);
    
    // Gameplay logic: Score
    if (tile !== player.lastLandedTile) {
        // Base Score
        gameState.score += 10 * gameState.difficultyMultiplier;
        gameState.combo++;
        
        // Perfect landing check (distance from center X)
        const distFromCenter = Math.abs(player.mesh.position.x - tile.mesh.position.x);
        if (distFromCenter < 0.5) {
            gameState.score += 20;
            spawnPerfectText(player.mesh.position.clone(), "PERFECT!");
            triggerCameraShake(0.2);
            // Visual feedback
            tile.material.emissive.setHex(0x00ff00);
            tile.material.emissiveIntensity = 0.5;
        } else {
            // Normal landing
            tile.material.emissive.setHex(0xffffff);
            tile.material.emissiveIntensity = 0.2;
        }
        
        // Tile animation
        tile.flashTime = 10;
        
        // Update tracking
        player.lastLandedTile = tile;
        
        // Spawn Particles
        spawnLandingParticles(player.mesh.position.clone(), tile.material.color);
    }
}

function handleDeath() {
    if (gameState.gamePhase !== "GAME_OVER_LOSE") {
        gameState.gamePhase = "GAME_OVER_LOSE";
        triggerCameraShake(0.5);
    }
}