/**
 * Game entities: Player, Tile, Collectible
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLOR_PLAYER, COLOR_TILE_BASE, COLOR_TILE_EMISSIVE, TILE_SIZE, getSpeed, LATERAL_SPEED, LATERAL_FRICTION, MAX_LATERAL_SPEED } from './globals.js';
import { Particle } from './particles.js';
import { clamp, lerp } from './utils.js';

export class Player {
    constructor() {
        this.radius = 0.9; // Larger ball
        this.position = new THREE.Vector3(0, 0.9, 0); // Corrected initial Y position based on radius
        this.velocity = new THREE.Vector3(0, 0, getSpeed(1));
        
        // Mesh
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: COLOR_PLAYER,
            emissive: COLOR_PLAYER,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Light
        this.light = new THREE.PointLight(COLOR_PLAYER, 1, 10);
        this.mesh.add(this.light);
        
        this.reset();
    }
    
    reset() {
        this.position.set(0, this.radius, 0); // Reset to radius height
        this.velocity.set(0, 0, getSpeed(1));
        this.mesh.position.copy(this.position);
        this.rotationSpeed = 0;
    }
    
    update(dt) {
        // Movement Logic is partly handled in physics, but control logic is here
        this.handleInput(dt);
        
        // Rotate ball based on movement
        this.mesh.rotation.x -= this.velocity.z * 0.5;
        this.mesh.rotation.z -= this.velocity.x * 0.5;
        
        // Update Log
        if (gameState.frameCount % 10 === 0) {
            if (window.logs && window.logs.player_info) {
                 window.logs.player_info.push({
                     x: this.position.x,
                     y: this.position.y,
                     z: this.position.z,
                     frame: gameState.frameCount
                 });
            }
        }
    }
    
    handleInput(dt) {
        // Control Mode Switching
        if (gameState.controlMode === "HUMAN") {
            this.handleHumanInput(dt);
        } else if (gameState.controlMode.startsWith("TEST")) {
            this.handleAIInput(dt);
        }
    }
    
    handleHumanInput(dt) {
        const keys = gameState.keys;
        const left = keys.ArrowLeft || keys.KeyA;
        const right = keys.ArrowRight || keys.KeyD;
        
        // Acceleration (Flipped controls as per user feedback)
        if (left) this.velocity.x += LATERAL_SPEED * 0.1; // Left arrow now adds to X, moving right
        if (right) this.velocity.x -= LATERAL_SPEED * 0.1; // Right arrow now subtracts from X, moving left
        
        // Friction / Damping
        this.velocity.x *= LATERAL_FRICTION;
        
        // Clamping
        this.velocity.x = clamp(this.velocity.x, -MAX_LATERAL_SPEED, MAX_LATERAL_SPEED);
        
        // Progressive Forward Speed
        this.velocity.z = getSpeed(gameState.level);
    }
    
    handleAIInput(dt) {
        // Simple AI: Look at next tile and steer towards x
        // Find closest tile in front of player
        const pz = this.position.z;
        const upcomingTiles = gameState.tiles.filter(t => t.position.z > pz).sort((a, b) => a.position.z - b.position.z);
        
        if (upcomingTiles.length > 0) {
            const target = upcomingTiles[0];
            const targetX = target.position.x;
            
            // Suicide for Test 3
            if (gameState.controlMode === "TEST_3") {
                this.velocity.x = 0.5; // Hard right
                return;
            }
            
            // Steer
            const diff = targetX - this.position.x;
            if (Math.abs(diff) > 0.1) {
                this.velocity.x += Math.sign(diff) * LATERAL_SPEED * 0.15;
            }
            
            this.velocity.x *= LATERAL_FRICTION;
            this.velocity.x = clamp(this.velocity.x, -MAX_LATERAL_SPEED, MAX_LATERAL_SPEED);
        }
        this.velocity.z = getSpeed(gameState.level);
    }
    
    spawnParticles(pos, count, color) {
        for(let i=0; i<count; i++) {
            new Particle(pos, color, 0.1, 1.0);
        }
    }
}

export class Tile {
    constructor(x, z, palette = null) {
        this.size = TILE_SIZE;
        this.position = new THREE.Vector3(x, -0.5, z); // Top surface at y=0 relative to origin, but mesh center is -0.5
        
        const geometry = new THREE.BoxGeometry(this.size, 1, this.size);
        
        // Use provided palette or default globals
        const baseColor = palette ? palette.base : COLOR_TILE_BASE;
        const emissiveColor = palette ? palette.emissive : COLOR_TILE_EMISSIVE;
        
        const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: emissiveColor,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.receiveShadow = true;
        
        // Add a wireframe for the "neon" look
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMat = new THREE.LineBasicMaterial({ color: emissiveColor });
        const wireframe = new THREE.LineSegments(edges, lineMat);
        this.mesh.add(wireframe);
        
        // Animation state
        this.targetScale = 1;
        this.currentScale = 0; // Pop in effect
        
        gameState.scene.add(this.mesh);
        gameState.tiles.push(this);
    }
    
    update(dt) {
        // Pop in animation
        if (this.currentScale < this.targetScale) {
            this.currentScale = lerp(this.currentScale, this.targetScale, dt * 5);
            this.mesh.scale.setScalar(this.currentScale);
        }
        
        // Pulse if active
        // Cleanup if far behind
        if (gameState.player && this.position.z < gameState.player.position.z - 20) {
            this.destroy();
        }
    }
    
    onLand() {
        this.mesh.material.emissiveIntensity = 2.0; // Flash
        // Reset slowly in update? simplified:
        setTimeout(() => {
             if(this.mesh) this.mesh.material.emissiveIntensity = 0.2;
        }, 200);
    }
    
    destroy() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
        
        const idx = gameState.tiles.indexOf(this);
        if (idx > -1) gameState.tiles.splice(idx, 1);
    }
}

export class Collectible {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 1.5, z);
        
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffa500,
            emissiveIntensity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
        
        this.t = Math.random() * 100;
    }
    
    update(dt) {
        this.t += dt;
        // Float and rotate
        this.mesh.rotation.y += 2 * dt;
        this.mesh.position.y = 1.5 + Math.sin(this.t * 2) * 0.3;
        
        // Check collision
        if (gameState.player) {
            const dist = this.mesh.position.distanceTo(gameState.player.position);
            if (dist < 1.0 + gameState.player.radius) { // Adjust for player size
                this.collect();
            }
        }
        
        // Despawn
        if (gameState.player && this.position.z < gameState.player.position.z - 10) {
            this.destroy();
        }
    }
    
    collect() {
        gameState.score += 50;
        // Particle effect
        if (gameState.player.spawnParticles) {
            gameState.player.spawnParticles(this.position, 5, 0xffd700);
        }
        this.destroy();
    }
    
    destroy() {
        gameState.scene.remove(this.mesh);
        const idx = gameState.collectibles.indexOf(this);
        if (idx > -1) gameState.collectibles.splice(idx, 1);
    }
}