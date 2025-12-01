import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { getBoundingBox } from './utils.js';

export function updatePhysics(deltaTime) {
    // Apply gravity to all dynamic entities
    const dynamicEntities = [
        gameState.player, 
        ...gameState.enemies, 
        ...gameState.particles,
        ...gameState.collectibles
    ].filter(e => e && e.mesh);

    dynamicEntities.forEach(entity => {
        // Apply Gravity
        if (!entity.onGround && entity.applyGravity !== false) {
            entity.velocity.add(gameState.gravity);
        }

        // Apply Velocity
        entity.mesh.position.add(entity.velocity.clone().multiplyScalar(1)); // deltaTime is handled in logic mostly, keeping physics simple per frame

        // Ground Collision (Simple plane at y = groundY)
        // Entity origin is usually center. Assume height is stored or size.
        const halfHeight = entity.size ? entity.size.y / 2 : 0.5;
        
        // Check Platform Collisions first
        let onPlatform = false;
        if (entity.velocity.y <= 0) { // Only land if falling
            for (const platform of gameState.platforms) {
                if (checkPlatformCollision(entity, platform)) {
                    entity.mesh.position.y = platform.mesh.position.y + platform.size.y/2 + halfHeight;
                    entity.velocity.y = 0;
                    entity.onGround = true;
                    onPlatform = true;
                    break;
                }
            }
        }

        // Floor Collision
        if (!onPlatform) {
            if (entity.mesh.position.y - halfHeight <= gameState.groundY) {
                entity.mesh.position.y = gameState.groundY + halfHeight;
                entity.velocity.y = 0;
                entity.onGround = true;
                
                // Friction
                if (entity.velocity.x !== 0) {
                    entity.velocity.x *= 0.8;
                    if (Math.abs(entity.velocity.x) < 0.01) entity.velocity.x = 0;
                }
                if (entity.velocity.z !== 0) {
                    entity.velocity.z *= 0.8;
                }
            } else {
                entity.onGround = false;
            }
        }
    });
}

function checkPlatformCollision(entity, platform) {
    const entBox = getBoundingBox(entity.mesh);
    const platBox = getBoundingBox(platform.mesh);
    
    // Check if horizontally within bounds
    const horzOverlap = (entBox.max.x > platBox.min.x && entBox.min.x < platBox.max.x) &&
                        (entBox.max.z > platBox.min.z && entBox.min.z < platBox.max.z);
    
    // Check if vertically just above or touching
    // We only care about feet touching top
    const feetY = entBox.min.y;
    const platTop = platBox.max.y;
    
    // Small threshold for landing
    const vertOverlap = feetY <= platTop && feetY >= platTop - 0.5;
    
    return horzOverlap && vertOverlap;
}

export function handleCollisions() {
    if (!gameState.player) return;

    // Player vs Enemies
    gameState.enemies.forEach(enemy => {
        if (gameState.player.mesh.position.distanceTo(enemy.mesh.position) < 1.0) {
            // Take damage or pushback
            if (gameState.frameCount % 60 === 0) { // Throttled damage
                gameState.player.takeDamage(enemy.damage);
            }
            // Pushback
            const pushDir = new THREE.Vector3().subVectors(gameState.player.mesh.position, enemy.mesh.position).normalize();
            pushDir.y = 0.2;
            gameState.player.velocity.add(pushDir.multiplyScalar(0.1));
        }
    });

    // Player vs Collectibles
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const item = gameState.collectibles[i];
        if (gameState.player.mesh.position.distanceTo(item.mesh.position) < 1.5) {
            item.collect();
            gameState.collectibles.splice(i, 1);
            gameState.scene.remove(item.mesh);
        }
    }
}