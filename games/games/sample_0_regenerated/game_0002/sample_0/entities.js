import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, JUMP_FORCE, RUN_SPEED_MAX, RUN_SPEED_ACCEL } from './globals.js';
import { random } from './utils.js';

export class Player {
    constructor() {
        // Group for all player parts
        this.mesh = new THREE.Group();
        this.mesh.position.set(0, 0, 0);

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        // Torso
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), shirtMat);
        this.torso.position.y = 1.0;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Head
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skinMat);
        this.head.position.y = 1.6;
        this.head.castShadow = true;
        this.mesh.add(this.head);

        // Legs (simplified)
        this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.3), pantsMat);
        this.legL.position.set(-0.2, 0.4, 0);
        this.legL.castShadow = true;
        this.mesh.add(this.legL);

        this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.3), pantsMat);
        this.legR.position.set(0.2, 0.4, 0);
        this.legR.castShadow = true;
        this.mesh.add(this.legR);

        // Arms
        this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), skinMat);
        this.armL.position.set(-0.45, 1.0, 0);
        this.armL.castShadow = true;
        this.mesh.add(this.armL);

        this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), skinMat);
        this.armR.position.set(0.45, 1.0, 0);
        this.armR.castShadow = true;
        this.mesh.add(this.armR);

        // Physics/State
        this.lane = 0; // -1, 0, 1
        this.targetX = 0;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true;
        this.isSliding = false;
        this.slideTimer = 0;
        this.runAnimTime = 0;

        gameState.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Lane Movement Interpolation
        this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetX, 10 * deltaTime);
        
        // Forward Movement
        this.mesh.position.z -= gameState.runSpeed; // Moving into negative Z
        gameState.distanceTraveled = -this.mesh.position.z;

        // Speed increase
        if (gameState.runSpeed < RUN_SPEED_MAX) {
            gameState.runSpeed += RUN_SPEED_ACCEL;
        }

        // Sliding Logic
        if (this.isSliding) {
            this.slideTimer -= deltaTime;
            if (this.slideTimer <= 0) {
                this.stopSlide();
            }
        }

        // Animation
        this.animate(deltaTime);
    }

    animate(deltaTime) {
        if (this.onGround && !this.isSliding) {
            this.runAnimTime += deltaTime * 15 * (gameState.runSpeed / 0.3);
            
            // Legs
            this.legL.rotation.x = Math.sin(this.runAnimTime) * 0.8;
            this.legR.rotation.x = Math.sin(this.runAnimTime + Math.PI) * 0.8;
            
            // Arms
            this.armL.rotation.x = Math.sin(this.runAnimTime + Math.PI) * 0.8;
            this.armR.rotation.x = Math.sin(this.runAnimTime) * 0.8;
        } else if (!this.onGround) {
            // Jump pose
            this.legL.rotation.x = -0.5;
            this.legR.rotation.x = 0.5;
            this.armL.rotation.x = -2.5;
            this.armR.rotation.x = -2.5;
        }
    }

    moveLane(direction) {
        if (this.lane + direction >= -1 && this.lane + direction <= 1) {
            this.lane += direction;
            this.targetX = this.lane * LANE_WIDTH;
        }
    }

    jump() {
        if (this.onGround && !this.isSliding) {
            this.velocity.y = JUMP_FORCE;
            this.onGround = false;
        }
    }

    slide() {
        if (this.onGround && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = 0.8; // Slide duration seconds
            
            // Visual squash
            this.mesh.scale.set(1, 0.5, 1);
            // Adjust position so feet stay on ground
            this.mesh.position.y -= 0.5; 
        }
    }

    stopSlide() {
        this.isSliding = false;
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.y += 0.5; // Restore pos
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        // Log death
        if (window.logs) {
            window.logs.game_info.push({
                event: "PLAYER_DEATH",
                score: gameState.score,
                distance: gameState.distanceTraveled,
                timestamp: Date.now()
            });
        }
    }
}

export class Collectible {
    constructor(x, y, z) {
        const geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 1.0
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        
        // Random initial rotation
        this.mesh.rotation.y = random() * Math.PI;
        
        gameState.scene.add(this.mesh);
    }

    update(deltaTime) {
        this.mesh.rotation.y += 3 * deltaTime;
    }

    collect() {
        gameState.score += 10;
        gameState.scene.remove(this.mesh);
        // Maybe add particle effect here later
    }
}

export class Obstacle {
    constructor(x, y, z, type) {
        this.type = type; // 'low', 'high', 'full'
        let geometry, material;
        
        if (type === 'low') {
            // Jump over (Log/Stone)
            geometry = new THREE.BoxGeometry(2, 0.8, 0.5);
            material = new THREE.MeshStandardMaterial({ color: 0x555555 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(x, 0.4, z);
        } else if (type === 'high') {
            // Duck under (Arch/Beam)
            geometry = new THREE.BoxGeometry(2.5, 0.5, 0.5);
            material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(x, 2.0, z); // High up
            
            // Pillars for the arch
            const poleGeo = new THREE.BoxGeometry(0.2, 2.5, 0.2);
            const pole1 = new THREE.Mesh(poleGeo, material);
            pole1.position.set(-1, -1.0, 0);
            this.mesh.add(pole1);
            
            const pole2 = new THREE.Mesh(poleGeo, material);
            pole2.position.set(1, -1.0, 0);
            this.mesh.add(pole2);

        } else if (type === 'full') {
            // Move around (Wall/Fire)
            geometry = new THREE.BoxGeometry(2, 3, 1);
            material = new THREE.MeshStandardMaterial({ color: 0x880000 });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(x, 1.5, z);
        }

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        gameState.scene.add(this.mesh);
    }
}