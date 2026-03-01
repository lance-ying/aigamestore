import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WORLD_WIDTH } from './globals.js';

export function checkAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x &&
        box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y &&
        box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z &&
        box1.max.z >= box2.min.z
    );
}

export function updatePhysics(deltaTime) {
    if (!gameState.player) return;

    // Boundary Constraints (X-axis)
    const halfWidth = gameState.player.scale.x / 2;
    const limit = (WORLD_WIDTH / 2) - halfWidth;
    
    if (gameState.player.position.x < -limit) {
        gameState.player.position.x = -limit;
        gameState.player.velocity.x = 0;
    }
    if (gameState.player.position.x > limit) {
        gameState.player.position.x = limit;
        gameState.player.velocity.x = 0;
    }

    // Ground Collision (Simple floor at y=0)
    // Player y is calculated based on scale to keep feet on ground, so explicit collision not strictly needed 
    // unless jumping.
    if (gameState.player.position.y < gameState.player.scale.y / 2) {
        gameState.player.position.y = gameState.player.scale.y / 2;
        gameState.player.velocity.y = 0;
        gameState.player.isGrounded = true;
    }

    // Collisions with Obstacles
    const playerBox = new THREE.Box3().setFromObject(gameState.player.mesh);
    // Shrink player box slightly to be forgiving
    playerBox.expandByScalar(-0.1); 

    // Check Obstacles
    for (const obs of gameState.obstacles) {
        // Optimization: Only check nearby obstacles
        if (Math.abs(obs.position.z - gameState.player.position.z) > 10) continue;

        // Obstacles are groups containing multiple mesh parts (colliders)
        for (const child of obs.mesh.children) {
            const partBox = new THREE.Box3().setFromObject(child);
            if (playerBox.intersectsBox(partBox)) {
                handleCrash();
                return;
            }
        }
    }

    // Check Collectibles
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const col = gameState.collectibles[i];
        const colBox = new THREE.Box3().setFromObject(col.mesh);
        
        if (playerBox.intersectsBox(colBox)) {
            // Collect!
            gameState.score += col.value;
            gameState.scene.remove(col.mesh);
            gameState.collectibles.splice(i, 1);
            
            // Spawn particles
            // spawnParticles(col.mesh.position, 0xffff00);
        }
    }
}

function handleCrash() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    // console.log("CRASH!");
}