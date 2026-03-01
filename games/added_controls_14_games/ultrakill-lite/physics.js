import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Axis Aligned Bounding Box Collision
export function checkAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
    );
}

// Simple Sphere collision
export function checkSphereCollision(pos1, radius1, pos2, radius2) {
    const distSq = pos1.distanceToSquared(pos2);
    const radSum = radius1 + radius2;
    return distSq <= radSum * radSum;
}

// Raycasting against enemies
export function raycastEnemies(origin, direction, maxDistance) {
    let closestEnemy = null;
    let closestDist = maxDistance;

    // Create a temporary ray for calculations
    const ray = new THREE.Ray(origin, direction.normalize());

    for (const enemy of gameState.enemies) {
        if (enemy.isDead) continue;

        // Approximate enemy as a bounding box or sphere
        // Simple sphere intersection for performance
        const sphere = new THREE.Sphere(enemy.mesh.position, enemy.hitboxRadius || 1.0);
        
        const intersection = ray.intersectSphere(sphere, new THREE.Vector3());
        
        if (intersection) {
            const dist = origin.distanceTo(intersection);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }
    }

    return closestEnemy ? { enemy: closestEnemy, distance: closestDist } : null;
}

// Static World Collision (Player vs Platforms)
export function handleWorldCollision(entity) {
    // Basic ground plane at Y=0
    if (entity.mesh.position.y <= entity.height / 2) {
        entity.mesh.position.y = entity.height / 2;
        entity.velocity.y = 0;
        entity.onGround = true;
        return;
    }

    // Platform collisions
    entity.onGround = false;
    const playerBox = new THREE.Box3().setFromObject(entity.mesh);
    
    // Add a small buffer for ground checking
    const footBox = playerBox.clone();
    footBox.min.y -= 0.1;

    for (const platform of gameState.platforms) {
        const platBox = new THREE.Box3().setFromObject(platform.mesh);
        
        if (playerBox.intersectsBox(platBox)) {
            // Resolve collision
            // Find penetration depth
            const overlapX = Math.min(playerBox.max.x, platBox.max.x) - Math.max(playerBox.min.x, platBox.min.x);
            const overlapY = Math.min(playerBox.max.y, platBox.max.y) - Math.max(playerBox.min.y, platBox.min.y);
            const overlapZ = Math.min(playerBox.max.z, platBox.max.z) - Math.max(playerBox.min.z, platBox.min.z);

            // Smallest overlap is the resolution axis
            if (overlapY < overlapX && overlapY < overlapZ) {
                if (entity.mesh.position.y > platform.mesh.position.y) {
                    // Landed on top
                    entity.mesh.position.y += overlapY;
                    entity.velocity.y = 0;
                    entity.onGround = true;
                } else {
                    // Hit head
                    entity.mesh.position.y -= overlapY;
                    entity.velocity.y = 0;
                }
            } else if (overlapX < overlapZ) {
                // X axis collision
                if (entity.mesh.position.x > platform.mesh.position.x) {
                    entity.mesh.position.x += overlapX;
                } else {
                    entity.mesh.position.x -= overlapX;
                }
                entity.velocity.x = 0;
            } else {
                // Z axis collision
                if (entity.mesh.position.z > platform.mesh.position.z) {
                    entity.mesh.position.z += overlapZ;
                } else {
                    entity.mesh.position.z -= overlapZ;
                }
                entity.velocity.z = 0;
            }
        }
    }
}