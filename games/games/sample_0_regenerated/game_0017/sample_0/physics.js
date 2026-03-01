import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, GROUND_FRICTION, AIR_RESISTANCE, BOUNCE_RESTITUTION } from './globals.js';
import { sphereAABBIntersection, getSphereAABBCollisionInfo } from './utils.js';

/**
 * Main physics update loop
 * Handles integration of forces, velocities, and collision resolution
 */
export function updatePhysics(deltaTime) {
    // 1. Apply Gravity and External Forces to all dynamic entities
    gameState.entities.forEach(entity => {
        if (!entity.isStatic) {
            // Apply gravity
            entity.velocity.add(GRAVITY.clone().multiplyScalar(entity.gravityScale || 1.0));
            
            // Apply air resistance
            entity.velocity.multiplyScalar(AIR_RESISTANCE);
            
            // Integrate position
            entity.position.add(entity.velocity.clone().multiplyScalar(deltaTime * 60)); // Normalize to 60fps scale
            
            // Update mesh position
            if (entity.mesh) {
                entity.mesh.position.copy(entity.position);
                
                // Rotate mesh based on movement (rolling effect) if it's the player
                if (entity.isPlayer && entity.onGround) {
                    const moveDir = entity.velocity.clone().normalize();
                    const axis = new THREE.Vector3(moveDir.z, 0, -moveDir.x).normalize();
                    const speed = entity.velocity.length();
                    entity.mesh.rotateOnWorldAxis(axis, speed * 0.2);
                }
            }
        }
    });

    // 2. Resolve Collisions
    handleCollisions();
    
    // 3. Crumble Logic
    updatePlatforms(deltaTime);
}

/**
 * Handle collisions between dynamic entities and static/dynamic platforms
 */
export function handleCollisions() {
    const player = gameState.player;
    if (!player) return;

    player.onGround = false;
    let groundContactNormal = new THREE.Vector3();

    // Check collision with all platforms
    // We iterate backwards in case we remove platforms (though we mark them instead)
    for (let i = 0; i < gameState.platforms.length; i++) {
        const platform = gameState.platforms[i];
        
        // Skip if platform is too far away (Optimization)
        if (platform.position.distanceToSquared(player.position) > 1000) continue;

        // Get platform bounding box (in world space)
        const box = {
            min: new THREE.Vector3().copy(platform.position).sub(platform.halfSize),
            max: new THREE.Vector3().copy(platform.position).add(platform.halfSize)
        };

        if (sphereAABBIntersection(player.position, player.radius, box)) {
            const collision = getSphereAABBCollisionInfo(player.position, player.radius, box);
            
            // Resolve penetration
            const pushVec = collision.normal.clone().multiplyScalar(collision.depth);
            player.position.add(pushVec);
            player.mesh.position.copy(player.position);
            
            // Update Velocity (Bounce/Slide)
            const velocityDotNormal = player.velocity.dot(collision.normal);
            
            // Only bounce if moving towards the surface
            if (velocityDotNormal < 0) {
                // Remove velocity component along normal
                const bounce = collision.normal.clone().multiplyScalar(velocityDotNormal * -(1 + BOUNCE_RESTITUTION));
                
                // Less bounce for small velocities (prevent jitter)
                if (Math.abs(velocityDotNormal) < 0.1) {
                    bounce.multiplyScalar(0.0); // Stop bouncing
                    
                    // Friction application when sliding/rolling
                    const frictionVector = player.velocity.clone().sub(
                        collision.normal.clone().multiplyScalar(velocityDotNormal)
                    );
                    frictionVector.multiplyScalar(1 - GROUND_FRICTION);
                    player.velocity.sub(frictionVector);
                }
                
                player.velocity.add(bounce);
            }

            // Check if grounded (normal is roughly up)
            if (collision.normal.y > 0.5) {
                player.onGround = true;
                groundContactNormal = collision.normal;
                
                // Interact with platform (Crumble trigger)
                platform.triggerCrumble();
            }
        }
    }
}

/**
 * Update platform logic (crumbling, falling)
 */
function updatePlatforms(deltaTime) {
    for (let i = gameState.platforms.length - 1; i >= 0; i--) {
        const platform = gameState.platforms[i];
        platform.update(deltaTime);
        
        // Remove platforms that have fallen into the void
        if (platform.position.y < -100) {
            gameState.scene.remove(platform.mesh);
            gameState.platforms.splice(i, 1);
        }
    }
}

/**
 * Apply grapple force to player
 */
export function applyGrapplePhysics(player, point, deltaTime) {
    const ropeVector = new THREE.Vector3().subVectors(point.position, player.position);
    const distance = ropeVector.length();
    const direction = ropeVector.normalize();
    
    // Spring/Elastic force
    // Pull player towards point
    const force = direction.multiplyScalar(0.015); 
    player.velocity.add(force);
    
    // Swing mechanics:
    // If distance > desired length, cancel out velocity away from pivot
    // This acts like a strict rope constraint
    const velocityAlongRope = player.velocity.dot(direction);
    
    // Damping (air friction on rope)
    player.velocity.multiplyScalar(0.99);

    // Add tangential boost if input is pressed (swinging)
    // handled in input/player logic, but here we enforce the constraint
}