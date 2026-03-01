import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, LANE_COUNT, GRAVITY, JUMP_FORCE, SLIDE_DURATION } from './globals.js';
import { inputQueue } from './input.js';

/**
 * Player Entity
 */
export class Player {
    constructor() {
        this.mesh = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.4 });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.6;
        this.body.castShadow = true;
        this.mesh.add(this.body);

        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.45;
        this.head.castShadow = true;
        this.mesh.add(this.head);

        // Limbs for animation
        this.legs = [];
        const legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x224488 });
        
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.2, 0.3, 0);
        this.mesh.add(leftLeg);
        this.legs.push(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.2, 0.3, 0);
        this.mesh.add(rightLeg);
        this.legs.push(rightLeg);

        gameState.scene.add(this.mesh);

        // Logic state
        this.currentLane = 1; // 0: Left, 1: Center, 2: Right
        this.targetLaneX = 0;
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isGrounded = true;
        this.isSliding = false;
        this.slideTimer = 0;
        
        // Stumble mechanic
        this.stumbleIntensity = 0;

        // Position init
        this.mesh.position.set(0, 0, 0);
        this.updateLaneTarget();
    }

    update(deltaTime) {
        this.processInput();
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateStumble(deltaTime);
    }

    processInput() {
        // Limit processing one move action per frame if needed, 
        // but queue allows handling rapid inputs
        if (inputQueue.length > 0) {
            const action = inputQueue.shift();
            
            if (action === 'LEFT') {
                if (this.currentLane > 0) {
                    this.currentLane--;
                    this.updateLaneTarget();
                }
            } else if (action === 'RIGHT') {
                if (this.currentLane < LANE_COUNT - 1) {
                    this.currentLane++;
                    this.updateLaneTarget();
                }
            } else if (action === 'JUMP') {
                if (this.isGrounded && !this.isSliding) {
                    this.jump();
                }
            } else if (action === 'SLIDE') {
                if (this.isGrounded && !this.isSliding) {
                    this.slide();
                } else if (!this.isGrounded) {
                    // Fast drop if in air
                    this.velocity.y = -0.5;
                }
            }
        }
    }

    updateLaneTarget() {
        this.targetLaneX = (this.currentLane - 1) * LANE_WIDTH;
    }

    jump() {
        this.velocity.y = JUMP_FORCE;
        this.isGrounded = false;
        // Squash effect
        this.mesh.scale.set(0.8, 1.2, 0.8);
    }

    slide() {
        this.isSliding = true;
        this.slideTimer = SLIDE_DURATION;
        
        // Rotate body to horizontal
        this.body.rotation.x = -Math.PI / 2;
        this.body.position.y = 0.3;
        this.head.position.y = 0.3;
        this.head.position.z = 0.6;
        
        // Hide legs temporarily or rotate them
        this.legs.forEach(leg => leg.visible = false);
    }

    stopSlide() {
        this.isSliding = false;
        
        // Restore body
        this.body.rotation.x = 0;
        this.body.position.y = 0.6;
        this.head.position.y = 1.45;
        this.head.position.z = 0;
        
        this.legs.forEach(leg => leg.visible = true);
    }

    updatePhysics(deltaTime) {
        // Forward Movement (Simulated by moving world, but we track Z for logic)
        // Actually, we move player -Z for simplicity in logic
        this.mesh.position.z -= gameState.runSpeed;
        gameState.distanceTraveled += gameState.runSpeed;

        // Lane switching (X axis interpolation)
        const lerpFactor = 10 * deltaTime;
        this.mesh.position.x += (this.targetLaneX - this.mesh.position.x) * lerpFactor;
        
        // Tilt based on lane movement
        const xDiff = this.targetLaneX - this.mesh.position.x;
        this.mesh.rotation.z = -xDiff * 0.1; // Bank into turn

        // Gravity & Vertical Movement
        this.velocity.add(gameState.gravity);
        this.mesh.position.y += this.velocity.y;

        // Ground Collision
        if (this.mesh.position.y <= 0) {
            this.mesh.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
            
            // Land squash
            if (this.mesh.scale.y > 1.0) {
                this.mesh.scale.set(1.1, 0.9, 1.1);
            }
        }

        // Return scale to normal
        this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

        // Slide Timer
        if (this.isSliding) {
            this.slideTimer -= deltaTime;
            if (this.slideTimer <= 0) {
                this.stopSlide();
            }
        }
    }

    updateAnimation(deltaTime) {
        if (!this.isGrounded) {
            // Jump pose
            this.legs[0].rotation.x = 0.5;
            this.legs[1].rotation.x = -0.5;
        } else if (this.isSliding) {
            // Sliding handled in updatePhysics state
        } else {
            // Running cycle
            const freq = 15;
            this.legs[0].rotation.x = Math.sin(gameState.time * freq) * 0.8;
            this.legs[1].rotation.x = Math.sin(gameState.time * freq + Math.PI) * 0.8;
            
            // Bobbing
            this.mesh.position.y += Math.abs(Math.sin(gameState.time * freq * 2)) * 0.05;
        }
    }

    stumble() {
        this.stumbleIntensity = 1.0;
        // Slow down slightly? Or just visual?
        // Let's bring the demon closer
        if (gameState.demon) {
            gameState.demon.approach();
        }
    }
    
    updateStumble(deltaTime) {
        if (this.stumbleIntensity > 0) {
            this.stumbleIntensity -= deltaTime;
            this.mesh.material && (this.mesh.material.color.setHex(0xff0000)); // Flash red logic would go here
        }
    }

    die() {
        gameState.gamePhase = 'GAME_OVER_LOSE';
        
        // Death animation: Fall over
        this.mesh.rotation.x = -Math.PI / 2;
    }
}

