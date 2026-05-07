import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { getRandomColor } from './math_utils.js';

// Base Entity Class
class Entity {
    constructor(x, y, z) {
        this.mesh = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.colliderType = 'none'; // 'sphere', 'box'
        this.isStatic = false;
        this.onGround = false;
        this.groundFriction = 0.85;
        this.airFriction = 0.98;
    }

    update(dt) {
        // Base update logic
    }

    updateCollider() {
        // Update collider bounds based on mesh position
    }
}

// Player / Bot Character
export class Character extends Entity {
    constructor(x, y, z, color = null, isBot = false) {
        super(x, y, z);
        this.isBot = isBot;
        
        // Dimensions
        this.radius = 0.6;
        this.height = 1.5;
        
        // Physics
        this.colliderType = 'sphere';
        this.speed = 120.0; // Tuned down from 150.0
        this.jumpForce = 15.0;
        this.diveForce = 15.0;
        
        // State
        this.state = 'IDLE'; // IDLE, RUN, JUMP, DIVE, FALL, STUMBLE
        this.stumbleTimer = 0;
        this.lastCheckpoint = new THREE.Vector3(x, y, z);
        
        // Mesh Construction
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        
        // Body (Capsule-ish)
        const bodyGeo = new THREE.CapsuleGeometry(this.radius, 0.8, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: color || getRandomColor(),
            roughness: 0.4,
            metalness: 0.1
        });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.9; // Center vertically
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.mesh.add(this.bodyMesh);
        
        // Eyes (Goggles)
        const faceGeo = new THREE.BoxGeometry(0.8, 0.3, 0.2);
        const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White face plate
        const faceMesh = new THREE.Mesh(faceGeo, faceMat);
        faceMesh.position.set(0, 1.1, -0.5); // Front is -Z
        this.bodyMesh.add(faceMesh);
        
        const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.2, 0, -0.11);
        faceMesh.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.2, 0, -0.11);
        faceMesh.add(rightEye);
        
        // Shadow helper
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        gameState.scene.add(this.mesh);
        gameState.entities.push(this);
        if (isBot) gameState.enemies.push(this);
    }
    
    update(dt) {
        // Update timers
        if (this.stumbleTimer > 0) {
            this.stumbleTimer -= dt;
        }

        // State Machine
        if (this.stumbleTimer > 0) {
            this.state = 'STUMBLE';
        } else if (this.state === 'DIVE') {
            if (this.onGround) {
                // Landed from dive
                this.state = 'STUMBLE';
                this.stumbleTimer = 0.5; // Recovery time
            }
            // If not onGround, remain in DIVE state
        } else {
            // Standard states
            if (!this.onGround) {
                this.state = 'FALL';
            } else if (this.velocity.lengthSq() > 0.5) {
                this.state = 'RUN';
            } else {
                this.state = 'IDLE';
            }
        }
        
        // Kill plane
        if (this.mesh.position.y < gameState.killPlaneY) {
            this.respawn();
        }
        
        // Visuals
        // Reset transforms
        this.bodyMesh.rotation.x = 0;
        this.bodyMesh.rotation.z = 0;
        
        if (this.state === 'RUN') {
            const wobble = Math.sin(gameState.frameCount * 0.3) * 0.1;
            this.bodyMesh.rotation.z = wobble;
            this.bodyMesh.rotation.x = 0.2; // Lean forward
        } else if (this.state === 'IDLE') {
            this.bodyMesh.scale.y = 1.0 + Math.sin(gameState.frameCount * 0.05) * 0.02;
        } else if (this.state === 'STUMBLE') {
            this.bodyMesh.rotation.x = Math.sin(gameState.frameCount * 0.5) * 1.5; // Flail
            this.bodyMesh.scale.y = 1.0;
        } else if (this.state === 'DIVE') {
            this.bodyMesh.rotation.x = -Math.PI / 2;
            this.bodyMesh.scale.y = 1.0;
        }
    }
    
    move(inputDir, dt) {
        if (this.stumbleTimer > 0) return; // Can't move while stumbling
        if (this.state === 'DIVE') return; // Can't control movement while diving
        
        // Input is Vector3 (x, 0, z) normalized
        if (inputDir.lengthSq() > 0) {
            // Apply air control reduction
            const controlFactor = this.onGround ? 1.0 : 0.15;

            // Accelerate
            const moveForce = inputDir.clone().multiplyScalar(this.speed * controlFactor * dt);
            
            // Limit max horizontal speed
            const currentHVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
            if (currentHVel.length() < 20.0) { // Tuned down from 25.0
                this.velocity.add(moveForce);
            }
            
            // Rotate towards movement
            const rotY = Math.atan2(inputDir.x, inputDir.z) + Math.PI; 
            const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), rotY);
            this.mesh.quaternion.slerp(q, 10 * dt);
        }
    }
    
    jump() {
        if (this.onGround && this.stumbleTimer <= 0) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
            this.state = 'JUMP';
            
            // Squash
            this.bodyMesh.scale.set(0.8, 1.3, 0.8);
            setTimeout(() => this.bodyMesh.scale.set(1,1,1), 200);
        }
    }
    
    dive() {
        if (!this.onGround && this.stumbleTimer <= 0 && this.state !== 'DIVE') {
            // Launch forward - Model faces -Z, so we use (0,0,-1)
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
            this.velocity.add(forward.multiplyScalar(this.diveForce));
            this.velocity.y = 5.0; // Little pop up
            this.state = 'DIVE';
            // Note: stumbleTimer is NOT set here, only on impact in update()
        }
    }
    
    knockback(force) {
        this.velocity.add(force);
        this.stumbleTimer = 0.5;
        this.onGround = false;
    }
    
    respawn() {
        this.velocity.set(0, 0, 0);
        this.mesh.position.copy(this.lastCheckpoint);
        this.mesh.position.y += 2; // Drop in
        this.stumbleTimer = 0;
        this.state = 'FALL';
    }
}

