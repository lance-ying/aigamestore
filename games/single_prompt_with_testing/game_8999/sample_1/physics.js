import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WORLD_SIZE, WORLD_HEIGHT, BLOCKS } from './globals.js';

export function checkCollision(position, boxSize) {
    // Convert entity AABB to grid coordinates
    // We check the blocks surrounding the player
    const minX = Math.floor(position.x - boxSize.x / 2);
    const maxX = Math.floor(position.x + boxSize.x / 2);
    const minY = Math.floor(position.y - boxSize.y / 2);
    const maxY = Math.floor(position.y + boxSize.y / 2);
    const minZ = Math.floor(position.z - boxSize.z / 2);
    const maxZ = Math.floor(position.z + boxSize.z / 2);

    const collisions = [];

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                if (gameState.world.getBlock(x, y, z) !== BLOCKS.AIR) {
                    collisions.push(new THREE.Vector3(x, y, z));
                }
            }
        }
    }
    return collisions;
}

export function resolveCollision(entity, deltaTime) {
    const originalPos = entity.mesh.position.clone();
    const size = entity.size;
    
    // Y Axis (Gravity/Jumping)
    // Apply velocity first
    entity.mesh.position.y += entity.velocity.y * deltaTime;
    
    let collisions = checkCollision(entity.mesh.position, size);
    entity.onGround = false;

    if (collisions.length > 0) {
        // Simple resolution: if we were above, push up. If below, push down.
        // We only resolve the axis we just moved to prevent sticking
        if (entity.velocity.y < 0) {
            // Falling down
            // Find highest block floor we hit
            // Ideally we snap to the top of the block
            entity.mesh.position.y = Math.ceil(entity.mesh.position.y - size.y/2) + size.y/2; 
            entity.velocity.y = 0;
            entity.onGround = true;
        } else if (entity.velocity.y > 0) {
            // Jumping up into something
            entity.mesh.position.y = Math.floor(entity.mesh.position.y + size.y/2) - size.y/2 - 0.001;
            entity.velocity.y = 0;
        }
    }

    // X Axis
    entity.mesh.position.x += entity.velocity.x * deltaTime;
    collisions = checkCollision(entity.mesh.position, size);
    if (collisions.length > 0) {
        if (entity.velocity.x > 0) {
            entity.mesh.position.x = Math.floor(entity.mesh.position.x + size.x/2) - size.x/2 - 0.001;
        } else if (entity.velocity.x < 0) {
            entity.mesh.position.x = Math.ceil(entity.mesh.position.x - size.x/2) + size.x/2 + 0.001;
        }
        entity.velocity.x = 0;
    }

    // Z Axis
    entity.mesh.position.z += entity.velocity.z * deltaTime;
    collisions = checkCollision(entity.mesh.position, size);
    if (collisions.length > 0) {
        if (entity.velocity.z > 0) {
            entity.mesh.position.z = Math.floor(entity.mesh.position.z + size.z/2) - size.z/2 - 0.001;
        } else if (entity.velocity.z < 0) {
            entity.mesh.position.z = Math.ceil(entity.mesh.position.z - size.z/2) + size.z/2 + 0.001;
        }
        entity.velocity.z = 0;
    }
    
    // World Bounds
    if (entity.mesh.position.y < -10) {
        // Void damage
        if (entity.takeDamage) entity.takeDamage(1000);
    }
}