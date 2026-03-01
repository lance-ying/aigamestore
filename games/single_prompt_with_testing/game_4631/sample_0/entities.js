import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PhysicsBody } from './physics.js';
import { gameState, COLORS } from './globals.js';
import { randomColorVariant } from './utils.js';

export class Player {
    constructor(startPos) {
        this.startPos = startPos.clone();
        
        // Bean Geometry (Capsule-like: Cylinder + 2 Spheres)
        const group = new THREE.Group();
        
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.PLAYER, 
            roughness: 0.4,
            metalness: 0.1 
        });
        
        // Body
        const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
        const cylinder = new THREE.Mesh(cylinderGeo, material);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        group.add(cylinder);
        
        // Top Dome
        const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
        const top = new THREE.Mesh(sphereGeo, material);
        top.position.y = 0.5;
        top.castShadow = true;
        group.add(top);
        
        // Bottom Dome
        const bottom = new THREE.Mesh(sphereGeo, material);
        bottom.rotation.x = Math.PI;
        bottom.position.y = -0.5;
        bottom.castShadow = true;
        group.add(bottom);
        
        // Face (Visor)
        const visorMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, metalness: 0.0 });
        const visorGeo = new THREE.CapsuleGeometry(0.3, 0.2, 4, 8);
        const visor = new THREE.Mesh(visorGeo, visorMaterial);
        visor.rotation.z = Math.PI / 2;
        visor.position.set(0, 0.2, 0.4);
        visor.scale.set(0.8, 0.8, 0.5);
        group.add(visor);

        // Legs (Visual only)
        const legGeo = new THREE.CapsuleGeometry(0.15, 0.4, 4, 8);
        const legL = new THREE.Mesh(legGeo, material);
        legL.position.set(-0.25, -0.8, 0);
        group.add(legL);
        const legR = new THREE.Mesh(legGeo, material);
        legR.position.set(0.25, -0.8, 0);
        group.add(legR);

        this.mesh = group;
        this.mesh.position.copy(startPos);
        gameState.scene.add(this.mesh);
        
        // Physics
        this.physicsBody = new PhysicsBody(this.mesh, { 
            type: 'dynamic', 
            mass: 1.0, 
            friction: 0.8 
        });
        
        // State
        this.speed = 0.15;
        this.jumpForce = 0.65;
        this.diveForce = 0.4;
        this.isDiving = false;
        this.faceDirection = new THREE.Vector3(0, 0, 1);
        this.diveTimer = 0;
        
        // Animation
        this.legs = [legL, legR];
        this.animTime = 0;
    }
    
    update(deltaTime, input) {
        // Handle input if not diving uncontrollably
        const moveDir = new THREE.Vector3(0, 0, 0);
        
        if (this.diveTimer <= 0) {
            // Camera-relative movement
            const camDir = new THREE.Vector3();
            gameState.camera.getWorldDirection(camDir);
            camDir.y = 0;
            camDir.normalize();
            
            const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);
            
            if (input.up) moveDir.add(camDir);
            if (input.down) moveDir.sub(camDir);
            if (input.left) moveDir.add(camRight);
            if (input.right) moveDir.sub(camRight);
            
            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                this.faceDirection.copy(moveDir);
                
                // Accelerate
                const accel = moveDir.multiplyScalar(this.speed);
                this.physicsBody.velocity.x += accel.x;
                this.physicsBody.velocity.z += accel.z;
                
                // Rotate mesh to face direction
                const targetAngle = Math.atan2(this.faceDirection.x, this.faceDirection.z);
                // Smooth rotation
                const currentRotation = this.mesh.rotation.y;
                // Simple lerp for angle (ignoring wrapping for simplicity in this demo)
                this.mesh.rotation.y = targetAngle; 
                
                // Animate Legs
                this.animTime += deltaTime * 10;
                this.legs[0].position.y = -0.8 + Math.sin(this.animTime) * 0.1;
                this.legs[0].rotation.x = Math.sin(this.animTime) * 0.5;
                this.legs[1].position.y = -0.8 + Math.sin(this.animTime + Math.PI) * 0.1;
                this.legs[1].rotation.x = Math.sin(this.animTime + Math.PI) * 0.5;
            } else {
                // Reset legs
                this.legs[0].position.y = -0.8;
                this.legs[1].position.y = -0.8;
                this.legs[0].rotation.x = 0;
                this.legs[1].rotation.x = 0;
            }
            
            // Jump
            if (input.jump && this.physicsBody.onGround) {
                this.physicsBody.velocity.y = this.jumpForce;
                this.physicsBody.onGround = false;
            }
            
            // Dive
            if (input.dive && !this.isDiving && !this.physicsBody.onGround) {
                this.isDiving = true;
                this.diveTimer = 60; // Frames
                const diveImpulse = this.faceDirection.clone().multiplyScalar(this.diveForce);
                diveImpulse.y = 0.2; // Slight hop
                this.physicsBody.velocity.add(diveImpulse);
                
                // Rotate body to horizontal
                this.mesh.rotation.x = -Math.PI / 2;
            }
        } else {
            // Diving State
            this.diveTimer--;
            if (this.physicsBody.onGround) {
                this.diveTimer = 0; // Recover if hit ground
                this.isDiving = false;
                this.mesh.rotation.x = 0;
            }
        }
        
        // Recover from dive rotation
        if (!this.isDiving) {
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, 0.2);
        }

        // Kill plane / Respawn
        if (this.mesh.position.y < -20) {
            this.respawn();
        }
        
        // Log Position
        if (window.logs && window.logs.player_info) {
             window.logs.player_info.push({
                 x: this.mesh.position.x,
                 y: this.mesh.position.y,
                 z: this.mesh.position.z,
                 frame: gameState.frameCount
             });
        }
    }
    
    respawn() {
        // Find latest checkpoint
        let spawnPt = this.startPos;
        if (gameState.checkpoints.length > 0) {
            spawnPt = gameState.checkpoints[Math.max(0, gameState.currentCheckpointIndex)].position;
        }
        
        this.mesh.position.copy(spawnPt);
        this.mesh.position.y += 2; // Drop in
        this.physicsBody.velocity.set(0, 0, 0);
        this.physicsBody.acceleration.set(0, 0, 0);
        this.isDiving = false;
        this.diveTimer = 0;
        this.mesh.rotation.set(0, 0, 0);
    }
}

