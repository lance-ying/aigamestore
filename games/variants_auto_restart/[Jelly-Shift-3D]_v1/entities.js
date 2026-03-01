import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { lerp, clamp, getTransformedAABB } from './utils.js';

// Shape Constants
const SHAPE_CUBE = 0;
const SHAPE_SPHERE = 1;
const SHAPE_TRIANGLE = 2;

export class Player {
    constructor() {
        // Group to hold different shape meshes
        this.mesh = new THREE.Group();
        this.mesh.position.set(0, 0, 0);
        gameState.scene.add(this.mesh);

        // Materials
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00aaff,
            roughness: 0.2,
            metalness: 0.1,
            emissive: 0x0044aa,
            emissiveIntensity: 0.2
        });

        // 1. Cube Mesh
        const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
        cubeGeo.translate(0, 0.5, 0); // Pivot at bottom
        this.meshCube = new THREE.Mesh(cubeGeo, material);
        this.meshCube.castShadow = true;
        this.mesh.add(this.meshCube);

        // 2. Sphere/Cylinder Mesh (Circle)
        // Rotate Cylinder to face forward
        const sphereGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        sphereGeo.rotateX(Math.PI / 2);
        sphereGeo.translate(0, 0.5, 0);
        this.meshSphere = new THREE.Mesh(sphereGeo, material);
        this.meshSphere.castShadow = true;
        this.meshSphere.visible = false;
        this.mesh.add(this.meshSphere);

        // 3. Triangle Mesh (Prism)
        const triGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
        triGeo.rotateX(Math.PI / 2);
        triGeo.rotateZ(Math.PI); // Point up
        triGeo.translate(0, 0.5, 0); // Adjust visual center if needed
        this.meshTriangle = new THREE.Mesh(triGeo, material);
        this.meshTriangle.castShadow = true;
        this.meshTriangle.visible = false;
        this.mesh.add(this.meshTriangle);

        // State
        this.currentShape = SHAPE_CUBE; // 0, 1, 2
        this.dimension = 0.5; // 0.0 (Wide/Short) to 1.0 (Thin/Tall)
        
        this.velocity = new THREE.Vector3(0, 0, gameState.baseSpeed);
        this.verticalVelocity = 0;
        this.isGrounded = true;
        
        // Physics constants
        this.jumpForce = 12.0; 
        this.gravity = -30.0;
    }
    
    update(dt) {
        // Forward Movement
        this.velocity.z = gameState.speed;
        this.mesh.position.z += this.velocity.z * dt;
        
        // Apply Dimension Scaling
        // Map dimension 0..1 to Width 2.0..0.5 and Height 0.5..2.0
        const w = lerp(2.0, 0.5, this.dimension);
        const h = lerp(0.5, 2.0, this.dimension);
        this.mesh.scale.set(w, h, 1);
        
        // Vertical Movement (Jump)
        if (!this.isGrounded) {
            this.verticalVelocity += this.gravity * dt;
            this.mesh.position.y += this.verticalVelocity * dt;
            
            // Ground Collision
            if (this.mesh.position.y <= 0) {
                this.mesh.position.y = 0;
                this.verticalVelocity = 0;
                this.isGrounded = true;
                
                // Landing effect
                new Shockwave(this.mesh.position.z);
            }
        }

        // Visual feedback for speed
        const speedRatio = clamp((gameState.speed - gameState.baseSpeed) / 20.0, 0, 1);
        const activeMesh = this.getActiveMesh();
        activeMesh.material.emissiveIntensity = 0.2 + speedRatio * 1.5;
        
        // Log info
        this.logInfo();
    }
    
    jump() {
        if (this.isGrounded) {
            this.verticalVelocity = this.jumpForce;
            this.isGrounded = false;
        }
    }
    
    switchShape(direction) {
        // direction: 1 or -1
        this.currentShape = (this.currentShape + direction + 3) % 3;
        this.updateShapeVisuals();
    }
    
    changeDimension(delta) {
        // Change speed multiplier
        this.dimension = clamp(this.dimension + delta * 3.0, 0, 1);
    }
    
    updateShapeVisuals() {
        this.meshCube.visible = this.currentShape === SHAPE_CUBE;
        this.meshSphere.visible = this.currentShape === SHAPE_SPHERE;
        this.meshTriangle.visible = this.currentShape === SHAPE_TRIANGLE;
    }
    
    getActiveMesh() {
        if (this.currentShape === SHAPE_SPHERE) return this.meshSphere;
        if (this.currentShape === SHAPE_TRIANGLE) return this.meshTriangle;
        return this.meshCube;
    }

    getBounds() {
        return getTransformedAABB(this.getActiveMesh());
    }
    
    logInfo() {
        if (window.logs && window.logs.player_info) {
            const vector = this.mesh.position.clone();
            vector.y += 0.5;
            vector.project(gameState.camera);
            
            const x = (vector.x * .5 + .5) * CANVAS_WIDTH;
            const y = (-(vector.y * .5) + .5) * CANVAS_HEIGHT;

            window.logs.player_info.push({
                screen_x: x,
                screen_y: y,
                game_z: this.mesh.position.z,
                shape: this.currentShape,
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
    constructor(z, type, scaleParam = 0.5) {
        this.z = z;
        this.type = type; // "WALL_CUBE", "WALL_SPHERE", "WALL_TRIANGLE", "JUMP_BAR"
        this.scaleParam = scaleParam;
        this.passed = false;
        this.mesh = null;
        
        // Calculate hole dimensions based on scale
        // Matches Player scaling: 0 -> W:2.0, H:0.5 | 1 -> W:0.5, H:2.0
        this.holeWidth = lerp(2.0, 0.5, scaleParam);
        this.holeHeight = lerp(0.5, 2.0, scaleParam);
        
        const wallColor = 0xff4444;
        const material = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
        
        if (type.startsWith("WALL")) {
            // Create Wall with Hole
            const shape = new THREE.Shape();
            // Outer wall - Reduced height for better visibility ahead
            const wallH = 4.5;
            const wallW = 5;
            
            shape.moveTo(-wallW, 0);
            shape.lineTo(wallW, 0);
            shape.lineTo(wallW, wallH);
            shape.lineTo(-wallW, wallH);
            shape.lineTo(-wallW, 0);
            
            // Hole Logic
            const holePath = new THREE.Path();
            const hw = (this.holeWidth + 0.1) / 2; // Add slight visual tolerance
            const hh = this.holeHeight + 0.1;
            
            if (type === "WALL_CUBE") {
                holePath.moveTo(-hw, 0);
                holePath.lineTo(hw, 0);
                holePath.lineTo(hw, hh);
                holePath.lineTo(-hw, hh);
                holePath.lineTo(-hw, 0);
            } else if (type === "WALL_SPHERE") {
                // Ellipse for variable dimensions
                holePath.absellipse(0, hh/2, hw, hh/2, 0, Math.PI * 2, true);
            } else if (type === "WALL_TRIANGLE") {
                holePath.moveTo(-hw, 0);
                holePath.lineTo(hw, 0);
                holePath.lineTo(0, hh);
                holePath.lineTo(-hw, 0);
            }
            
            shape.holes.push(holePath);
            
            const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(0, 0, z);
            
        } else if (type === "JUMP_BAR") {
            // Low barrier to jump over
            const geometry = new THREE.BoxGeometry(10, 0.5, 0.5);
            geometry.translate(0, 0.25, 0); // Sit on ground
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(0, 0, z);
        }
        
        if (this.mesh) {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            gameState.scene.add(this.mesh);
        }
        
        gameState.obstacles.push(this);
    }
    
    update(dt) {
        if (!gameState.player) return;
        
        const playerZ = gameState.player.mesh.position.z;
        
        // Check Passing
        if (!this.passed && this.z < playerZ) {
            this.passed = true;
            gameState.score += 5;
        }
        
        // Collision Logic
        const collisionThreshold = 0.5; // Depth of wall/bar
        
        if (Math.abs(playerZ - this.z) < collisionThreshold) {
            let crashed = false;
            
            if (this.type === "JUMP_BAR") {
                // Must be in air
                if (gameState.player.mesh.position.y < 0.6) {
                    crashed = true;
                }
            } else {
                // 1. Check Shape Type
                const pShape = gameState.player.currentShape;
                if (this.type === "WALL_CUBE" && pShape !== SHAPE_CUBE) crashed = true;
                if (this.type === "WALL_SPHERE" && pShape !== SHAPE_SPHERE) crashed = true;
                if (this.type === "WALL_TRIANGLE" && pShape !== SHAPE_TRIANGLE) crashed = true;
                
                // 2. Check Dimensions
                // Player must fit inside the hole dimensions
                const pScale = gameState.player.mesh.scale;
                const tolerance = 0.3; // Forgiveness margin
                
                if (pScale.x > this.holeWidth + tolerance) crashed = true;
                // Check height against hole height
                // Note: Player height is pScale.y, but if jumping, total height is pos.y + pScale.y
                const pTop = gameState.player.mesh.position.y + pScale.y;
                if (pTop > this.holeHeight + tolerance) crashed = true;
            }
            
            if (crashed) {
                gameState.gamePhase = "GAME_OVER_LOSE";
                gameState.player.velocity.set(0,0,0);
            }
        }
        
        // Cleanup
        if (this.z < playerZ - 20) {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.mesh) gameState.scene.remove(this.mesh);
        const idx = gameState.obstacles.indexOf(this);
        if (idx > -1) gameState.obstacles.splice(idx, 1);
    }
}

export class LevelManager {
    constructor() {
        this.nextSpawnZ = 50;
        this.spawnInterval = 40;
    }
    
    update() {
        if (!gameState.player) return;
        
        const spawnDistance = 150;
        while (this.nextSpawnZ < gameState.player.mesh.position.z + spawnDistance) {
            this.spawnObstacle(this.nextSpawnZ);
            
            // Random collectible
            if (Math.random() > 0.5) {
                const gemZ = this.nextSpawnZ - this.spawnInterval / 2;
                new Collectible(0, gemZ);
            }
            
            this.nextSpawnZ += this.spawnInterval;
            // Decrease interval slightly to make it harder, but clamp
            this.spawnInterval = Math.max(20, 40 - gameState.speed * 0.1); 
        }
    }
    
    spawnObstacle(z) {
        const r = Math.random();
        // Generate random scale requirement for this obstacle
        const scale = Math.random(); 
        
        let type;
        if (r < 0.25) type = "JUMP_BAR";
        else if (r < 0.5) type = "WALL_CUBE";
        else if (r < 0.75) type = "WALL_SPHERE";
        else type = "WALL_TRIANGLE";
        
        new Obstacle(z, type, scale);
    }
    
    reset() {
        this.nextSpawnZ = 50;
        this.spawnInterval = 40;
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
        this.mesh.position.set(0, 0.1, z);
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