import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Simple Spatial Hashing or just naive loop for this scale
export function checkCollisions(entity) {
    // Wall/Fence collisions
    // Define world bounds (The garden is enclosed)
    const worldSize = 40;
    
    if (entity.mesh.position.x > worldSize) entity.mesh.position.x = worldSize;
    if (entity.mesh.position.x < -worldSize) entity.mesh.position.x = -worldSize;
    if (entity.mesh.position.z > worldSize) entity.mesh.position.z = worldSize;
    if (entity.mesh.position.z < -worldSize) entity.mesh.position.z = -worldSize;

    // Static Prop Collisions (Trees, Fences, Shed)
    // Using simple distance check for cylindrical collision
    for (const prop of gameState.staticProps) {
        const dx = entity.mesh.position.x - prop.position.x;
        const dz = entity.mesh.position.z - prop.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        const minDistance = entity.radius + prop.radius;

        if (dist < minDistance) {
            // Push back
            const angle = Math.atan2(dz, dx);
            const pushX = Math.cos(angle) * minDistance;
            const pushZ = Math.sin(angle) * minDistance;
            
            entity.mesh.position.x = prop.position.x + pushX;
            entity.mesh.position.z = prop.position.z + pushZ;
        }
    }
}

export function updatePhysics(entity, deltaTime) {
    // Apply Gravity
    if (entity.mesh.position.y > gameState.groundLevel) {
        entity.velocity.add(gameState.gravity.clone().multiplyScalar(deltaTime));
    }

    // Move
    entity.mesh.position.add(entity.velocity.clone().multiplyScalar(deltaTime));

    // Ground Collision
    if (entity.mesh.position.y <= gameState.groundLevel) {
        entity.mesh.position.y = gameState.groundLevel;
        entity.velocity.y = 0;
        entity.onGround = true;
        
        // Ground Friction
        entity.velocity.x *= 0.8;
        entity.velocity.z *= 0.8;
    } else {
        entity.onGround = false;
    }
    
    checkCollisions(entity);
}