/**
 * Demon Entity - Follows player
 */
export class Demon {
    constructor() {
        this.mesh = new THREE.Group();
        
        // Spooky shape
        const bodyGeo = new THREE.SphereGeometry(1.2, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.5;
        this.mesh.add(body);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.3, 4, 4);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.5, 1.8, -0.8);
        this.mesh.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.5, 1.8, -0.8);
        this.mesh.add(rightEye);

        gameState.scene.add(this.mesh);
        
        this.offsetZ = 6; // Distance behind player
        this.targetOffsetZ = 12; // Normal following distance
        this.mesh.position.set(0, 0, 10);
    }

    update(deltaTime) {
        if (!gameState.player) return;

        // Recover distance slowly
        if (this.targetOffsetZ < 12) {
            this.targetOffsetZ += deltaTime * 0.5;
        }
        
        // Lerp current offset
        this.offsetZ += (this.targetOffsetZ - this.offsetZ) * deltaTime * 2;

        const pPos = gameState.player.mesh.position;
        
        // Follow player position with lag
        this.mesh.position.x += (pPos.x - this.mesh.position.x) * deltaTime * 5;
        this.mesh.position.z = pPos.z + this.offsetZ;
        this.mesh.position.y = Math.max(0, pPos.y + 0.5); // Fly slightly

        // Bobbing
        this.mesh.position.y += Math.sin(gameState.time * 3) * 0.5;
        
        // Check if caught
        if (this.offsetZ < 2.0 && gameState.gamePhase === 'PLAYING') {
            gameState.player.die();
        }
    }

    approach() {
        this.targetOffsetZ = Math.max(2.0, this.targetOffsetZ - 4.0);
    }
}

/**
 * Collectible Coin
 */
export class Coin {
    constructor(x, y, z) {
        this.mesh = new THREE.Group();
        
        // Gold Coin
        const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xffd700, 
            metalness: 1.0, 
            roughness: 0.3,
            emissive: 0xaa6600,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        this.mesh.add(mesh);
        
        // Inner fill
        const fillGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16);
        const fillMesh = new THREE.Mesh(fillGeo, mat);
        fillMesh.rotation.x = Math.PI/2;
        this.mesh.add(fillMesh);

        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
        
        this.active = true;
        this.baseY = y;
    }

    update(deltaTime) {
        if (!this.active) return;
        
        // Spin
        this.mesh.rotation.y += deltaTime * 3;
        
        // Float
        this.mesh.position.y = this.baseY + Math.sin(gameState.time * 4) * 0.2;

        // Collision
        if (gameState.player) {
            const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
            if (dist < 1.0) {
                this.collect();
            }
        }
    }

    collect() {
        this.active = false;
        gameState.scene.remove(this.mesh);
        gameState.score += 50;
        gameState.coinsCollected++;
        
        // Visual flair could go here (particles)
    }
}

/**
 * Obstacle
 */
export class Obstacle {
    constructor(type, x, z) {
        this.type = type; // 'WALL', 'BEAM', 'PIT'
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, 0, z);
        
        // Bounds for collision
        this.collisionBox = new THREE.Box3();
        
        if (type === 'WALL') {
            const geo = new THREE.BoxGeometry(LANE_WIDTH * 0.9, 1.0, 0.5);
            const mat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 0.5;
            mesh.castShadow = true;
            this.mesh.add(mesh);
            
            // Define local bounds relative to mesh pos
            this.localBounds = { min: new THREE.Vector3(-1.4, 0, -0.25), max: new THREE.Vector3(1.4, 1.0, 0.25) };
        
        } else if (type === 'BEAM') {
            const geo = new THREE.BoxGeometry(LANE_WIDTH * 0.9, 0.5, 0.5);
            const mat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 1.8; // High enough to slide under
            mesh.castShadow = true;
            this.mesh.add(mesh);
            
            // Posts
            const postGeo = new THREE.BoxGeometry(0.2, 2.0, 0.2);
            const postLeft = new THREE.Mesh(postGeo, mat);
            postLeft.position.set(-1.3, 1.0, 0);
            this.mesh.add(postLeft);
            const postRight = new THREE.Mesh(postGeo, mat);
            postRight.position.set(1.3, 1.0, 0);
            this.mesh.add(postRight);

            this.localBounds = { min: new THREE.Vector3(-1.4, 1.2, -0.25), max: new THREE.Vector3(1.4, 2.5, 0.25) };

        } else if (type === 'PIT') {
            // Visual representation of a pit (fire/lava)
            const geo = new THREE.PlaneGeometry(LANE_WIDTH * 0.9, 1.5);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.05; // Just above ground to avoid z-fight
            this.mesh.add(mesh);
            
            this.localBounds = { min: new THREE.Vector3(-1.4, -1, -0.75), max: new THREE.Vector3(1.4, 0.1, 0.75) };
        }

        gameState.scene.add(this.mesh);
    }

    update() {
        // Update world bounds
        this.collisionBox.set(
            new THREE.Vector3().addVectors(this.mesh.position, this.localBounds.min),
            new THREE.Vector3().addVectors(this.mesh.position, this.localBounds.max)
        );
    }
}