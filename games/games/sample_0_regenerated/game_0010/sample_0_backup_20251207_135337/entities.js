import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { PhysicsBody } from './physics.js';
import { keys, inputBuffer, clearInputBuffer } from './inputs.js';
import { randomRange } from './utils.js';

// --- Base Entity ---
export class Entity {
    constructor(x, y, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        this.isDead = false;
        this.physicsBody = null;
        this.radius = 1;
        gameState.scene.add(this.mesh);
        gameState.entities.push(this);
    }

    update(dt) {
        if (this.physicsBody) this.physicsBody.update(dt);
    }

    destroy() {
        this.isDead = true;
        gameState.scene.remove(this.mesh);
        // Note: Actual removal from gameState.entities array happens in game loop cleanup
    }
}

// --- Player ---
export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        
        // Visuals
        this.createMesh();
        
        // Physics
        this.physicsBody = new PhysicsBody(this.mesh, 1.0, 0.8);
        this.radius = 0.8;
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxStamina = 100;
        this.stamina = 100;
        this.speed = 10;
        this.potions = 3;
        
        // Combat
        this.damage = 15;
        this.lastAttackTime = 0;
        this.iFrames = 0;
        
        // State Machine
        this.state = "IDLE"; // IDLE, MOVE, ATTACK, ROLL, HIT, DEAD
        this.stateTimer = 0;
        this.comboCount = 0;
        
        // Camera target helper
        this.cameraTarget = new THREE.Object3D();
        this.cameraTarget.position.y = 2;
        this.mesh.add(this.cameraTarget);
    }
    
    createMesh() {
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.3, 1.5, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_ARMOR });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.75;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.6;
        this.head.castShadow = true;
        this.mesh.add(this.head);
        
        // Weapon (Great Sword)
        const weaponGroup = new THREE.Group();
        const bladeGeo = new THREE.BoxGeometry(0.2, 1.8, 0.4);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        this.blade = new THREE.Mesh(bladeGeo, bladeMat);
        this.blade.position.y = 0.9;
        
        const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        this.handle = new THREE.Mesh(handleGeo, handleMat);
        this.handle.rotation.x = Math.PI / 2;
        this.handle.position.y = 0;
        
        weaponGroup.add(this.blade);
        weaponGroup.add(this.handle);
        
        // Position weapon on back initially
        weaponGroup.position.set(0, 1.0, -0.4);
        weaponGroup.rotation.z = 0.5;
        
        this.weapon = weaponGroup;
        this.mesh.add(this.weapon);
    }

    update(dt) {
        if (this.health <= 0 && this.state !== "DEAD") {
            this.setState("DEAD");
        }
        
        super.update(dt);
        this.regenerateStamina(dt);
        this.handleInput(dt);
        this.updateState(dt);
        this.updateAnimations(dt);
        
        // I-frames
        if (this.iFrames > 0) this.iFrames -= dt;
    }
    
    regenerateStamina(dt) {
        if (this.state !== "ROLL" && !keys.Shift) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 15 * dt);
        }
    }
    
    handleInput(dt) {
        if (this.state === "DEAD" || this.state === "HIT" || this.state === "ROLL") return;
        
        // TEST MODE OVERRIDES
        if (gameState.controlMode === "TEST_1") {
            // Simulate moving forward
            keys.w = true;
        } else if (gameState.controlMode === "TEST_2") {
            // Simulate attack when near monster
            const monster = gameState.monster;
            if (monster && this.mesh.position.distanceTo(monster.mesh.position) < 3) {
                 if (this.state === "IDLE") {
                     inputBuffer.attack = true;
                 }
            } else {
                 // Move to monster
                 // Simple AI for test
                 if (monster) {
                     const dir = new THREE.Vector3().subVectors(monster.mesh.position, this.mesh.position).normalize();
                     this.physicsBody.velocity.x = dir.x * this.speed;
                     this.physicsBody.velocity.z = dir.z * this.speed;
                     this.mesh.lookAt(monster.mesh.position);
                 }
            }
        }
        
        // Movement
        const moveDir = new THREE.Vector3(0, 0, 0);
        if (keys.w || keys.ArrowUp) moveDir.z -= 1;
        if (keys.s || keys.ArrowDown) moveDir.z += 1;
        if (keys.a || keys.ArrowLeft) moveDir.x -= 1;
        if (keys.d || keys.ArrowRight) moveDir.x += 1;
        
        if (moveDir.lengthSq() > 0) {
            // Camera relative movement
            const camDir = new THREE.Vector3();
            gameState.camera.getWorldDirection(camDir);
            camDir.y = 0;
            camDir.normalize();
            
            const camRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), camDir).normalize();
            
            const finalMove = new THREE.Vector3()
                .add(camDir.multiplyScalar(-moveDir.z)) // Corrected: W is forward (negative local Z), but usually mapped to camera forward
                .add(camRight.multiplyScalar(moveDir.x)); // Corrected mapping
            
            finalMove.normalize();
            
            // Sprinting
            const isSprinting = keys.Shift && this.stamina > 0;
            const currentSpeed = isSprinting ? this.speed * 1.5 : this.speed;
            
            if (isSprinting) this.stamina -= 20 * dt;
            
            if (this.state !== "ATTACK") {
                this.physicsBody.velocity.x = finalMove.x * currentSpeed;
                this.physicsBody.velocity.z = finalMove.z * currentSpeed;
                
                // Rotate to face movement
                const targetRotation = Math.atan2(finalMove.x, finalMove.z);
                // Smooth rotation
                const curRot = this.mesh.rotation.y;
                let diff = targetRotation - curRot;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.mesh.rotation.y += diff * 10 * dt;
                
                if (this.state !== "ROLL") this.setState("MOVE");
            }
        } else {
            if (this.state === "MOVE") this.setState("IDLE");
        }
        
        // Actions
        if (inputBuffer.dodge && this.stamina >= 25 && this.state !== "ROLL") {
            this.setState("ROLL");
            this.stamina -= 25;
            inputBuffer.dodge = false;
        } else if (inputBuffer.attack && this.state !== "ROLL") {
            if (this.state !== "ATTACK") {
                this.setState("ATTACK");
            } else if (this.state === "ATTACK" && this.stateTimer > 0.5) {
                // Combo window
                this.comboCount++;
                this.stateTimer = 0; // Reset timer for next swing
                inputBuffer.attack = false;
            }
        }
        
        // Potion
        if (keys.h && this.potions > 0 && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + 50);
            this.potions--;
            keys.h = false; // consume key
            // Create particle effect
            createParticles(this.mesh.position, 0x00ff00, 10);
        }
    }
    
    setState(newState) {
        if (this.state === newState && newState !== "ATTACK") return;
        
        this.state = newState;
        this.stateTimer = 0;
        
        // Enter state logic
        if (newState === "ROLL") {
            this.iFrames = 0.5; // 0.5s invulnerability
            // Dash impulse
            const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
            this.physicsBody.velocity.add(fwd.multiplyScalar(15));
        }
        
        if (newState === "ATTACK") {
            // Put weapon in hand
            this.weapon.position.set(0.4, 1.0, 0.5);
            this.weapon.rotation.set(Math.PI/2, 0, -Math.PI/4);
            
            // Check Hit logic is done in updateAnimations via timing
        }
        
        if (newState === "IDLE" || newState === "MOVE") {
            // Weapon on back
            this.weapon.position.set(0, 1.0, -0.4);
            this.weapon.rotation.set(0, 0, 0.5);
            this.comboCount = 0;
        }
    }
    
    updateState(dt) {
        this.stateTimer += dt;
        
        if (this.state === "ROLL") {
            if (this.stateTimer > 0.6) this.setState("IDLE");
        }
        
        if (this.state === "ATTACK") {
            const attackDuration = 0.8;
            
            // Damage window
            if (this.stateTimer > 0.3 && this.stateTimer < 0.5) {
                this.checkAttackHit();
            }
            
            if (this.stateTimer > attackDuration) {
                this.setState("IDLE");
                clearInputBuffer();
            }
        }
        
        if (this.state === "HIT") {
            if (this.stateTimer > 0.5) this.setState("IDLE");
        }

        if (this.state === "DEAD") {
            // Fall over
            if (this.mesh.rotation.x > -Math.PI/2) {
                this.mesh.rotation.x -= 5 * dt;
            }
        }
    }
    
    checkAttackHit() {
        // Simple hitbox in front of player
        const hitPos = this.mesh.position.clone().add(
            new THREE.Vector3(0, 0, 1.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y)
        );
        
        // Visual debug for hit (particle)
        // createParticles(hitPos, 0xffffff, 1);
        
        const monster = gameState.monster;
        if (monster && !monster.isDead) {
            const dist = hitPos.distanceTo(monster.mesh.position);
            if (dist < monster.radius + 1.5) { // 1.5 is approx weapon reach
                // Apply damage only once per swing
                if (this.lastAttackTime < gameState.frameCount - 10) { // debounce
                    monster.takeDamage(this.damage);
                    this.lastAttackTime = gameState.frameCount;
                    // Hit stop/Camera shake could go here
                }
            }
        }
    }
    
    updateAnimations(dt) {
        const t = gameState.frameCount * 0.2;
        
        if (this.state === "MOVE") {
            // Bobbing
            this.body.position.y = 0.75 + Math.sin(t) * 0.05;
            // Swing weapon if on back
            if (this.weapon.position.z < 0) {
                 this.weapon.rotation.z = 0.5 + Math.sin(t) * 0.1;
            }
        } else if (this.state === "ATTACK") {
            // Swing animation
            const progress = this.stateTimer / 0.8;
            const swingAngle = -Math.PI/4 + Math.sin(progress * Math.PI) * Math.PI;
            this.weapon.rotation.x = Math.PI/2 + swingAngle;
        }
    }
    
    takeDamage(amount) {
        if (this.iFrames > 0 || this.state === "DEAD") return;
        
        this.health -= amount;
        this.setState("HIT");
        this.iFrames = 1.0;
        
        // Knockback
        const back = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), this.mesh.rotation.y);
        this.physicsBody.applyForce(back.multiplyScalar(10));
        
        createParticles(this.mesh.position, 0xff0000, 10);
        
        if (this.health <= 0) {
            this.setState("DEAD");
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
}