// Bot AI Logic
export class Bot extends Character {
    constructor(x, y, z, waypoints) {
        super(x, y, z, null, true);
        this.waypoints = waypoints || [];
        this.currentWaypointIdx = 0;
        this.reactionDelay = Math.random() * 0.5; // Individual variance
        this.jumpCooldown = 0;
    }
    
    update(dt) {
        super.update(dt);
        
        if (gameState.gamePhase !== "PLAYING") return;
        
        // Simple AI: Move to next waypoint
        if (this.currentWaypointIdx < this.waypoints.length) {
            const target = this.waypoints[this.currentWaypointIdx];
            const toTarget = new THREE.Vector3().subVectors(target, this.mesh.position);
            toTarget.y = 0; // Ignore height diff for steering
            
            const dist = toTarget.length();
            
            if (dist < 2.0) {
                this.currentWaypointIdx++;
            } else {
                toTarget.normalize();
                this.move(toTarget, dt);
                
                // Obstacle avoidance (Raycast simulation)
                // Random jump if moving slow (stuck)
                const hSpeed = Math.sqrt(this.velocity.x**2 + this.velocity.z**2);
                if (hSpeed < 1.0 && this.jumpCooldown <= 0) {
                    if (Math.random() < 0.05) {
                        this.jump();
                        this.jumpCooldown = 1.0;
                    }
                }
                
                // Jump over gaps (simple heuristic based on specific Z coords of gaps)
                // Hardcoded knowledge of the level geometry for bots
                // E.g. gap at z = -20
                if (Math.abs(this.mesh.position.z - (-18)) < 2.0) {
                     this.jump();
                }
            }
        }
        
        if (this.jumpCooldown > 0) this.jumpCooldown -= dt;
    }
}

// Static Platform
export class Platform extends Entity {
    constructor(x, y, z, width, height, depth, color = 0x44aaff) {
        super(x, y, z);
        this.isStatic = true;
        this.colliderType = 'box';
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        
        // Store bounds for collision
        this.bounds = {
            min: new THREE.Vector3(x - width/2, y - height/2, z - depth/2),
            max: new THREE.Vector3(x + width/2, y + height/2, z + depth/2)
        };
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this);
    }
}

// Spinning Hammer / Obstacle
export class Rotator extends Entity {
    constructor(x, y, z, length, speed) {
        super(x, y, z);
        this.isStatic = true; // Does not move via physics engine, moves kinematically
        this.colliderType = 'custom';
        this.rotSpeed = speed;
        this.length = length;
        
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Center post
        const postGeo = new THREE.CylinderGeometry(0.5, 0.5, 2);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const post = new THREE.Mesh(postGeo, postMat);
        group.add(post);
        
        // Arm
        const armGeo = new THREE.BoxGeometry(length, 0.5, 0.5);
        const armMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.arm = new THREE.Mesh(armGeo, armMat);
        this.arm.position.y = 0.5;
        group.add(this.arm);
        
        this.mesh = group;
        gameState.scene.add(this.mesh);
        gameState.obstacles.push(this);
    }
    
