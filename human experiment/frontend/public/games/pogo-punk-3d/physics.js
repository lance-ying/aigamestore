import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, FRICTION, AIR_RESISTANCE } from './globals.js';

export class AABB {
    constructor(min, max) {
        this.min = min || new THREE.Vector3();
        this.max = max || new THREE.Vector3();
    }
    
    setFromObject(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        this.min.copy(box.min);
        this.max.copy(box.max);
        return this;
    }

    intersects(other) {
        return (
            this.min.x <= other.max.x &&
            this.max.x >= other.min.x &&
            this.min.y <= other.max.y &&
            this.max.y >= other.min.y &&
            this.min.z <= other.max.z &&
            this.max.z >= other.min.z
        );
    }
}

export function checkPlatformCollisions(entity, platforms) {
    // Simple AABB vs AABB for now, but specialized for pogo stick tip
    // Returns collision data or null
    
    const entityBox = new THREE.Box3().setFromObject(entity.mesh);
    // Shrink box slightly for forgiveness
    entityBox.expandByScalar(-0.1);

    for (const platform of platforms) {
        const platformBox = new THREE.Box3().setFromObject(platform.mesh);
        
        if (entityBox.intersectsBox(platformBox)) {
            // Determine collision side
            // Mostly care about landing on top
            const entityBottom = entityBox.min.y;
            const platformTop = platformBox.max.y;
            
            // If we are falling and feet are near top
            if (entity.velocity.y < 0 && Math.abs(entityBottom - platformTop) < 0.5) {
                return {
                    type: 'floor',
                    y: platformTop,
                    platform: platform
                };
            }
            
            // Side collision (basic wall)
            // Determine if left or right
            const entityCenter = new THREE.Vector3();
            entityBox.getCenter(entityCenter);
            
            const platformCenter = new THREE.Vector3();
            platformBox.getCenter(platformCenter);
            
            if (entityCenter.x < platformCenter.x) {
                return { type: 'wall_right', x: platformBox.min.x };
            } else {
                return { type: 'wall_left', x: platformBox.max.x };
            }
        }
    }
    return null;
}

export function updatePhysics(entity, deltaTime) {
    // Apply Gravity
    entity.velocity.y += GRAVITY;
    
    // Apply Air Resistance
    entity.velocity.multiplyScalar(AIR_RESISTANCE);
    
    // Apply Velocity to Position
    entity.position.add(entity.velocity.clone().multiplyScalar(deltaTime * 60)); // Normalize to ~60FPS scale
    
    // Update Mesh
    entity.mesh.position.copy(entity.position);
    entity.mesh.rotation.z = entity.rotation;
}