// --- Monster ---
export class Monster extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        
        this.createMesh();
        
        this.physicsBody = new PhysicsBody(this.mesh, 5.0, 2.0);
        this.radius = 2.5;
        
        this.maxHealth = 200;
        this.health = 200;
        this.damage = 25;
        this.speed = 4;
        
        // AI State
        this.state = "IDLE"; // IDLE, CHASE, PREPARE, ATTACK, COOLDOWN, STUNNED
        this.stateTimer = 0;
        this.enraged = false;
        
        // Test 3 helper
        if (gameState.controlMode === "TEST_3") {
            this.health = 1;
        }
    }
    
    createMesh() {
        const mat = new THREE.MeshStandardMaterial({ color: COLORS.MONSTER_SKIN });
        
        // Torso
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 4), mat);
        this.torso.position.y = 2.5;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);
        
        // Head
        this.head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2.5), mat);
        this.head.position.set(0, 3.5, 2.5);
        this.mesh.add(this.head);
        
        // Jaw
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 2), new THREE.MeshStandardMaterial({color: 0x550000}));
        jaw.position.set(0, -0.8, 0.2);
        this.head.add(jaw);
        
        // Tail
        this.tail = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4, 8), mat);
        this.tail.rotation.x = -Math.PI / 2;
        this.tail.position.set(0, 2.5, -3.5);
        this.mesh.add(this.tail);
        
        // Legs (Simplified)
        const legGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.5);
        this.legFL = new THREE.Mesh(legGeo, mat);
        this.legFL.position.set(1.2, 1.25, 1.5);
        
        this.legFR = new THREE.Mesh(legGeo, mat);
        this.legFR.position.set(-1.2, 1.25, 1.5);
        
        this.legBL = new THREE.Mesh(legGeo, mat);
        this.legBL.position.set(1.2, 1.25, -1.5);
        
        this.legBR = new THREE.Mesh(legGeo, mat);
        this.legBR.position.set(-1.2, 1.25, -1.5);
        
        this.mesh.add(this.legFL, this.legFR, this.legBL, this.legBR);
    }
    
    update(dt) {
        if (this.health <= 0) {
            this.handleDeath(dt);
            return;
        }
        
        super.update(dt);
        this.updateAI(dt);
        this.animate(dt);
    }
    
    updateAI(dt) {
        this.stateTimer += dt;
        const player = gameState.player;
        if (!player || player.state === "DEAD") return;
        
        const distToPlayer = this.mesh.position.distanceTo(player.mesh.position);
        
        // Enrage logic
        if (this.health < this.maxHealth * 0.5 && !this.enraged) {
            this.enraged = true;
            this.speed *= 1.5;
            this.torso.material.color.setHex(0xff0000); // Turn red
        }
        
        switch (this.state) {
            case "IDLE":
                if (distToPlayer < 20) {
                    this.state = "CHASE";
                }
                break;
                
            case "CHASE":
                if (distToPlayer < 4) {
                    this.state = "PREPARE";
                    this.stateTimer = 0;
                    this.physicsBody.velocity.set(0,0,0);
                } else {
                    // Move towards player
                    const dir = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position).normalize();
                    this.physicsBody.velocity.x = dir.x * this.speed;
                    this.physicsBody.velocity.z = dir.z * this.speed;
                    this.mesh.lookAt(player.mesh.position);
                }
                break;
                
            case "PREPARE":
                // Telegraph attack (shake head)
                this.head.rotation.z = Math.sin(this.stateTimer * 20) * 0.2;
                if (this.stateTimer > (this.enraged ? 0.5 : 1.0)) {
                    this.state = "ATTACK";
                    this.stateTimer = 0;
                    // Lunge
                    const fwd = new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0), this.mesh.rotation.y);
                    this.physicsBody.applyForce(fwd.multiplyScalar(50));
                }
                break;
                
            case "ATTACK":
                // Hitbox active
                if (distToPlayer < 4 && this.stateTimer < 0.5) {
                    player.takeDamage(this.damage);
                }
                
                if (this.stateTimer > 0.8) {
                    this.state = "COOLDOWN";
                    this.stateTimer = 0;
                }
                break;
                
            case "COOLDOWN":
                if (this.stateTimer > 1.5) {
                    this.state = "CHASE";
                }
                break;
        }
    }
    
    animate(dt) {
        const t = gameState.frameCount * 0.1;
        // Walk cycle
        if (this.physicsBody.velocity.lengthSq() > 0.1) {
            this.legFL.rotation.x = Math.sin(t) * 0.5;
            this.legFR.rotation.x = Math.sin(t + Math.PI) * 0.5;
            this.legBL.rotation.x = Math.sin(t + Math.PI) * 0.5;
            this.legBR.rotation.x = Math.sin(t) * 0.5;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createParticles(this.mesh.position, 0xffff00, 15);
        
        // Flash white
        const oldColor = this.torso.material.color.getHex();
        this.torso.material.color.setHex(0xffffff);
        setTimeout(() => {
            if (this.torso) this.torso.material.color.setHex(oldColor);
        }, 100);
        
        if (this.health <= 0) {
            this.isDead = true; // Mark for logic, but keep mesh for animation
            // Disable physics collisions with player essentially by not updating AI
        }
    }
    
    handleDeath(dt) {
        this.mesh.rotation.z += 1 * dt;
        if (this.mesh.rotation.z > Math.PI / 2) {
            gameState.gamePhase = "GAME_OVER_WIN";
            gameState.score += 1000;
        }
    }
}

