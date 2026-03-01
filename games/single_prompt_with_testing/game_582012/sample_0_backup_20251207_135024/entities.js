import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { createColorMaterial } from './utils.js';

// --- Base Entity ---
class Entity {
    constructor() {
        this.mesh = new THREE.Group();
        this.position = this.mesh.position;
        this.velocity = new THREE.Vector3();
        this.toRemove = false;
    }

    update(deltaTime) {}
}

// --- Player Class ---
export class Player extends Entity {
    constructor(x, y, z) {
        super();
        this.mesh.position.set(x, y, z);
        this.radius = 1.0;
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxStamina = 100;
        this.stamina = 100;
        this.damage = 15;
        this.potions = 3;
        
        // Movement
        this.speed = 8.0;
        this.rotationSpeed = 10.0;
        this.forward = new THREE.Vector3(0, 0, 1);
        
        // State Machine
        this.state = 'IDLE'; // IDLE, MOVE, ATTACK, DODGE, HURT, DEAD
        this.stateTimer = 0;
        this.invulnerable = false;
        
        // Combat flags
        this.isHitboxActive = false;
        this.hasHitThisFrame = false;

        // Visuals construction
        this.createVisuals();
        
        gameState.scene.add(this.mesh);
    }

    createVisuals() {
        // Materials
        const armorMat = createColorMaterial(0x4682B4); // Steel Blue
        const skinMat = createColorMaterial(0xFFDAB9); // Peach Puff
        const swordMat = createColorMaterial(0xC0C0C0); // Silver
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
        this.body = new THREE.Mesh(bodyGeo, armorMat);
        this.body.position.y = 1.0;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = 1.75;
        this.mesh.add(this.head);
        
        // Great Sword (Attached to back or hand)
        const swordBladeGeo = new THREE.BoxGeometry(0.3, 2.5, 0.1);
        const swordHandleGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        this.sword = new THREE.Group();
        
        const blade = new THREE.Mesh(swordBladeGeo, swordMat);
        blade.position.y = 1.25;
        const handle = new THREE.Mesh(swordHandleGeo, createColorMaterial(0x8B4513));
        handle.position.y = -0.4;
        
        this.sword.add(blade);
        this.sword.add(handle);
        
        // Initial sword pos (on back)
        this.sword.position.set(0, 1.5, -0.4);
        this.sword.rotation.z = 0.5;
        this.mesh.add(this.sword);
    }

