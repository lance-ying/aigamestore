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
        
        // Handle Input for Shifting
        // If HUMAN or TEST mode, input is handled in game.js which sets flags/values
        // But we can check keys here directly via a passed input state or update locally
        // For decoupled design, we'll assume game.js calls specific methods or sets properties
        
        // Apply smoothing to shift factor
        this.shiftFactor = lerp(this.shiftFactor, this.targetShiftFactor, this.shiftSpeed * dt);
        
        // Calculate dimensions based on shift factor
        // Factor 0: Max Width, Min Height
        // Factor 1: Min Width, Max Height
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
        } else {
            // Auto-center or stay?
            // Gameplay usually requires holding. Let's make it sticky but drift slightly to neutral?
            // Actually, precise control is better. It stays where you leave it? 
            // Or typically it has a spring back?
            // Let's implement: Hold to change, release stays. 
            // But strict limits.
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
        // Could spawn particles here
    }
}

export class Obstacle {
    constructor(z, type) {
        this.z = z;
        this.parts = [];
        this.type = type;
        this.passed = false;
        
        // Create obstacle geometry based on type
        // Types: "LOW_GATE", "NARROW_GATE", "TUNNEL", "BOX_GATE"
        
        const material = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.8 });
        
        if (type === "LOW_GATE") {
            const barHeight = 1.0;
            // Variable height: 1.2 to 2.2
            const holeHeight = 1.2 + Math.random() * 1.0;
            
            // Top Bar
            this.addBox(0, holeHeight + barHeight/2, z, 10, barHeight, 1, material);
            // Side Pillars (just for visuals)
            this.addBox(-3, holeHeight/2, z, 1, holeHeight, 1, material);
            this.addBox(3, holeHeight/2, z, 1, holeHeight, 1, material);
            
        } else if (type === "NARROW_GATE") {
            // Variable width: 1.0 to 2.2
            const holeWidth = 1.0 + Math.random() * 1.2;
            const wallWidth = 4.0;
            const wallHeight = 5.0;
            
            // Left Wall
            this.addBox(-(holeWidth/2 + wallWidth/2), wallHeight/2, z, wallWidth, wallHeight, 1, material);
            // Right Wall
            this.addBox((holeWidth/2 + wallWidth/2), wallHeight/2, z, wallWidth, wallHeight, 1, material);
            // Top cap
            this.addBox(0, 4.5, z, 10, 1, 1, material);
            
        } else if (type === "BOX_GATE") {
            // Requires intermediate shape
            // Generate a target 't' (shift factor) that is passable
            const targetT = 0.2 + Math.random() * 0.6; // 0.2 to 0.8
            
            // Calculate player dimensions at this T
            const pW = lerp(3.0, 0.6, targetT);
            const pH = lerp(0.4, 3.5, targetT);
            
            // Make hole slightly larger
            const holeWidth = pW + 0.6; 
            const holeHeight = pH + 0.6;
            
            const wallWidth = 4.0;
            const barHeight = 1.0;
            
            // Left Wall
            this.addBox(-(holeWidth/2 + wallWidth/2), holeHeight/2, z, wallWidth, holeHeight, 1, material);
            // Right Wall
            this.addBox((holeWidth/2 + wallWidth/2), holeHeight/2, z, wallWidth, holeHeight, 1, material);
            // Top Bar
            this.addBox(0, holeHeight + barHeight/2, z, 10, barHeight, 1, material);
            
        } else if (type === "TUNNEL") {
             // Requires staying flat for a distance
             const length = 10;
             const height = 1.2;
             // Roof
             this.addBox(0, height + 0.5, z + length/2, 10, 1, length, material);
             // Sides
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
        // Check collision with player
        if (!gameState.player) return;
        
        const playerBounds = gameState.player.getBounds();
        
        // Speed boost on pass
        if (!this.passed && this.z < gameState.player.mesh.position.z) {
            this.passed = true;
            gameState.speed += 0.5; // Increase speed
            gameState.score += 5; // Bonus score
        }
        
        for (const part of this.parts) {
            const partBox = getTransformedAABB(part);
            if (playerBounds.intersectsBox(partBox)) {
                // Collision!
                gameState.gamePhase = "GAME_OVER_LOSE";
                // Optional: Stop player
                gameState.player.velocity.set(0,0,0);
            }
        }
        
        // Cleanup if behind player
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
        this.spawnInterval = 60; // Increased gap between gates
        this.difficulty = 0;
    }
    
    update() {
        if (!gameState.player) return;
        
        // Spawn obstacles ahead of player
        const spawnDistance = 100;
        while (this.nextSpawnZ < gameState.player.mesh.position.z + spawnDistance) {
            this.spawnObstacle(this.nextSpawnZ);
            
            // Spawn gems between obstacles
            if (Math.random() > 0.3) {
                const gemZ = this.nextSpawnZ - this.spawnInterval / 2;
                new Collectible(0, gemZ);
            }
            
            this.nextSpawnZ += this.spawnInterval;
            
            // Increase difficulty (decrease interval slightly but keep a larger minimum gap)
            this.spawnInterval = Math.max(40, 60 - this.difficulty * 0.2);
            this.difficulty++;
        }
    }
    
    spawnObstacle(z) {
        const types = ["LOW_GATE", "NARROW_GATE", "BOX_GATE"];
        // Tunnel appears rarely
        if (Math.random() > 0.8) types.push("TUNNEL");
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        // In TEST_2 (Win), avoid spawning hard obstacles or control generation? 
        // For simplicity, random generation is seeded so deterministic.
        
        if (gameState.controlMode === "TEST_2") {
            // Make it easy? Or handled by AI?
            // Just spawn regular.
        }
        
        new Obstacle(z, type);
    }
    
    reset() {
        this.nextSpawnZ = 20;
        this.difficulty = 0;
        this.spawnInterval = 60;
    }
}