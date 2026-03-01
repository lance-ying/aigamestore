import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PHYSICS_MATERIALS } from './globals.js';
import { intersectAABB } from './utils.js';

export class PhysicsBody {
    constructor(mesh, options = {}) {
        this.mesh = mesh;
        this.type = options.type || 'dynamic'; // 'dynamic', 'static', 'kinematic'
        this.mass = options.mass || 1.0;
        this.isTrigger = options.isTrigger || false; // If true, detects collisions but no physical response
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        
        // Physics material properties
        this.friction = options.friction || PHYSICS_MATERIALS.DEFAULT.friction;
        this.bounciness = options.bounciness || PHYSICS_MATERIALS.DEFAULT.bounciness;
        
        // Collision Bounds
        this.box = new THREE.Box3();
        this.updateBoundingBox();
        
        // Size for quick checks
        this.size = new THREE.Vector3();
        this.box.getSize(this.size);
        
        // State
        this.onGround = false;
        this.groundObject = null;
    }
    
    updateBoundingBox() {
        // We manually compute box based on position and size to avoid recomputing geometry bounds constantly
        // Assuming mesh origin is center
        if (this.mesh.geometry.boundingBox === null) this.mesh.geometry.computeBoundingBox();
        
        // Transform local AABB to world AABB roughly
        // Ideally we use setFromObject but it can be slow every frame for complex meshes
        // For this game, we use setFromObject for accuracy with moving platforms
        this.box.setFromObject(this.mesh);
        
        // Shrink collision box slightly to prevent getting stuck
        if (this.type === 'dynamic') {
             this.box.expandByScalar(-0.05);
        }
    }
    
    applyForce(force) {
        if (this.type !== 'dynamic') return;
        this.acceleration.add(force.divideScalar(this.mass));
    }
    
    integrate(deltaTime) {
        if (this.type !== 'dynamic') return;
        
        // Apply Gravity
        if (!this.onGround) {
            this.acceleration.add(gameState.gravity);
        }
        
        // Update Velocity
        this.velocity.add(this.acceleration); // deltaTime is handled in gravity vector/logic usually, but let's be precise
        
        // Air resistance / Ground friction
        const damping = this.onGround ? this.friction : 0.98; // Air drag
        this.velocity.x *= damping;
        this.velocity.z *= damping;
        // We rarely damp Y unless in water
        
        // Terminal velocity
        this.velocity.y = Math.max(this.velocity.y, -1.0);
        
        // Update Position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(1.0)); // Assume 60fps locked logic for simplicity, or use deltaTime
        
        // Reset Acceleration
        this.acceleration.set(0, 0, 0);
        
        // Reset Ground State (will be re-evaluated in collision check)
        this.onGround = false;
        this.groundObject = null;
    }
}

export function updatePhysics(deltaTime) {
    // 1. Integrate forces and movement for dynamic entities
    gameState.entities.forEach(entity => {
        if (entity.physicsBody) {
            entity.physicsBody.integrate(deltaTime);
            entity.physicsBody.updateBoundingBox();
        }
    });
    
    // 2. Update kinematic objects (platforms that move)
    gameState.colliders.forEach(collider => {
        if (collider.physicsBody && collider.physicsBody.type === 'kinematic') {
            collider.physicsBody.updateBoundingBox();
        }
    });

    // 3. Resolve Collisions
    // Simple iterative solver: Player vs World
    if (gameState.player && gameState.player.physicsBody) {
        resolveCollisions(gameState.player);
    }
    
    // Other dynamic entities vs World
    gameState.entities.forEach(entity => {
        if (entity !== gameState.player && entity.physicsBody && entity.physicsBody.type === 'dynamic') {
            resolveCollisions(entity);
        }
    });
}

function resolveCollisions(entity) {
    const body = entity.physicsBody;
    const playerBox = body.box;
    
    // Check against all static/kinematic colliders
    for (const collider of gameState.colliders) {
        const colBody = collider.physicsBody;
        if (!colBody) continue;
        
        const colBox = colBody.box;
        
        if (playerBox.intersectsBox(colBox)) {
            if (colBody.isTrigger) {
                if (collider.onTriggerEnter) collider.onTriggerEnter(entity);
                continue;
            }

            // Determine overlap
            const minX = Math.max(playerBox.min.x, colBox.min.x);
            const maxX = Math.min(playerBox.max.x, colBox.max.x);
            const minY = Math.max(playerBox.min.y, colBox.min.y);
            const maxY = Math.min(playerBox.max.y, colBox.max.y);
            const minZ = Math.max(playerBox.min.z, colBox.min.z);
            const maxZ = Math.min(playerBox.max.z, colBox.max.z);
            
            const overlapX = maxX - minX;
            const overlapY = maxY - minY;
            const overlapZ = maxZ - minZ;
            
            // Find minimal penetration axis
            // Prioritize Y to land on things
            
            // Simple resolution: separate on the axis of least penetration
            if (overlapY < overlapX && overlapY < overlapZ) {
                // Vertical collision
                if (body.mesh.position.y > colBody.mesh.position.y) {
                    // Landed on top
                    body.mesh.position.y += overlapY;
                    body.velocity.y = 0;
                    body.onGround = true;
                    body.groundObject = collider;
                    
                    // Transfer velocity from moving platforms
                    if (colBody.type === 'kinematic') {
                        body.mesh.position.add(colBody.velocity);
                    }
                    
                    // Bounce?
                    if (colBody.bounciness > 0.5) {
                        body.velocity.y = colBody.bounciness * 0.5; // Impulse bounce
                        body.onGround = false;
                    }
                } else {
                    // Hit head on bottom
                    body.mesh.position.y -= overlapY;
                    body.velocity.y = 0;
                }
            } else if (overlapX < overlapZ) {
                // X Collision
                const dir = body.mesh.position.x > colBody.mesh.position.x ? 1 : -1;
                body.mesh.position.x += overlapX * dir;
                body.velocity.x *= -0.5; // Wall bounce/friction
                
                // If it's a moving obstacle (hammer), apply big knockback
                if (colBody.type === 'kinematic' && collider.isHazard) {
                     applyKnockback(body, collider);
                }
            } else {
                // Z Collision
                const dir = body.mesh.position.z > colBody.mesh.position.z ? 1 : -1;
                body.mesh.position.z += overlapZ * dir;
                body.velocity.z *= -0.5;
                
                if (colBody.type === 'kinematic' && collider.isHazard) {
                     applyKnockback(body, collider);
                }
            }
            
            // Update box after position correction
            body.updateBoundingBox();
        }
    }
}

function applyKnockback(targetBody, hazard) {
    const force = new THREE.Vector3()
        .subVectors(targetBody.mesh.position, hazard.physicsBody.mesh.position)
        .normalize()
        .multiplyScalar(0.8); // Huge force
    force.y = 0.5; // Kick up
    targetBody.velocity.copy(force);
    
    // Add particle effect logic here potentially
    // Or sound if audio was allowed
}