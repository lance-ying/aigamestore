import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PLAYER_RADIUS, ORB_RADIUS } from './globals.js';

// Sphere to Sphere collision
export function checkSphereCollision(pos1, radius1, pos2, radius2) {
    const distSq = pos1.distanceToSquared(pos2);
    const radiusSum = radius1 + radius2;
    return distSq < (radiusSum * radiusSum);
}

// AABB to Sphere Collision (Simplified for Ramp)
// Ramp is a box, Player is a sphere
export function checkBoxSphereCollision(boxMesh, sphereMesh, sphereRadius) {
    // Get box bounds
    const boxBox = new THREE.Box3().setFromObject(boxMesh);
    
    // Get closest point on box to sphere center
    const spherePos = sphereMesh.position;
    const closestPoint = new THREE.Vector3();
    boxBox.clampPoint(spherePos, closestPoint);
    
    // Check distance
    const distSq = spherePos.distanceToSquared(closestPoint);
    return distSq < (sphereRadius * sphereRadius);
}

export function updatePhysics(deltaTime) {
    // Simple gravity for particles
    gameState.particles.forEach(p => {
        p.velocity.y += -9.8 * deltaTime;
        p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
        p.life -= deltaTime;
    });

    // Clean up dead particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        if (gameState.particles[i].life <= 0) {
            gameState.scene.remove(gameState.particles[i].mesh);
            gameState.particles.splice(i, 1);
        }
    }
}