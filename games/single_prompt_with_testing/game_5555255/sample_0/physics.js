import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Axis Aligned Bounding Box collision check
export function checkAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
    );
}

// Sphere vs AABB Collision
// Returns closest point on the AABB to the sphere center
export function closestPointAABB(point, aabb) {
    const x = Math.max(aabb.min.x, Math.min(point.x, aabb.max.x));
    const y = Math.max(aabb.min.y, Math.min(point.y, aabb.max.y));
    const z = Math.max(aabb.min.z, Math.min(point.z, aabb.max.z));
    return new THREE.Vector3(x, y, z);
}

// Handle generic collisions for the game
export function updatePhysics(deltaTime) {
    if (!gameState.player) return;

    // Apply gravity
    if (!gameState.player.onGround) {
        gameState.player.velocity.add(gameState.gravity);
    }

    // Terminal velocity
    gameState.player.velocity.y = Math.max(gameState.player.velocity.y, -1.0);

    // Predict next position
    const potentialPos = gameState.player.mesh.position.clone().add(gameState.player.velocity.clone());
    
    let collided = false;
    let groundY = -999;
    
    // Check Platform Collisions
    // We do a simplified collision response suitable for a rolling ball platformer
    gameState.player.onGround = false;

    // We check platforms
    for (const platform of gameState.platforms) {
        const pBox = new THREE.Box3().setFromObject(platform.mesh);
        
        // Broad phase: Check if we are anywhere near the platform
        // Expand box slightly for sphere radius
        const expandedBox = pBox.clone().expandByScalar(gameState.player.radius);
        
        if (expandedBox.containsPoint(potentialPos)) {
            // Narrow phase
            const closest = closestPointAABB(potentialPos, pBox);
            const dist = potentialPos.distanceTo(closest);
            
            if (dist < gameState.player.radius) {
                // Collision detected
                
                // Determine collision normal
                const normal = potentialPos.clone().sub(closest).normalize();
                
                // If normal is mostly Up, it's a floor
                if (normal.y > 0.7) {
                    gameState.player.onGround = true;
                    // Snap to top
                    potentialPos.y = pBox.max.y + gameState.player.radius;
                    gameState.player.velocity.y = 0;
                } 
                // Wall collision
                else {
                    // Push out
                    const pushOut = normal.multiplyScalar(gameState.player.radius - dist);
                    potentialPos.add(pushOut);
                    
                    // Simple reflection/slide logic for walls
                    const dot = gameState.player.velocity.dot(normal);
                    const reflection = normal.clone().multiplyScalar(dot);
                    gameState.player.velocity.sub(reflection);
                }
            }
        }
    }
    
    // Apply position
    gameState.player.mesh.position.copy(potentialPos);
    
    // Kill plane
    if (gameState.player.mesh.position.y < -15) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

export function checkGoalCollision() {
    if (!gameState.player || !gameState.goal) return false;
    
    const dist = gameState.player.mesh.position.distanceTo(gameState.goal.mesh.position);
    // Goal radius + Player radius
    if (dist < 1.5 + gameState.player.radius) {
        return true;
    }
    return false;
}

export function checkCollectibleCollisions() {
    if (!gameState.player) return;
    
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const c = gameState.collectibles[i];
        const dist = gameState.player.mesh.position.distanceTo(c.mesh.position);
        
        if (dist < 1.0) { // Collect radius
            gameState.score += c.value;
            // Remove from scene
            gameState.scene.remove(c.mesh);
            // Remove from array
            gameState.collectibles.splice(i, 1);
        }
    }
}