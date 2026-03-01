import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONFIG } from './globals.js';
import { AABB } from './utils.js';

export class PlayerBall {
    constructor(startPos) {
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        
        // Mesh
        const geometry = new THREE.SphereGeometry(CONFIG.BALL_RADIUS, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: CONFIG.COLORS.BALL,
            roughness: 0.4,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add stripes texture helper or geometry detail to see rotation
        const stripeGeo = new THREE.TorusGeometry(CONFIG.BALL_RADIUS + 0.01, 0.05, 16, 32);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        this.mesh.add(stripe);
        const stripe2 = stripe.clone();
        stripe2.rotation.x = Math.PI / 2;
        this.mesh.add(stripe2);
    }
}

export class LevelBlock {
    constructor(pos, size, type = 'FLOOR') {
        this.position = pos.clone();
        this.size = size.clone();
        this.type = 'BOX'; // Physics type
        
        // AABB
        this.aabb = new AABB(pos, size);
        
        // Mesh
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const color = type === 'FLOOR' ? CONFIG.COLORS.FLOOR : CONFIG.COLORS.WALL;
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(pos);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }
}

export class GoalZone {
    constructor(pos, radius) {
        this.position = pos.clone();
        this.radius = radius;
        
        // Visuals
        const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: CONFIG.COLORS.GOAL,
            emissive: 0x2E7D32,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(pos);
        
        // Particle effect beam
        const beamGeo = new THREE.CylinderGeometry(radius * 0.8, radius * 0.8, 10, 32, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.GOAL,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.beam = new THREE.Mesh(beamGeo, beamMat);
        this.beam.position.y = 5;
        this.mesh.add(this.beam);
    }
    
    update(time) {
        // Pulse effect
        this.mesh.material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
        this.beam.material.opacity = 0.15 + Math.sin(time * 2) * 0.05;
    }
}