import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, BOUNCE_FORCE, MAX_CHARGE_FORCE, ROTATION_SPEED, MAX_ROTATION_SPEED, CRASH_ANGLE_THRESHOLD, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_HORIZONTAL_SPEED } from './globals.js';
import { checkPlatformCollisions, updatePhysics } from './physics.js';
import { isKeyDown } from './input.js';
import { createExplosion } from './particles.js';

export class Entity {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.angularVelocity = 0;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
    }
    
    update(deltaTime) {
        // Base update
    }
}

export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.initMesh();
        
        this.charge = 0;
        this.isCharging = false;
        this.isGrounded = false;
        this.score = 0;
        this.health = 1; // 1 hit kill mechanic mostly, but extensible
        
        // Pogo specific
        this.pogoLength = 1.5;
        this.springCompression = 0;
    }
    
    initMesh() {
        // Create Character Group
        
        // Body (Cube)
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_BODY });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.5;
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);
        
        // Head (Sphere-ish)
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_HEAD });
        this.headMesh = new THREE.Mesh(headGeo, headMat);
        this.headMesh.position.y = 1.1;
        this.headMesh.castShadow = true;
        this.mesh.add(this.headMesh);
        
        // Face features
        const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(0.15, 1.15, 0.25);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(-0.15, 1.15, 0.25);
        this.mesh.add(eyeL);
        this.mesh.add(eyeR);
        
        // Pogo Stick (Cylinder)
        const stickGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const stickMat = new THREE.MeshStandardMaterial({ color: COLORS.POGO_STICK });
        this.stickMesh = new THREE.Mesh(stickGeo, stickMat);
        this.stickMesh.position.y = -0.5; // Extends down from body center
        this.mesh.add(this.stickMesh);
        
        // Pogo Foot/Spring
        const footGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
        const footMat = new THREE.MeshStandardMaterial({ color: COLORS.POGO_SPRING });
        this.footMesh = new THREE.Mesh(footGeo, footMat);
        this.footMesh.position.y = -1.25;
        this.mesh.add(this.footMesh);
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.handleInput(deltaTime);
        this.handlePhysics(deltaTime);
        this.logData();
        
        // Visual updates
        // Compress pogo stick visual if charging
        if (this.isCharging) {
            this.footMesh.position.y = THREE.MathUtils.lerp(this.footMesh.position.y, -0.8, 0.1);
        } else {
            this.footMesh.position.y = THREE.MathUtils.lerp(this.footMesh.position.y, -1.25, 0.2);
        }
    }
    
    handleInput(deltaTime) {
        // Rotation
        if (isKeyDown([37, 65])) { // Left / A
            this.angularVelocity += ROTATION_SPEED * deltaTime * 60;
        }
        if (isKeyDown([39, 68])) { // Right / D
            this.angularVelocity -= ROTATION_SPEED * deltaTime * 60;
        }
        
        // Charging
        if (isKeyDown(32)) { // Space
            this.isCharging = true;
            this.charge = Math.min(this.charge + 0.02, 1.0);
        } else {
            this.isCharging = false;
        }
    }
    
    handlePhysics(deltaTime) {
        // Damping rotation
        this.angularVelocity *= 0.95;
        this.angularVelocity = Math.max(Math.min(this.angularVelocity, MAX_ROTATION_SPEED), -MAX_ROTATION_SPEED);
        
        this.rotation += this.angularVelocity;
        
        // Basic movement physics
        updatePhysics(this, deltaTime);
        
        // Clamp horizontal velocity to prevent runaway acceleration
        if (this.velocity.x > MAX_HORIZONTAL_SPEED) this.velocity.x = MAX_HORIZONTAL_SPEED;
        if (this.velocity.x < -MAX_HORIZONTAL_SPEED) this.velocity.x = -MAX_HORIZONTAL_SPEED;
        
        // Collision Detection
        // Calculate the tip of the pogo stick in world space
        // Stick vector relative to player center is roughly (0, -1.25, 0) rotated by Z
        const tipOffset = new THREE.Vector3(0, -1.3, 0);
        tipOffset.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotation);
        const tipPos = this.position.clone().add(tipOffset);
        
        // Check collisions for the tip
        // We create a temporary small entity for the tip to reuse AABB logic or check ground plane
        const collision = checkPlatformCollisions(this, gameState.platforms);
        
        if (collision) {
            if (collision.type === 'floor') {
                this.handleBounce(collision);
            } else if (collision.type.includes('wall')) {
                // Wall bounce/stop
                this.velocity.x *= -0.5;
                this.angularVelocity += (collision.type === 'wall_left' ? 0.1 : -0.1);
            }
        }
        
        // Check Death (Head collision)
        // If angle is too steep and we are low
        const headOffset = new THREE.Vector3(0, 1.0, 0);
        headOffset.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotation);
        const headPos = this.position.clone().add(headOffset);
        
        // Simple ground plane check for death + platform check
        if (Math.abs(this.rotation) > CRASH_ANGLE_THRESHOLD) {
             // Check if any body part is touching a platform
             const bodyCollision = checkPlatformCollisions(this, gameState.platforms);
             if (bodyCollision) {
                 this.die();
             }
        }
        
        // Out of bounds check
        if (this.position.y < -10) {
            this.die();
        }
    }
    
    handleBounce(collision) {
        // Calculate bounce vector based on rotation
        // The stick pushes along its axis
        const axis = new THREE.Vector3(0, 1, 0);
        axis.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotation);
        
        // Force calculation
        let force = BOUNCE_FORCE;
        if (this.charge > 0 && !this.isCharging) { // Release charge
            force += this.charge * (MAX_CHARGE_FORCE - BOUNCE_FORCE);
            this.charge = 0;
        }
        
        // Apply Impulse
        // Dampen existing velocity significantly before adding new impulse to prevent infinite acceleration
        this.velocity.x = (this.velocity.x * 0.7) + (axis.x * force * 1.2); 
        this.velocity.y = Math.abs(axis.y * force * 1.8); // Ensure upward momentum
        
        // Visual feedback
        createExplosion(collision.platform ? this.position.clone().setY(collision.y) : this.position, 5, COLORS.PARTICLE);
        
        // Reset vertical position to avoid sticking
        // this.position.y = collision.y + 1.3; 
        // Better: push out along normal
        const penetration = (collision.y - (this.position.y - 1.3));
        if (penetration > 0) this.position.y += penetration;
        
        this.isGrounded = false;
    }
    
    die() {
        if (gameState.gamePhase !== "PLAYING") return;
        
        console.log("Player died!");
        createExplosion(this.position, 20, COLORS.PLAYER_BODY);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    logData() {
        if (window.logs && window.logs.player_info) {
            const screenPos = this.position.clone().project(gameState.camera);
            window.logs.player_info.push({
                screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
                screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
                game_x: this.position.x,
                game_y: this.position.y,
                game_z: this.position.z,
                angle: this.rotation,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
}

export class Platform extends Entity {
    constructor(x, y, z, width, height, depth, type = 'normal') {
        super(x, y, z);
        this.size = new THREE.Vector3(width, height, depth);
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        let color = COLORS.PLATFORM;
        if (type === 'goal') color = COLORS.GOAL;
        if (type === 'hazard') color = COLORS.OBSTACLE;
        
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        
        this.type = type;
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this); // Add to global platforms list for physics
    }
    
    update(deltaTime) {
        if (this.type === 'goal') {
            // Rotate goal or visual effect
            this.mesh.rotation.y += deltaTime;
            
            // Check win
            if (gameState.player) {
                const dist = this.position.distanceTo(gameState.player.position);
                if (dist < 2.0) {
                    // Level Complete logic
                    if (gameState.gamePhase === "PLAYING") {
                        gameState.gamePhase = "LEVEL_COMPLETE";
                        createExplosion(this.position, 30, COLORS.GOAL);
                    }
                }
            }
        }
    }
}

export class Collectible extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.COLLECTIBLE,
            emissive: COLORS.COLLECTIBLE,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        
        this.initialY = y;
        this.timer = Math.random() * Math.PI * 2;
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
    }
    
    update(deltaTime) {
        this.mesh.rotation.y += 2 * deltaTime;
        this.timer += deltaTime * 2;
        this.mesh.position.y = this.initialY + Math.sin(this.timer) * 0.2;
        
        // Collection logic
        if (gameState.player) {
            const dist = this.mesh.position.distanceTo(gameState.player.position);
            if (dist < 1.0) {
                this.collect();
            }
        }
    }
    
    collect() {
        gameState.score += 100;
        createExplosion(this.position, 5, COLORS.COLLECTIBLE);
        this.dispose();
    }
    
    dispose() {
        gameState.scene.remove(this.mesh);
        gameState.collectibles = gameState.collectibles.filter(c => c !== this);
    }
}