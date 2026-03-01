import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, PLAYER_RADIUS, LANE_WIDTH, STRAFE_SPEED, ORB_RADIUS, RAMP_WIDTH, RAMP_LENGTH, RAMP_HEIGHT } from './globals.js';
import { lerp } from './utils.js';

/* ===========================
   PLAYER CLASS
   =========================== */
export class Player {
    constructor() {
        // Geometry
        const geometry = new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32);
        this.material = new THREE.MeshStandardMaterial({ 
            color: COLORS.RED,
            roughness: 0.2,
            metalness: 0.5,
            emissive: 0x000000,
            emissiveIntensity: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Initial State
        this.mesh.position.set(0, PLAYER_RADIUS, 0);
        this.lane = 0; // -1, 0, 1
        this.targetX = 0;
        this.color = COLORS.RED;
        
        // Rolling animation
        this.visualRotation = 0;

        gameState.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Continuous forward movement
        const moveDist = gameState.speed * deltaTime;
        this.mesh.position.z -= moveDist; // Moving into negative Z
        gameState.distance += moveDist;

        // Lane Switching (Smooth Lerp)
        this.targetX = this.lane * LANE_WIDTH;
        this.mesh.position.x = lerp(this.mesh.position.x, this.targetX, STRAFE_SPEED);

        // Rolling visual effect
        this.visualRotation -= gameState.speed * deltaTime / PLAYER_RADIUS;
        this.mesh.rotation.x = this.visualRotation;

        // Sync gameState color
        gameState.currentColor = this.color;
    }

    setLane(lane) {
        this.lane = Math.max(-1, Math.min(1, lane));
    }

    setColor(color) {
        this.color = color;
        this.material.color.setHex(color);
        this.material.emissive.setHex(color);
        this.material.emissiveIntensity = 0.2;
    }

    explode() {
        createExplosion(this.mesh.position, this.color, 20);
        this.mesh.visible = false;
    }

    reset() {
        this.mesh.visible = true;
        this.mesh.position.set(0, PLAYER_RADIUS, 0);
        this.lane = 0;
        this.targetX = 0;
        this.setColor(COLORS.RED);
        gameState.distance = 0;
        this.visualRotation = 0;
    }
}

/* ===========================
   ORB (OBSTACLE/COLLECTIBLE)
   =========================== */
export class Orb {
    constructor(x, z, color) {
        const geometry = new THREE.SphereGeometry(ORB_RADIUS, 24, 24);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.1,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, ORB_RADIUS, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.color = color;
        this.active = true;
        this.bobOffset = Math.random() * Math.PI * 2;
        
        gameState.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Gentle bobbing animation
        const time = Date.now() * 0.003;
        this.mesh.position.y = ORB_RADIUS + Math.sin(time + this.bobOffset) * 0.2;
    }

    destroy() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.active = false;
    }
}

/* ===========================
   COLOR RAMP
   =========================== */
export class Ramp {
    constructor(x, z, color) {
        const geometry = new THREE.BoxGeometry(RAMP_WIDTH, RAMP_HEIGHT, RAMP_LENGTH);
        
        // Create a gradient-like texture or just use color
        const material = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 1.0,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });

        this.mesh = new THREE.Mesh(geometry, material);
        // Positioned so player rolls 'up' it slightly or just passes through
        this.mesh.position.set(x, RAMP_HEIGHT/2, z);
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = true;
        
        // Visual flair: Slope rotation
        this.mesh.rotation.x = -0.1; 

        this.color = color;
        this.active = true;

        gameState.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Pulse effect
        const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
        this.mesh.material.emissiveIntensity = pulse;
    }

    destroy() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.active = false;
    }
}

/* ===========================
   PARTICLE SYSTEM (EXPLOSIONS)
   =========================== */
export class Particle {
    constructor(pos, color) {
        const size = Math.random() * 0.2 + 0.1;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(pos);
        
        // Random velocity
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 5
        );
        
        this.life = 1.0; // Seconds
        
        gameState.scene.add(this.mesh);
    }
}

export function createExplosion(pos, color, count) {
    for (let i = 0; i < count; i++) {
        const p = new Particle(pos, color);
        gameState.particles.push(p);
    }
}

/* ===========================
   TRACK SEGMENT
   =========================== */
export class TrackSegment {
    constructor(zPos, length) {
        const geometry = new THREE.PlaneGeometry(LANE_WIDTH * 3 + 4, length);
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.TRACK,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(0, 0, zPos - length/2); // Centered
        this.mesh.receiveShadow = true;

        // Add lane markings
        this.markings = [];
        const markingGeo = new THREE.PlaneGeometry(0.1, length);
        const markingMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        
        const positions = [-LANE_WIDTH/2, LANE_WIDTH/2];
        positions.forEach(x => {
            const mark = new THREE.Mesh(markingGeo, markingMat);
            mark.rotation.x = -Math.PI / 2;
            mark.position.set(x, 0.01, zPos - length/2);
            this.markings.push(mark);
            gameState.scene.add(mark);
        });

        gameState.scene.add(this.mesh);
        this.zStart = zPos;
        this.zEnd = zPos - length;
        this.active = true;
    }

    destroy() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        
        this.markings.forEach(m => {
            gameState.scene.remove(m);
            m.geometry.dispose();
            m.material.dispose();
        });
        
        this.active = false;
    }
}