import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { lerp, clamp, getTransformedAABB } from './utils.js';

export class Player {
    constructor() {
        // Jelly dimensions
        this.minWidth = 0.6;
        this.maxWidth = 3.0;
        this.minHeight = 0.4;
        this.maxHeight = 3.5;
        
        // Setup Mesh
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        // Translate geometry so origin is at bottom center
        geometry.translate(0, 0.5, 0); 
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00aaff,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9,
            emissive: 0x0044aa,
            emissiveIntensity: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.set(0, 0, 0);
        
        gameState.scene.add(this.mesh);
        
        // State
        this.shiftFactor = 0.5; // 0.0 = Flat/Wide, 1.0 = Tall/Thin
        this.targetShiftFactor = 0.5;
        this.shiftSpeed = 5.0; // Speed of reshaping
        
        this.velocity = new THREE.Vector3(0, 0, gameState.baseSpeed);
        
        // Particle system for trail
        this.trailTimer = 0;
    }
    
    update(dt) {
        // Update velocity from global speed (allows speedups)
        this.velocity.z = gameState.speed;

        // Continuous forward movement
        this.mesh.position.z += this.velocity.z * dt;
        
        // Visual feedback for speed: Increase glow
        const speedRatio = clamp((gameState.speed - gameState.baseSpeed) / 20.0, 0, 1);
        this.mesh.material.emissiveIntensity = 0.2 + speedRatio * 1.5;
        
        // Handle Input for Shifting
        // Apply smoothing to shift factor
        this.shiftFactor = lerp(this.shiftFactor, this.targetShiftFactor, this.shiftSpeed * dt);
        
        // Calculate dimensions based on shift factor
        const w = lerp(this.maxWidth, this.minWidth, this.shiftFactor);
        const h = lerp(this.minHeight, this.maxHeight, this.shiftFactor);
        
        // Apply scale
        this.mesh.scale.set(w, h, 1.0);
        
        // Log info
        this.logInfo();
    }
    
    setInput(input) {
        // input is -1 (down), 0 (none), 1 (up)
        if (input > 0) {
            this.targetShiftFactor += 2.0 * gameState.deltaTime;
        } else if (input < 0) {
            this.targetShiftFactor -= 2.0 * gameState.deltaTime;
        }
        this.targetShiftFactor = clamp(this.targetShiftFactor, 0, 1);
    }
    
    getBounds() {
        return getTransformedAABB(this.mesh);
    }
    
    logInfo() {
        if (window.logs && window.logs.player_info) {
            // Project 3D position to 2D screen space
            const vector = this.mesh.position.clone();
            vector.y += this.mesh.scale.y / 2; // Center of mass roughly
            vector.project(gameState.camera);
            
            const x = (vector.x * .5 + .5) * CANVAS_WIDTH;
            const y = (-(vector.y * .5) + .5) * CANVAS_HEIGHT;

            window.logs.player_info.push({
                screen_x: x,
                screen_y: y,
                game_x: this.mesh.position.x,
                game_y: this.mesh.position.y,
                game_z: this.mesh.position.z,
                width: this.mesh.scale.x,
                height: this.mesh.scale.y,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
}

export class Collectible {
    constructor(x, z) {
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xffdd00, 
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 1.0, z); // Floating height
        this.mesh.castShadow = true;
        
        this.initialY = 1.0;
        this.floatOffset = Math.random() * Math.PI * 2;
        
        this.active = true;
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
    }
    
    update(dt) {
        if (!this.active) return;
        
        // Rotate
        this.mesh.rotation.y += 2.0 * dt;
        this.mesh.rotation.z += 1.0 * dt;
        
        // Float
        this.mesh.position.y = this.initialY + Math.sin(gameState.frameCount * 0.05 + this.floatOffset) * 0.2;
        
        // Check collision
        if (gameState.player) {
            const playerBounds = gameState.player.getBounds();
            const myBounds = getTransformedAABB(this.mesh);
            
            if (playerBounds.intersectsBox(myBounds)) {
                this.collect();
            }
        }
    }
    
    collect() {
        this.active = false;
        gameState.score += 10;
        gameState.scene.remove(this.mesh);
    }
}

export class Obstacle {
    constructor(z, type) {
        this.z = z;
        this.parts = [];
        this.type = type;
        this.passed = false;
        
        const material = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.8 });
        
        if (type === "LOW_GATE") {
            const barHeight = 1.0;
            const holeHeight = 1.2 + Math.random() * 1.0;
            this.addBox(0, holeHeight + barHeight/2, z, 10, barHeight, 1, material);
            this.addBox(-3, holeHeight/2, z, 1, holeHeight, 1, material);
            this.addBox(3, holeHeight/2, z, 1, holeHeight, 1, material);
            
        } else if (type === "NARROW_GATE") {
            const holeWidth = 1.0 + Math.random() * 1.2;
            const wallWidth = 4.0;
            const wallHeight = 5.0;
            this.addBox(-(holeWidth/2 + wallWidth/2), wallHeight/2, z, wallWidth, wallHeight, 1, material);
            this.addBox((holeWidth/2 + wallWidth/2), wallHeight/2, z, wallWidth, wallHeight, 1, material);
            this.addBox(0, 4.5, z, 10, 1, 1, material);
            
        } else if (type === "BOX_GATE") {
            const targetT = 0.2 + Math.random() * 0.6;
            const pW = lerp(3.0, 0.6, targetT);
            const pH = lerp(0.4, 3.5, targetT);
            const holeWidth = pW + 0.6; 
            const holeHeight = pH + 0.6;
            const wallWidth = 4.0;
            const barHeight = 1.0;
            this.addBox(-(holeWidth/2 + wallWidth/2), holeHeight/2, z, wallWidth, holeHeight, 1, material);
            this.addBox((holeWidth/2 + wallWidth/2), holeHeight/2, z, wallWidth, holeHeight, 1, material);
            this.addBox(0, holeHeight + barHeight/2, z, 10, barHeight, 1, material);
            
        } else if (type === "TUNNEL") {
             const length = 10;
             const height = 1.2;
             this.addBox(0, height + 0.5, z + length/2, 10, 1, length, material);
             this.addBox(-3, height/2, z + length/2, 1, height, length, material);
             this.addBox(3, height/2, z + length/2, 1, height, length, material);
        }
        
        gameState.obstacles.push(this);
    }
    
    addBox(x, y, z, w, h, d, mat) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        gameState.scene.add(mesh);
        this.parts.push(mesh);
    }
    
