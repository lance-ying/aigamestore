import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONFIG } from './globals.js';
import { AABB } from './utils.js';

// Helper to create a globe-style texture with latitude/longitude grid
// This makes the 3D shape obvious from ALL viewing angles
function createBallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color - warm orange
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(0, 0, 512, 512);

    // Create a checkerboard pattern that clearly shows 3D curvature
    const gridSize = 64;
    for (let x = 0; x < 512; x += gridSize) {
        for (let y = 0; y < 512; y += gridSize) {
            const isEven = ((x / gridSize) + (y / gridSize)) % 2 === 0;
            ctx.fillStyle = isEven ? '#FF6B35' : '#FFBA08';
            ctx.fillRect(x, y, gridSize, gridSize);
        }
    }

    // Draw longitude lines (vertical - wrap around equator)
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 3;
    for (let x = 0; x < 512; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
    }

    // Draw latitude lines (horizontal - show curvature from above)
    for (let y = 0; y < 512; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }

    // Add white poles for clear top/bottom reference
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 512, 40);
    ctx.fillRect(0, 472, 512, 40);

    // Add a distinctive marker spot so rotation is clearly visible
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.arc(256, 256, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 3;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

export class PlayerBall {
    constructor(startPos) {
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;

        // Create proper 3D sphere with high segment count
        const geometry = new THREE.SphereGeometry(CONFIG.BALL_RADIUS, 32, 32);

        // Use globe-style texture for clear 3D appearance
        const texture = createBallTexture();

        // MeshPhongMaterial with good specular for obvious 3D shading
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 80,
            specular: 0x888888,
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