    update(deltaTime) {
        if (this.state === 'DEAD') return;

        // Always update forward vector based on current rotation
        this.forward.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));

        // Stamina regen
        if (this.state !== 'DODGE' && this.stamina < this.maxStamina) {
            this.stamina += 10 * deltaTime;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }

        // Apply Gravity
        if (this.mesh.position.y > 0) {
            this.velocity.add(gameState.gravity.clone().multiplyScalar(deltaTime * 60)); // Scale for dt
        }

        // Update Position based on velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground Collision
        if (this.mesh.position.y < 0) {
            this.mesh.position.y = 0;
            this.velocity.y = 0;
            this.velocity.x *= 0.8; // Friction
            this.velocity.z *= 0.8;
        } else {
            // Air drag
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
        }

        // State Logic
        switch(this.state) {
            case 'IDLE':
            case 'MOVE':
                this.handleMovement(deltaTime);
                this.handleActionInput();
                break;
            case 'ATTACK':
                this.updateAttack(deltaTime);
                break;
            case 'DODGE':
                this.updateDodge(deltaTime);
                break;
            case 'HURT':
                this.updateHurt(deltaTime);
                break;
        }
        
        // Reset sword position if not attacking
        if (this.state !== 'ATTACK') {
             this.sword.position.lerp(new THREE.Vector3(0, 1.5, -0.4), 0.1);
             this.sword.rotation.set(0, 0, 0.5);
             // Make sword bob while running
             if (this.state === 'MOVE') {
                 this.sword.position.y += Math.sin(gameState.frameCount * 0.2) * 0.05;
             }
        }
    }

    handleMovement(deltaTime) {
        const keys = gameState.keys;
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (keys[87] || keys[38]) moveDir.z -= 1; // W / Up
        if (keys[83] || keys[40]) moveDir.z += 1; // S / Down
        if (keys[65] || keys[37]) moveDir.x -= 1; // A / Left
        if (keys[68] || keys[39]) moveDir.x += 1; // D / Right

        if (moveDir.lengthSq() > 0) {
            this.state = 'MOVE';
            moveDir.normalize();
            
            // Rotate towards movement
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            // Smooth rotation
            let rotDiff = targetRotation - this.mesh.rotation.y;
            // Normalize angle to -PI to PI
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            
            this.mesh.rotation.y += rotDiff * this.rotationSpeed * deltaTime;
            
            // Move
            const moveVec = this.forward.clone().multiplyScalar(this.speed * deltaTime);
            this.mesh.position.add(moveVec);
        } else {
            this.state = 'IDLE';
        }
    }

    handleActionInput() {
        const keys = gameState.keys;
        
        // Attack (Space)
        if (keys[32]) {
            this.startAttack();
        }
        // Dodge (Shift)
        else if (keys[16] && this.stamina >= 20) {
            this.startDodge();
        }
        // Potion (Z)
        else if (keys[90] && this.potions > 0 && this.health < this.maxHealth) {
            this.usePotion();
        }
    }

    startAttack() {
        this.state = 'ATTACK';
        this.stateTimer = 0;
        this.isHitboxActive = false;
        this.hasHitThisFrame = false;
    }

    updateAttack(deltaTime) {
        this.stateTimer += deltaTime;
        
        // Simple Attack Animation: Swing sword down
        // 0.0 - 0.2: Windup
        // 0.2 - 0.4: Active Swing (Hitbox active)
        // 0.4 - 0.8: Recovery
        
        if (this.stateTimer < 0.2) {
            // Windup: Raise sword
            this.sword.position.set(0.5, 2.5, 0.5);
            this.sword.rotation.set(-0.5, 0, 0);
        } else if (this.stateTimer < 0.4) {
            // Swing
            this.isHitboxActive = true;
            const progress = (this.stateTimer - 0.2) / 0.2; // 0 to 1
            const angle = lerp(-0.5, 2.5, progress);
            this.sword.rotation.set(angle, 0, 0);
            this.sword.position.set(0, 1.5, 1.5);
        } else if (this.stateTimer < 0.8) {
            // Recovery
            this.isHitboxActive = false;
            // Slowly return
        } else {
            // End attack
            this.state = 'IDLE';
            this.isHitboxActive = false;
            this.hasHitThisFrame = false;
        }
    }

    startDodge() {
        this.state = 'DODGE';
        this.stateTimer = 0;
        this.stamina -= 20;
        
        // Dash impulse
        const dashSpeed = 15.0;
        this.velocity.add(this.forward.clone().multiplyScalar(dashSpeed));
    }

    updateDodge(deltaTime) {
        this.stateTimer += deltaTime;
        
        // Roll animation logic (rotation mesh)
        this.body.rotation.x += 15 * deltaTime;
        
        if (this.stateTimer > 0.5) {
            this.state = 'IDLE';
            this.body.rotation.x = 0;
            this.velocity.set(0,0,0);
        }
    }
    
    usePotion() {
        this.potions--;
        this.health = Math.min(this.health + 50, this.maxHealth);
        // Maybe add a drinking pause/animation?
        // For responsiveness, instant heal but slow movement could be added.
    }

    updateHurt(deltaTime) {
        this.stateTimer += deltaTime;
        if (this.stateTimer > 0.4) {
            this.state = 'IDLE';
        }
    }

    takeDamage(amount) {
        if (this.state === 'DODGE' || this.state === 'DEAD') return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        } else {
            this.state = 'HURT';
            this.stateTimer = 0;
        }
    }
    
    die() {
        this.state = 'DEAD';
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.5;
        gameState.gamePhase = 'GAME_OVER_LOSE';
    }
}

// --- Monster Class ---
export class Monster extends Entity {
    constructor(x, y, z) {
        super();
        this.mesh.position.set(x, y, z);
        this.radius = 3.0; // Hitbox size
        
        // Stats
        this.maxHealth = 500;
        this.health = 500;
        this.damage = 25;
        
        // State
        this.state = 'IDLE'; // IDLE, CHASE, CHARGE, ATTACK, STUNNED
        this.stateTimer = 0;
        this.hasHitPlayer = false;
        
        this.createVisuals();
        gameState.scene.add(this.mesh);
    }

    createVisuals() {
        const skinMat = createColorMaterial(0x8B0000); // Dark Red
        const wingMat = createColorMaterial(0x330000); // Very Dark Red
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(2.5, 2.5, 4.0);
        this.body = new THREE.Mesh(bodyGeo, skinMat);
        this.body.position.y = 2.5;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Head
        const headGeo = new THREE.BoxGeometry(1.5, 1.5, 2.5);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.set(0, 3.5, 3.5);
        this.mesh.add(this.head);
        
        // Tail
        const tailGeo = new THREE.BoxGeometry(1.0, 1.0, 4.0);
        this.tail = new THREE.Mesh(tailGeo, skinMat);
        this.tail.position.set(0, 2.0, -4.0);
        this.mesh.add(this.tail);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(5.0, 0.2, 3.0);
        this.wings = new THREE.Mesh(wingGeo, wingMat);
        this.wings.position.set(0, 4.0, 0);
        this.mesh.add(this.wings);
    }

