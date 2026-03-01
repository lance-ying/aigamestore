/**
 * Physics engine for bouncing ball mechanics
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WORLD_GRAVITY, TILE_SIZE, BOUNCE_FORCE } from './globals.js';
import { sphereIntersectsBox } from './utils.js';

export function updatePhysics(deltaTime) {
    const player = gameState.player;
    if (!player) return;

    // Apply Gravity
    player.velocity.y += gameState.gravity.y * (deltaTime * 60); // Normalize to 60fps base

    // Update Position
    player.position.add(player.velocity.clone().multiplyScalar(deltaTime * 60));
    player.mesh.position.copy(player.position);
    
    // Check floor/tile collisions
    checkPlayerTileCollisions(player);
    
    // Check death plane
    if (player.position.y < -10) {
        handleDeath();
    }
}

function checkPlayerTileCollisions(player) {
    // Optimization: Only check tiles nearby based on Z index
    // Since tiles are sorted by Z usually or we can filter
    const playerZ = player.position.z;
    const nearbyTiles = gameState.tiles.filter(t => 
        Math.abs(t.position.z - playerZ) < (TILE_SIZE + 2)
    );

    let landed = false;

    for (const tile of nearbyTiles) {
        // Simple bounds check for "landing" on top
        // We only bounce if we are falling and hitting the top surface
        
        // Tile dimensions
        const halfSize = TILE_SIZE / 2;
        const tileTop = tile.position.y + 0.5; // Box height is 1, so top is y + 0.5
        
        // Horizontal bounds
        const dx = Math.abs(player.position.x - tile.position.x);
        const dz = Math.abs(player.position.z - tile.position.z);
        
        if (dx < halfSize + player.radius * 0.5 && 
            dz < halfSize + player.radius * 0.5) {
            
            // Vertical check: Must be close to top and falling
            if (player.position.y - player.radius <= tileTop + 0.5 && 
                player.position.y > tileTop - 0.5 &&
                player.velocity.y < 0) {
                
                // BOUNCE!
                player.velocity.y = BOUNCE_FORCE;
                player.position.y = tileTop + player.radius; // Snap to surface
                landed = true;
                
                // Trigger tile effect
                tile.onLand();
                gameState.combo++;
                gameState.score += 10 * Math.min(gameState.combo, 10);
                
                // Create impact particles
                createImpactEffect(player.position.clone().setY(tileTop));
                
                break; // Only bounce off one tile
            }
        }
    }
}

function handleDeath() {
    if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "GAME_OVER_LOSE";
        console.log("Player died!");
    }
}

function createImpactEffect(position) {
    // Import dynamically or use global hook if needed, 
    // but for now we'll assume a global particle spawner or event
    // Using a simplified approach here directly if possible, or skip
    if (gameState.player && gameState.player.spawnParticles) {
        gameState.player.spawnParticles(position, 10, 0xffff00);
    }
}