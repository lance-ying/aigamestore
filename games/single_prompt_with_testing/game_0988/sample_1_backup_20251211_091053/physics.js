import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, MAX_FALL_Y } from './globals.js';

export class PhysicsSystem {
    constructor() {
        this.collisionList = [];
    }
    
    update(dt) {
        // Update Player Physics
        if (gameState.player) {
            this.updateEntity(gameState.player, dt);
            
            // Check Ground Collision
            let onGround = false;
            let platformY = -1000;
            
            // Optimization: Only check platforms near the player
            // Spatial partitioning would be better, but linear scan of nearby is okay for this runner
            // We can filter by distance or simply iterate active platforms
            
            const playerBox = new THREE.Box3().setFromObject(gameState.player.mesh);
            // Shrink box slightly for forgiving gameplay
            playerBox.expandByScalar(-0.2); 
            
            for (const platform of gameState.platforms) {
                // Simple distance cull
                if (platform.mesh.position.distanceToSquared(gameState.player.mesh.position) > 100) continue;
                
                const platformBox = new THREE.Box3().setFromObject(platform.mesh);
                
                // Check intersection
                if (playerBox.intersectsBox(platformBox)) {
                    // Check if strictly above
                    // We want the player to land ON TOP, not intersect from side
                    const playerBottom = gameState.player.mesh.position.y - gameState.player.radius;
                    const platformTop = platform.mesh.position.y + platform.height / 2;
                    
                    if (playerBottom >= platformTop - 0.2 && gameState.player.velocity.y <= 0) {
                        onGround = true;
                        platformY = platformTop + gameState.player.radius;
                        // Snap to top
                        if (gameState.player.mesh.position.y < platformY) {
                            gameState.player.mesh.position.y = platformY;
                        }
                        break; // Found ground
                    }
                }
            }
            
            gameState.player.onGround = onGround;
            if (onGround) {
                gameState.player.velocity.y = 0;
            }
            
            // Collectibles Collision
            for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
                const gem = gameState.collectibles[i];
                if (gem.mesh.position.distanceTo(gameState.player.mesh.position) < (gameState.player.radius + gem.radius)) {
                    gem.collect();
                }
            }
            
            // Check Kill Condition
            if (gameState.player.mesh.position.y < MAX_FALL_Y) {
                gameState.player.die();
            }
        }
        
        // Update Particles Physics
        gameState.particles.forEach(p => p.update(dt));
    }
    
    updateEntity(entity, dt) {
        // Apply Gravity
        if (!entity.onGround) {
            entity.velocity.add(GRAVITY.clone().multiplyScalar(entity.mass)); // dt is implicit in fixed step physics usually, but here frame based
        }
        
        // Apply Velocity
        entity.mesh.position.add(entity.velocity.clone().multiplyScalar(1.0)); // scale by 1 for frame logic
        
        // Friction? No friction in air for this game, constant speed forward
    }
}

export const physicsSystem = new PhysicsSystem();