    update(deltaTime) {
        if (!gameState.player || gameState.player.state === 'DEAD') return;
        if (this.health <= 0) return;

        const distToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
        
        // Look at player (only rotate Y)
        if (this.state !== 'CHARGE') { // Don't turn while charging
            const targetPos = gameState.player.mesh.position.clone();
            const lookPos = new THREE.Vector3(targetPos.x, this.mesh.position.y, targetPos.z);
            this.mesh.lookAt(lookPos);
        }

        // State Machine
        switch(this.state) {
            case 'IDLE':
                this.stateTimer += deltaTime;
                if (this.stateTimer > 2.0) {
                    this.decideNextMove(distToPlayer);
                }
                break;
            case 'CHASE':
                this.updateChase(deltaTime, distToPlayer);
                break;
            case 'CHARGE':
                this.updateCharge(deltaTime);
                break;
            case 'ATTACK':
                this.updateAttack(deltaTime);
                break;
            case 'STUNNED':
                this.stateTimer += deltaTime;
                if (this.stateTimer > 2.0) this.state = 'IDLE';
                break;
        }

        // Animations (breathing/flap)
        this.wings.rotation.z = Math.sin(gameState.frameCount * 0.1) * 0.2;
        this.tail.rotation.y = Math.sin(gameState.frameCount * 0.1) * 0.3;
    }

    decideNextMove(dist) {
        this.stateTimer = 0;
        const roll = Math.random();
        
        if (dist > 25) {
            this.state = 'CHASE';
        } else if (dist > 8) {
            if (roll < 0.6) this.state = 'CHARGE';
            else this.state = 'CHASE';
        } else {
            if (roll < 0.7) this.state = 'ATTACK'; // Bite
            else this.state = 'IDLE'; // Pause
        }
    }

    updateChase(deltaTime, dist) {
        if (dist < 6) {
            this.state = 'ATTACK';
            this.stateTimer = 0;
            return;
        }
        // Move forward
        const moveSpeed = 6.0;
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        this.mesh.position.add(forward.multiplyScalar(moveSpeed * deltaTime));
        
        // Walking animation
        this.body.position.y = 2.5 + Math.sin(gameState.frameCount * 0.3) * 0.2;
    }

    updateCharge(deltaTime) {
        this.stateTimer += deltaTime;
        const chargeSpeed = 18.0;
        
        // Windup
        if (this.stateTimer < 1.0) {
            // Roar/Stomp animation
            this.head.position.y = 3.5 + Math.sin(this.stateTimer * 20) * 0.2;
        } 
        // Charge
        else if (this.stateTimer < 2.5) {
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
            this.mesh.position.add(forward.multiplyScalar(chargeSpeed * deltaTime));
            this.hasHitPlayer = false; // logic handled in physics.js
        }
        // Recover
        else if (this.stateTimer < 3.5) {
            // Slide to stop
        } else {
            this.state = 'IDLE';
            this.stateTimer = 0;
        }
    }

    updateAttack(deltaTime) {
        this.stateTimer += deltaTime;
        
        // Bite Animation
        if (this.stateTimer < 0.5) {
            // Windup head back
            this.head.position.z = 2.5;
        } else if (this.stateTimer < 0.8) {
            // Snap forward
            this.head.position.z = 5.0;
            this.hasHitPlayer = false; // Logic in physics.js
        } else if (this.stateTimer < 1.5) {
            // Return
            this.head.position.z = 3.5;
        } else {
            this.state = 'IDLE';
            this.stateTimer = 0;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Visual flash
        this.body.material.emissive.setHex(0xff0000);
        setTimeout(() => { 
            if(this.body) this.body.material.emissive.setHex(0x000000); 
        }, 100);

        if (this.health <= 0) {
            this.die();
        } else {
            // Small chance to flinch/stun
            if (Math.random() < 0.2 && this.state !== 'STUNNED') {
                this.state = 'STUNNED';
                this.stateTimer = 0;
            }
        }
    }

    die() {
        this.toRemove = true;
        gameState.scene.remove(this.mesh);
        gameState.gamePhase = 'GAME_OVER_WIN';
    }
}

export class Environment {
    constructor() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest Green
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        gameState.scene.add(this.ground);
        
        // Trees (Simple Cylinders/Cones)
        this.trees = [];
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            
            // Don't place near center
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.8, 3, 8),
                createColorMaterial(0x8B4513)
            );
            trunk.position.y = 1.5;
            
            const leaves = new THREE.Mesh(
                new THREE.ConeGeometry(3, 6, 8),
                createColorMaterial(0x006400)
            );
            leaves.position.y = 4.5;
            
            tree.add(trunk);
            tree.add(leaves);
            tree.position.set(x, 0, z);
            gameState.scene.add(tree);
        }
        
        // Boundary Stones
        // (Visual only for now, player stays in arena mostly by gameplay flow)
    }
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}