    update(dt) {
        if (!gameState.player) return;
        
        const playerBounds = gameState.player.getBounds();
        
        // Speed boost on pass
        if (!this.passed && this.z < gameState.player.mesh.position.z) {
            this.passed = true;
            gameState.speed += 0.5; // Increase speed
            gameState.score += 5; // Bonus score
            
            // Visual Feedback: Shockwave
            new Shockwave(this.z);
        }
        
        for (const part of this.parts) {
            const partBox = getTransformedAABB(part);
            if (playerBounds.intersectsBox(partBox)) {
                gameState.gamePhase = "GAME_OVER_LOSE";
                gameState.player.velocity.set(0,0,0);
            }
        }
        
        if (this.z < gameState.player.mesh.position.z - 20) {
            this.destroy();
        }
    }
    
    destroy() {
        this.parts.forEach(p => gameState.scene.remove(p));
        this.parts = [];
        const idx = gameState.obstacles.indexOf(this);
        if (idx > -1) gameState.obstacles.splice(idx, 1);
    }
}

export class LevelManager {
    constructor() {
        this.nextSpawnZ = 20;
        this.spawnInterval = 60;
        this.difficulty = 0;
    }
    
    update() {
        if (!gameState.player) return;
        
        const spawnDistance = 100;
        while (this.nextSpawnZ < gameState.player.mesh.position.z + spawnDistance) {
            this.spawnObstacle(this.nextSpawnZ);
            
            if (Math.random() > 0.3) {
                const gemZ = this.nextSpawnZ - this.spawnInterval / 2;
                new Collectible(0, gemZ);
            }
            
            this.nextSpawnZ += this.spawnInterval;
            this.spawnInterval = Math.max(40, 60 - this.difficulty * 0.2);
            this.difficulty++;
        }
    }
    
    spawnObstacle(z) {
        const types = ["LOW_GATE", "NARROW_GATE", "BOX_GATE"];
        if (Math.random() > 0.8) types.push("TUNNEL");
        const type = types[Math.floor(Math.random() * types.length)];
        new Obstacle(z, type);
    }
    
    reset() {
        this.nextSpawnZ = 20;
        this.difficulty = 0;
        this.spawnInterval = 60;
    }
}

// Visual Effects

export class Shockwave {
    constructor(z) {
        // A ring that expands
        const geometry = new THREE.TorusGeometry(1.5, 0.1, 8, 24);
        geometry.rotateX(Math.PI / 2); // Lay flat
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.8 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 1.5, z);
        gameState.scene.add(this.mesh);
        
        this.life = 0;
        this.active = true;
        gameState.particles.push(this);
    }
    
    update(dt) {
        this.life += dt;
        const scale = 1 + this.life * 15;
        this.mesh.scale.set(scale, scale, scale);
        this.mesh.material.opacity = 0.8 - (this.life * 1.5);
        
        if (this.mesh.material.opacity <= 0) {
            this.active = false;
            gameState.scene.remove(this.mesh);
        }
    }
}

export class DustSystem {
    constructor() {
        this.specks = [];
        const geo = new THREE.BoxGeometry(0.05, 0.05, 1.0); // Long streaks
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        
        for(let i=0; i<60; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30 + 10,
                Math.random() * 200
            );
            gameState.scene.add(mesh);
            this.specks.push(mesh);
        }
    }
    
    update() {
        if (!gameState.player) return;
        const pZ = gameState.player.mesh.position.z;
        
        this.specks.forEach(mesh => {
            // If behind player, move ahead
            if (mesh.position.z < pZ - 20) {
                mesh.position.z += 200;
                mesh.position.x = (Math.random() - 0.5) * 50;
                mesh.position.y = (Math.random() - 0.5) * 30 + 10;
            }
        });
    }
    
    reset() {
        this.specks.forEach(mesh => {
            mesh.position.z = Math.random() * 200;
        });
    }
}