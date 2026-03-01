import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONFIG } from './globals.js';
import { AABB } from './utils.js';

// Helper to create a texture for the ball
function createBallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background Color (Base)
    ctx.fillStyle = '#' + new THREE.Color(CONFIG.COLORS.BALL).getHexString();
    ctx.fillRect(0, 0, 512, 256);
    
    // Checkerboard Pattern
    const rows = 4;
    const cols = 8;
    const cellW = 512 / cols;
    const cellH = 256 / rows;
    
    ctx.fillStyle = '#FFFFFF';
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // Checker pattern logic
            if ((x + y) % 2 === 0) {
                ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
            }
        }
    }
    
    // Add numbers/text to make orientation obvious
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw numbers on the white squares
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if ((x + y) % 2 === 0) {
                ctx.fillText(`${x}-${y}`, x * cellW + cellW/2, y * cellH + cellH/2);
            }
        }
    }
    
    // Add a distinct equator line
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.lineTo(512, 128);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export class PlayerBall {
    constructor(startPos) {
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        
        // Mesh - Increased segments for smoother sphere
        const geometry = new THREE.SphereGeometry(CONFIG.BALL_RADIUS, 64, 64);
        
        // Use texture with checkerboard
        const texture = createBallTexture();
        
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.2, // Shinier to show curvature
            metalness: 0.1,
            color: 0xffffff
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
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