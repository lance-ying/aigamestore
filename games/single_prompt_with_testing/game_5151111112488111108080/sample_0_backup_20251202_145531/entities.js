import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLOR_PLAYER, COLOR_TILE_BASE, COLOR_PERFECT } from './globals.js';
import { createMaterial } from './utils.js';

/**
 * Player Class
 */
export class Player {
    constructor(x, y, z) {
        this.radius = 0.5;
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: COLOR_PLAYER,
            roughness: 0.1,
            metalness: 0.1,
            emissive: 0xaa0033,
            emissiveIntensity: 0.4
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.lastLandedTile = null;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        // Recover scale from squash/stretch
        this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
        
        // Rotate ball based on movement
        this.mesh.rotation.x -= this.velocity.z * 2.0;
        this.mesh.rotation.z -= this.velocity.x * 2.0;
    }
}

/**
 * Tile Class
 */
export class Tile {
    constructor(x, y, z, width, depth, type = "NORMAL") {
        this.width = width;
        this.height = 1.0;
        this.depth = depth;
        this.type = type;
        
        const geometry = new THREE.BoxGeometry(width, this.height, depth);
        // Create a unique material instance so we can flash it individually
        this.material = new THREE.MeshStandardMaterial({
            color: COLOR_TILE_BASE,
            roughness: 0.2,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        
        this.flashTime = 0;
        this.baseY = y;
        
        // Add random slight vertical offset for variation
        // this.mesh.position.y += (Math.random() - 0.5) * 0.2;
        
        gameState.scene.add(this.mesh);
        gameState.entities.push(this);
        gameState.tiles.push(this);
        
        // Moving tile props
        this.moveSpeed = 0.05;
        this.moveRange = 3.0;
        this.initialX = x;
        this.moveOffset = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        // Handle Move logic
        if (this.type === "MOVING") {
            this.mesh.position.x = this.initialX + Math.sin(gameState.time * 2 + this.moveOffset) * this.moveRange;
        }
        
        // Flash effect decay
        if (this.material.emissiveIntensity > 0) {
            this.material.emissiveIntensity *= 0.9;
        }
        
        // Remove if too far behind player
        if (gameState.player && this.mesh.position.z > gameState.player.mesh.position.z + 10) {
            this.destroy();
        }
    }
    
    destroy() {
        this.mesh.geometry.dispose();
        this.material.dispose();
        gameState.scene.remove(this.mesh);
        
        // Remove from arrays
        const eIdx = gameState.entities.indexOf(this);
        if (eIdx > -1) gameState.entities.splice(eIdx, 1);
        
        const tIdx = gameState.tiles.indexOf(this);
        if (tIdx > -1) gameState.tiles.splice(tIdx, 1);
    }
}

/**
 * Particle Class for visual effects
 */
export class Particle {
    constructor(position, color) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        this.life = 1.0;
        
        gameState.scene.add(this.mesh);
        gameState.entities.push(this);
        gameState.particles.push(this);
    }
    
    update(dt) {
        this.velocity.y -= 0.02; // Gravity
        this.mesh.position.add(this.velocity);
        this.mesh.rotation.x += 0.1;
        this.mesh.rotation.y += 0.1;
        
        this.life -= 0.05;
        this.mesh.scale.setScalar(this.life);
        
        if (this.life <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        gameState.scene.remove(this.mesh);
        
        const idx = gameState.particles.indexOf(this);
        if (idx > -1) gameState.particles.splice(idx, 1);
        const eIdx = gameState.entities.indexOf(this);
        if (eIdx > -1) gameState.entities.splice(eIdx, 1);
    }
}

/**
 * Floating Text for scores
 * Note: Since we can't use fonts, we'll implement this using 2D canvas in ui.js
 * or simplified 3D particles. 
 * Actually, for this strict environment, let's use a 2D Overlay approach managed in UI.
 * But we need an entity to track the world position.
 */
export class FloatingText {
    constructor(position, text) {
        this.position = position.clone();
        this.text = text;
        this.life = 1.0;
        this.velocity = new THREE.Vector3(0, 0.05, 0);
        gameState.floatingTexts.push(this);
    }
    
    update() {
        this.position.add(this.velocity);
        this.life -= 0.02;
        if (this.life <= 0) {
            const idx = gameState.floatingTexts.indexOf(this);
            if (idx > -1) gameState.floatingTexts.splice(idx, 1);
        }
    }
}

/**
 * Collectible (Diamond)
 */
export class Collectible {
    constructor(x, y, z) {
        this.radius = 0.3;
        const geometry = new THREE.OctahedronGeometry(this.radius, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x0044aa,
            shininess: 100
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        this.floatOffset = Math.random() * Math.PI;
        this.baseY = y;
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
        gameState.entities.push(this);
    }
    
    update(dt) {
        this.mesh.rotation.y += 0.05;
        this.mesh.position.y = this.baseY + Math.sin(gameState.time * 3 + this.floatOffset) * 0.2;
        
        // Remove if behind
        if (gameState.player && this.mesh.position.z > gameState.player.mesh.position.z + 10) {
            this.destroy();
        }
    }
    
    destroy() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        gameState.scene.remove(this.mesh);
        
        const idx = gameState.collectibles.indexOf(this);
        if (idx > -1) gameState.collectibles.splice(idx, 1);
        const eIdx = gameState.entities.indexOf(this);
        if (eIdx > -1) gameState.entities.splice(eIdx, 1);
    }
}

// Spawner Helpers
export function spawnLandingParticles(pos, color) {
    for (let i = 0; i < 8; i++) {
        new Particle(pos, color);
    }
}

export function spawnPerfectText(pos, text) {
    return new FloatingText(pos, text);
}