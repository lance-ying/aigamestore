import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, BLOCK_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { hslToHex } from './utils.js';

export class Block {
    constructor(x, y, z, width, depth, color) {
        this.width = width;
        this.depth = depth;
        this.height = BLOCK_HEIGHT;
        
        // Visual Mesh
        const geometry = new THREE.BoxGeometry(width, this.height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            flatShading: true
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Movement Logic for Active Block
        this.isMoving = false;
        this.moveAxis = 'x'; // 'x' or 'z'
        this.moveDirection = 1; // 1 or -1
        this.moveSpeed = 0;
    }
    
    startMoving(axis, speed, startPos) {
        this.isMoving = true;
        this.moveAxis = axis;
        this.moveSpeed = speed;
        this.moveDirection = 1;
        
        // Set initial position based on axis
        // We start far out and move inwards
        const limit = 15; // Starting distance
        if (axis === 'x') {
            this.mesh.position.x = -limit; // Start from left
        } else {
            this.mesh.position.z = -limit; // Start from back
        }
    }

    update(deltaTime) {
        if (!this.isMoving) return;

        const limit = 15;
        
        if (this.moveAxis === 'x') {
            this.mesh.position.x += this.moveSpeed * this.moveDirection * (deltaTime * 60); // Normalize to approx 60fps
            
            // Bounce
            if (this.mesh.position.x > limit) {
                this.mesh.position.x = limit;
                this.moveDirection = -1;
            } else if (this.mesh.position.x < -limit) {
                this.mesh.position.x = -limit;
                this.moveDirection = 1;
            }
        } else {
            this.mesh.position.z += this.moveSpeed * this.moveDirection * (deltaTime * 60);
            
            if (this.mesh.position.z > limit) {
                this.mesh.position.z = limit;
                this.moveDirection = -1;
            } else if (this.mesh.position.z < -limit) {
                this.mesh.position.z = -limit;
                this.moveDirection = 1;
            }
        }
    }
    
    stop() {
        this.isMoving = false;
    }
}

export class Debris {
    constructor(x, y, z, width, depth, color) {
        const geometry = new THREE.BoxGeometry(width, BLOCK_HEIGHT, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            flatShading: true
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        // Gravity
        this.velocity.y -= 0.02 * (deltaTime * 60);
        
        // Move
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
        
        // Rotate
        this.mesh.rotation.x += this.rotationSpeed.x * (deltaTime * 60);
        this.mesh.rotation.y += this.rotationSpeed.y * (deltaTime * 60);
        this.mesh.rotation.z += this.rotationSpeed.z * (deltaTime * 60);
        
        // Remove if too low
        if (this.mesh.position.y < -20) {
            return true; // Return true to signal removal
        }
        return false;
    }
}