    update(dt) {
        this.arm.rotation.y += this.rotSpeed * dt;
    }
    
    resolveCollision(entity) {
        // Approximate arm as a capsule or OBB
        // Simple approximation: Check distance to center, then check angle
        // Better: Transform entity pos to local space of the arm
        
        const localPos = entity.mesh.position.clone().sub(this.mesh.position);
        
        // Check vertical range
        if (localPos.y < 0 || localPos.y > 1.5) return;
        
        // Check radial distance
        const dist = Math.sqrt(localPos.x*localPos.x + localPos.z*localPos.z);
        if (dist > this.length / 2 + entity.radius) return; // Out of reach
        
        // Get arm angle
        const armAngle = this.arm.rotation.y % (Math.PI * 2);
        const entAngle = Math.atan2(localPos.x, localPos.z); // Z is forward in 3js? atan2(x, z) gives angle from Z axis
        
        // This math is getting complex for strict constraints.
        // Alternative: Use a set of moving spheres along the arm for collision
        // Let's implement that on the fly for better accuracy
        
        const numSpheres = 5;
        const segmentLen = this.length / numSpheres;
        const armDir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), this.arm.rotation.y);
        
        for (let i = -2; i <= 2; i++) {
            if (i === 0) continue; // Skip center
            const offset = armDir.clone().multiplyScalar(i * (this.length / 2) / 2.5);
            const spherePos = this.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)).add(offset);
            
            const dSq = spherePos.distanceToSquared(entity.mesh.position);
            const rSum = 0.5 + entity.radius; // Arm thickness approx 0.5
            
            if (dSq < rSum * rSum) {
                // Hit!
                // Calculate tangent velocity of the arm at this point
                // v = w x r
                const radiusVector = offset; // Vector from center to impact point
                const angularVel = new THREE.Vector3(0, this.rotSpeed, 0);
                const linearVel = new THREE.Vector3().crossVectors(angularVel, radiusVector);
                
                // Knockback
                const force = linearVel.multiplyScalar(3.0); // Multiplier for punch
                force.y = 5.0; // Upward kick
                
                entity.knockback(force);
                return; // Only one hit per frame
            }
        }
    }
}

export class FinishLine extends Entity {
    constructor(x, y, z, width) {
        super(x, y, z);
        this.width = width;
        this.isStatic = true;
        
        // Visuals: Chequered flag pattern
        // Simple arch
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        
        const poleL = new THREE.Mesh(poleGeo, poleMat);
        poleL.position.x = -width/2;
        poleL.position.y = 2.5;
        group.add(poleL);
        
        const poleR = new THREE.Mesh(poleGeo, poleMat);
        poleR.position.x = width/2;
        poleR.position.y = 2.5;
        group.add(poleR);
        
        const bannerGeo = new THREE.BoxGeometry(width, 1, 0.1);
        const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Gold banner
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.y = 4.5;
        group.add(banner);
        
        this.mesh = group;
        gameState.scene.add(this.mesh);
        gameState.obstacles.push(this); // Treat as trigger
    }
    
    resolveCollision(entity) {
        // Check if passed through plane
        if (Math.abs(entity.mesh.position.z - this.mesh.position.z) < 1.0) {
            if (Math.abs(entity.mesh.position.x - this.mesh.position.x) < this.width/2) {
                // Qualified!
                if (entity === gameState.player && gameState.gamePhase === "PLAYING") {
                    // Trigger level completion instead of immediate win
                    gameState.levelComplete = true;
                } else if (entity.isBot) {
                    // Bot logic for winning?
                    // Remove bot or mark as qualified
                    if (!entity.qualified) {
                        entity.qualified = true;
                        gameState.qualifiedCount++;
                        // remove bot visually? or let them dance?
                        entity.state = 'DANCE';
                        entity.velocity.set(0,0,0);
                        // Teleport to side area
                        entity.mesh.position.x += 10;
                    }
                }
            }
        }
    }
}