export class Platform {
    constructor(x, y, z, w, h, d, color = COLORS.GROUND) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        this.physicsBody = new PhysicsBody(this.mesh, { type: 'static' });
        gameState.colliders.push(this);
    }
}

export class Checkpoint {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        gameState.checkpoints.push(this);
        
        // Visual indicator
        const geo = new THREE.CylinderGeometry(2, 2, 0.2, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 0.1, z);
        gameState.scene.add(mesh);
    }
}

export class Goal {
    constructor(x, y, z, width, height, depth) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.GOAL, 
            transparent: true, 
            opacity: 0.5,
            emissive: COLORS.GOAL,
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
        
        this.physicsBody = new PhysicsBody(this.mesh, { type: 'static', isTrigger: true });
        gameState.colliders.push(this);
        this.onTriggerEnter = (entity) => {
            if (entity === gameState.player && gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "GAME_OVER_WIN";
                gameState.score += 1000;
            }
        };
    }
    
    update(time) {
        // Pulse effect
        this.mesh.material.opacity = 0.5 + Math.sin(time * 5) * 0.2;
    }
}

// Moving Obstacle: Spinner
export class Spinner {
    constructor(x, y, z, length, speed) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        
        // Base
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        this.mesh.add(base);
        
        // Arm
        const armGeo = new THREE.BoxGeometry(length, 0.5, 0.5);
        const armMat = new THREE.MeshStandardMaterial({ color: COLORS.OBSTACLE });
        this.arm = new THREE.Mesh(armGeo, armMat);
        this.arm.position.y = 1;
        this.mesh.add(this.arm);
        
        gameState.scene.add(this.mesh);
        
        this.speed = speed;
        this.isHazard = true;
        
        // Physics Body for the arm
        // Note: For accurate physics on rotating objects, we need better math or updating AABB constantly.
        // We set it as kinematic.
        this.physicsBody = new PhysicsBody(this.arm, { 
            type: 'kinematic', 
            bounciness: 2.0 
        });
        gameState.colliders.push(this);
    }
    
    update(deltaTime) {
        this.arm.rotation.y += this.speed * deltaTime;
        
        // Calculate tangent velocity at tips for knockback calculations if needed
        // For simple resolution, we just rely on overlap push + explicit knockback flag
    }
}