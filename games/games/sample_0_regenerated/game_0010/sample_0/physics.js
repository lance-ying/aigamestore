import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export class PhysicsBody {
    constructor(mesh, mass = 1, radius = 1) {
        this.mesh = mesh;
        this.mass = mass;
        this.radius = radius;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.friction = 0.85;
    }

    applyForce(force) {
        if (this.mass <= 0) return;
        this.acceleration.add(force.clone().divideScalar(this.mass));
    }

    update(dt) {
        // Gravity
        if (!this.onGround && this.mass > 0) {
            this.acceleration.add(gameState.gravity);
        }

        // Integrate
        this.velocity.add(this.acceleration.clone().multiplyScalar(dt));
        
        // Friction (Ground only for X/Z)
        if (this.onGround) {
            this.velocity.x *= this.friction;
            this.velocity.z *= this.friction;
        } else {
            // Air drag
            this.velocity.x *= 0.98;
            this.velocity.z *= 0.98;
        }

        // Move
        const moveStep = this.velocity.clone().multiplyScalar(dt);
        this.mesh.position.add(moveStep);

        // Reset Accel
        this.acceleration.set(0, 0, 0);

        // Ground Collision (Simple Plane y=0)
        this.checkGroundCollision();
        
        // Boundary Collision (Arena walls)
        this.checkArenaBounds();
    }

    checkGroundCollision() {
        if (this.mesh.position.y < 0) {
            this.mesh.position.y = 0;
            this.velocity.y = 0;
            this.onGround = true;
        } else if (this.mesh.position.y <= 0.1 && this.velocity.y <= 0) {
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }

    checkArenaBounds() {
        const bound = gameState.environmentBounds.x;
        const dist = Math.sqrt(this.mesh.position.x**2 + this.mesh.position.z**2);
        
        if (dist > bound) {
            // Push back
            const angle = Math.atan2(this.mesh.position.z, this.mesh.position.x);
            this.mesh.position.x = Math.cos(angle) * bound;
            this.mesh.position.z = Math.sin(angle) * bound;
        }
    }
}

// Broadphase collision (Naive O(N^2) for small entity count is fine)
export function handleCollisions() {
    const ents = gameState.entities;
    
    // Entity vs Entity (Push)
    for (let i = 0; i < ents.length; i++) {
        for (let j = i + 1; j < ents.length; j++) {
            const e1 = ents[i];
            const e2 = ents[j];
            
            // Assuming both have physics bodies and 'radius' property
            if (!e1.isDead && !e2.isDead && e1.physicsBody && e2.physicsBody) {
                const dist = e1.mesh.position.distanceTo(e2.mesh.position);
                const minDist = e1.radius + e2.radius;
                
                if (dist < minDist) {
                    const overlap = minDist - dist;
                    const dir = new THREE.Vector3().subVectors(e1.mesh.position, e2.mesh.position).normalize();
                    
                    // Simple push apart weighted by mass
                    const totalMass = e1.physicsBody.mass + e2.physicsBody.mass;
                    const e1Ratio = e2.physicsBody.mass / totalMass;
                    const e2Ratio = e1.physicsBody.mass / totalMass;
                    
                    e1.mesh.position.add(dir.clone().multiplyScalar(overlap * e1Ratio));
                    e2.mesh.position.sub(dir.clone().multiplyScalar(overlap * e2Ratio));
                }
            }
        }
    }
}