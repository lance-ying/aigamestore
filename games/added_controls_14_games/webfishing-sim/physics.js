import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Simple AABB collision check
export function checkAABB(box1, box2) {
    return (
        box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
    );
}

// Check collision with water plane (y = 0 generally in this world)
export function getWaterLevel(x, z) {
    // In our generated world, water is at Y=0.
    // However, the island has bounds.
    // Let's assume water is everywhere Y=0 where terrain is < 0.
    return 0;
}

// Get terrain height at x, z
export function getTerrainHeight(x, z) {
    // Simple island generation logic:
    // Center is high, edges low.
    const dist = Math.sqrt(x*x + z*z);
    
    // Island radius 40.
    if (dist > 40) return -5; // Deep ocean
    
    // Perlin-ish noise simulation
    const noise = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
    const islandShape = Math.max(0, 10 - dist * 0.3); // Cone shape
    
    return Math.max(-2, islandShape + noise); 
}

export class PhysicsBody {
    constructor(mesh, options = {}) {
        this.mesh = mesh;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.mass = options.mass || 1.0;
        this.drag = options.drag || 0.1;
        this.isStatic = options.isStatic || false;
        this.radius = options.radius || 0.5;
        this.onGround = false;
        this.inWater = false;
    }

    applyForce(force) {
        if (this.isStatic) return;
        this.acceleration.add(force.clone().divideScalar(this.mass));
    }

    update(deltaTime) {
        if (this.isStatic) return;

        // Apply Gravity
        if (!this.onGround) {
            this.acceleration.add(gameState.gravity);
        }

        // Apply Friction/Drag
        const speed = this.velocity.length();
        if (speed > 0) {
            const dragForce = this.velocity.clone().multiplyScalar(-1).normalize().multiplyScalar(this.drag * speed);
            this.acceleration.add(dragForce);
        }

        // Update Velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(1)); // deltaTime baked into gravity somewhat or assume 60fps logic
        
        // Terminal velocity
        this.velocity.x = THREE.MathUtils.clamp(this.velocity.x, -1, 1);
        this.velocity.y = THREE.MathUtils.clamp(this.velocity.y, -1, 1);
        this.velocity.z = THREE.MathUtils.clamp(this.velocity.z, -1, 1);

        // Predict next position
        const nextPos = this.mesh.position.clone().add(this.velocity.clone().multiplyScalar(1)); // 1 unit of physics time
        
        // Terrain Collision
        const terrainHeight = getTerrainHeight(nextPos.x, nextPos.z);
        const waterLevel = getWaterLevel(nextPos.x, nextPos.z);
        
        // Ground Check
        if (nextPos.y <= terrainHeight) {
            nextPos.y = terrainHeight;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Water Check
        if (nextPos.y <= waterLevel && terrainHeight < waterLevel) {
            this.inWater = true;
            // Float logic or drag
            if (this.onGround === false) {
                 this.velocity.multiplyScalar(0.8); // Water drag
            }
        } else {
            this.inWater = false;
        }

        // Update Mesh Position
        this.mesh.position.copy(nextPos);

        // Reset Acceleration
        this.acceleration.set(0, 0, 0);
    }
}