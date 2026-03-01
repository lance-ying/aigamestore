import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PHYSICS } from './globals.js';
import { getBox, checkAABB } from './utils.js';

export class PhysicsSystem {
    constructor() {
    }

    update(deltaTime) {
        // Just general physics update controller if needed
        // Most entity physics is handled in entity.update()
    }

    // Resolve collision between a dynamic entity and static platforms
    static resolvePlatformCollisions(entity) {
        if (!entity.mesh) return;
        
        const entityBox = getBox(entity.mesh, entity.size);
        entity.onGround = false;

        for (const platform of gameState.platforms) {
            const platformBox = getBox(platform.mesh, platform.size);

            if (checkAABB(entityBox, platformBox)) {
                // Determine direction of collision
                const overlapX = (entity.size.x + platform.size.x) / 2 - Math.abs(entity.mesh.position.x - platform.mesh.position.x);
                const overlapY = (entity.size.y + platform.size.y) / 2 - Math.abs(entity.mesh.position.y - platform.mesh.position.y);
                const overlapZ = (entity.size.z + platform.size.z) / 2 - Math.abs(entity.mesh.position.z - platform.mesh.position.z);

                // Smallest overlap is the axis of collision
                if (overlapY < overlapX && overlapY < overlapZ) {
                    if (entity.mesh.position.y > platform.mesh.position.y) {
                        // Landed on top
                        if (entity.velocity.y <= 0) {
                            entity.mesh.position.y += overlapY;
                            entity.velocity.y = 0;
                            entity.onGround = true;
                        }
                    } else {
                        // Hit head on bottom
                        if (entity.velocity.y > 0) {
                            entity.mesh.position.y -= overlapY;
                            entity.velocity.y = 0;
                        }
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
                
                // Refresh bounding box for next check
                const newBox = getBox(entity.mesh, entity.size);
                entityBox.min = newBox.min;
                entityBox.max = newBox.max;
            }
        }
    }
}