// --- Environment ---
export class Tree {
    constructor(x, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, 0, z);
        
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.8, 3),
            new THREE.MeshStandardMaterial({ color: COLORS.TREE_TRUNK })
        );
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2.5, 5, 8),
            new THREE.MeshStandardMaterial({ color: COLORS.TREE_LEAVES })
        );
        leaves.position.y = 4;
        leaves.castShadow = true;
        
        this.mesh.add(trunk);
        this.mesh.add(leaves);
        
        // Static collision body
        this.physicsBody = null; // Static, handled by bounds checking or separate list if complex
        // For simplicity, we add a simple collider entity
        const collider = new Entity(x, 0, z);
        collider.radius = 1.0;
        // Don't add visual mesh for collider
        gameState.scene.remove(collider.mesh); 
        collider.mesh = this.mesh; // Link position
        gameState.entities.push(collider);
        
        gameState.scene.add(this.mesh);
    }
}

// --- Particles ---
export function createParticles(pos, color, count) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        
        // Random spread
        mesh.position.x += randomRange(-0.5, 0.5);
        mesh.position.y += randomRange(0, 1.0);
        mesh.position.z += randomRange(-0.5, 0.5);
        
        const vel = new THREE.Vector3(
            randomRange(-5, 5),
            randomRange(5, 10),
            randomRange(-5, 5)
        );
        
        const p = {
            mesh: mesh,
            velocity: vel,
            life: 1.0
        };
        
        gameState.scene.add(mesh);
        gameState.particles.push(p);
    }
}

export function updateParticles(dt) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.life -= dt;
        
        p.velocity.y -= 20 * dt; // Gravity
        p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
        p.mesh.rotation.x += 5 * dt;
        
        if (p.life <= 0) {
            gameState.scene.remove(p.mesh);
            gameState.particles.splice(i, 1);
        }
    }
}