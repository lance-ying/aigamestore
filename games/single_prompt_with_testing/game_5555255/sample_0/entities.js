import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';

export class Player {
    constructor(x, y, z) {
        this.radius = 0.5;
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.player,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x004444,
            emissiveIntensity: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = 0.02;
        this.maxSpeed = 0.4;
        this.friction = 0.98;
        this.jumpForce = 0.55;
        this.onGround = false;
        
        // Visuals: inner detail to see rotation
        const stripeGeo = new THREE.TorusGeometry(this.radius + 0.01, 0.05, 8, 16);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        this.mesh.add(stripe);

        gameState.scene.add(this.mesh);
    }
    
    update(keys) {
        // Input handling
        const moveForce = new THREE.Vector3(0, 0, 0);
        
        // Acceleration
        if (keys.up) moveForce.z -= this.acceleration;
        if (keys.down) moveForce.z += this.acceleration;
        if (keys.left) moveForce.x -= this.acceleration;
        if (keys.right) moveForce.x += this.acceleration;
        
        // Braking
        if (keys.brake) {
            this.velocity.multiplyScalar(0.9);
        }
        
        // Apply Move Force
        this.velocity.add(moveForce);
        
        // Jump
        if (keys.jump && this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
        
        // Friction (XZ plane)
        if (this.onGround) {
            this.velocity.x *= this.friction;
            this.velocity.z *= this.friction;
        } else {
            // Air drag is less
            this.velocity.x *= 0.99;
            this.velocity.z *= 0.99;
        }
        
        // Cap horizontal speed
        const hVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
        if (hVel.length() > this.maxSpeed) {
            hVel.normalize().multiplyScalar(this.maxSpeed);
            this.velocity.x = hVel.x;
            this.velocity.z = hVel.y;
        }
        
        // Rotate mesh based on velocity for visual effect
        // Axis of rotation is perpendicular to velocity
        const axis = new THREE.Vector3(this.velocity.z, 0, -this.velocity.x).normalize();
        const speed = this.velocity.length();
        if (speed > 0.001) {
            this.mesh.rotateOnWorldAxis(axis, speed / this.radius);
        }
    }
}

export class Platform {
    constructor(x, y, z, width, height, depth, type = 'normal') {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        let color = COLORS.platform;
        if (type === 'danger') color = COLORS.hazard;
        
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true; // Some platforms cast shadows
        
        // Add neon edge
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges, 
            new THREE.LineBasicMaterial({ color: type === 'danger' ? 0xff0000 : COLORS.platformEdge })
        );
        this.mesh.add(line);
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this);
    }
}

export class Collectible {
    constructor(x, y, z) {
        const geometry = new THREE.OctahedronGeometry(0.3, 0);
        const material = new THREE.MeshPhongMaterial({ 
            color: COLORS.collectible,
            emissive: 0xaa6600,
            shininess: 100
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        this.initialY = y;
        this.timer = Math.random() * 10;
        this.value = 50;
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
    }
    
    update(dt) {
        this.timer += dt * 2;
        this.mesh.rotation.y += dt;
        this.mesh.position.y = this.initialY + Math.sin(this.timer) * 0.2;
    }
}

export class Goal {
    constructor(x, y, z) {
        // Torus portal
        const geometry = new THREE.TorusGeometry(1.5, 0.2, 16, 32);
        const material = new THREE.MeshBasicMaterial({ color: COLORS.goal });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.lookAt(x, y, z + 1); // Face Z
        
        // Inner particle effect simulation (a simple glowing sphere)
        const innerGeo = new THREE.SphereGeometry(1.0, 16, 16);
        const innerMat = new THREE.MeshBasicMaterial({ 
            color: COLORS.goal, 
            transparent: true, 
            opacity: 0.3 
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        this.mesh.add(inner);
        
        gameState.scene.add(this.mesh);
        gameState.goal = this;
    }
    
    update(dt) {
        this.mesh.rotation.z += dt; // Spin
    }
}