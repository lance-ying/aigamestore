import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, CONSTANTS } from './globals.js';
import { raycastEnemies, handleWorldCollision } from './physics.js';

// ==========================================
// Base Entity Class
// ==========================================
class Entity {
    constructor(x, y, z) {
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.isDead = false;
        this.height = 1;
        this.radius = 0.5;
        gameState.scene.add(this.mesh);
    }

    update(dt) {
        // Base physics
        this.velocity.add(this.acceleration.clone().multiplyScalar(dt));
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        this.acceleration.set(0, 0, 0); // Reset forces
    }

    destroy() {
        this.isDead = true;
        gameState.scene.remove(this.mesh);
        // Remove materials/geometry to free memory in a real app
    }
}

// ==========================================
// Player Class
// ==========================================
export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.height = 2.0; // Camera height roughly
        
        // Physics
        this.friction = 10.0;
        this.airControl = 0.5;
        this.onGround = false;
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.hardDamage = 0; // Reduces max health temporarily
        
        // Weapon
        this.weaponCooldown = 0;
        this.weaponMaxCooldown = 0.4; // Seconds
        this.recoil = 0;
        
        // Dash
        this.dashCooldown = 0;
        this.dashTime = 0;
        this.dashVector = new THREE.Vector3();
        this.stamina = 3; // 3 dash charges
        
        // Camera setup - attached to player mesh logic conceptually
        // In this implementation, we move the camera directly in update()
        // but we treat 'this.mesh' as the physics body anchor.
        
        // Visuals (Debug body, invisible in FPV usually)
        const geo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false });
        this.bodyMesh = new THREE.Mesh(geo, mat);
        this.mesh.add(this.bodyMesh);
        
        // Camera references
        this.pitch = 0;
        this.yaw = 0;
    }

    update(dt) {
        // 1. Gravity
        this.velocity.y += gameState.gravity.y * dt;

        // 2. Input Handling
        this.handleInput(dt);

        // 3. Physics Application
        // Apply damping/friction
        const damping = this.onGround ? 10.0 : 1.0;
        this.velocity.x -= this.velocity.x * damping * dt;
        this.velocity.z -= this.velocity.z * damping * dt;

        // Apply velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // 4. Collision
        handleWorldCollision(this);

        // 5. Camera Sync
        gameState.camera.position.copy(this.mesh.position);
        gameState.camera.position.y += 0.8; // Eye level
        
        // Apply look rotation
        const lookQ = new THREE.Quaternion();
        lookQ.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        gameState.camera.quaternion.copy(lookQ);

        // Weapon Cooldowns
        if (this.weaponCooldown > 0) this.weaponCooldown -= dt;
        
        // Dash Regen
        if (this.stamina < 3) this.stamina += dt * 0.5;
    }

    handleInput(dt) {
        if (gameState.gamePhase !== 'PLAYING') return;

        // Look (Arrow Keys)
        const lookSpeed = CONSTANTS.SENSITIVITY * dt;
        if (gameState.keys[37]) this.yaw += lookSpeed; // Left
        if (gameState.keys[39]) this.yaw -= lookSpeed; // Right
        if (gameState.keys[38]) this.pitch += lookSpeed; // Up
        if (gameState.keys[40]) this.pitch -= lookSpeed; // Down
        
        // Clamp pitch
        this.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.pitch));

        // Move Direction (WASD) relative to look direction
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        const moveDir = new THREE.Vector3();
        if (gameState.keys[87]) moveDir.add(forward); // W
        if (gameState.keys[83]) moveDir.sub(forward); // S
        if (gameState.keys[65]) moveDir.sub(right);   // A
        if (gameState.keys[68]) moveDir.add(right);   // D
        
        if (moveDir.lengthSq() > 0) moveDir.normalize();

        // Acceleration
        const speed = CONSTANTS.PLAYER_SPEED;
        const accel = this.onGround ? 80.0 : 10.0; // Less control in air
        
        this.velocity.add(moveDir.multiplyScalar(accel * dt));

        // Jump
        if (gameState.keys[32] && this.onGround) { // Space
            this.velocity.y = CONSTANTS.PLAYER_JUMP_FORCE;
            this.onGround = false;
        }

        // Dash (Shift)
        if (gameState.keys[16] && this.stamina >= 1 && this.dashCooldown <= 0) {
            this.dash(moveDir);
        }
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        // Shoot (Z)
        if (gameState.keys[90]) {
            this.shoot();
        }
    }

    dash(dir) {
        if (dir.lengthSq() === 0) {
            // Dash forward if no input
            dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        }
        
        // Instant velocity burst
        this.velocity.add(dir.multiplyScalar(CONSTANTS.PLAYER_DASH_SPEED));
        this.stamina -= 1;
        this.dashCooldown = 0.5;
        
        // Visual effect (FOV change or screen flash logic handled in UI/Camera)
    }

    shoot() {
        if (this.weaponCooldown > 0) return;

        this.weaponCooldown = this.weaponMaxCooldown;

        // Raycast logic
        const camDir = new THREE.Vector3();
        gameState.camera.getWorldDirection(camDir);
        
        const hit = raycastEnemies(gameState.camera.position, camDir, 100);
        
        // Create Beam Visual
        const endPos = hit ? hit.enemy.mesh.position.clone() : gameState.camera.position.clone().add(camDir.multiplyScalar(50));
        
        // Visual Recoil
        this.pitch += 0.05;

        // Spawn Beam
        const beam = new Beam(gameState.camera.position.clone().add(new THREE.Vector3(0, -0.2, 0)), endPos); // Offset origin slightly
        gameState.projectiles.push(beam);

        if (hit) {
            hit.enemy.takeDamage(35);
            // Spawn Blood
            spawnBloodExplosion(hit.enemy.mesh.position, 8);
            
            // Add Style
            addStyle(15, "FRESH");
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
}

// ==========================================
// Enemy Classes
// ==========================================
export class Enemy extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.health = 100;
        this.speed = 4.0;
        this.hitboxRadius = 1.0;
        this.color = 0xffffff;
        
        // AI State
        this.state = 'IDLE'; // IDLE, CHASE, ATTACK
        this.attackTimer = 0;
        this.detectionRange = 40;
        this.attackRange = 2;
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Flash white
        this.mesh.children[0].material.emissive.setHex(0xffffff);
        setTimeout(() => {
            if(!this.isDead) this.mesh.children[0].material.emissive.setHex(0x000000);
        }, 100);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.destroy();
        // Remove from enemy list
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
        
        // Spawn Gibs/Blood
        spawnBloodExplosion(this.mesh.position, 20);
        
        gameState.score += 100;
        addStyle(50, "KILL");
        
        // Check win condition (clear wave)
        if (gameState.enemies.length === 0) {
            // Next wave logic could go here
        }
    }
}

export class Filth extends Enemy {
    constructor(x, y, z) {
        super(x, y, z);
        this.health = 40; // Weak
        this.speed = 6.0; // Fast
        
        // Visuals: Green basic geometry
        const geo = new THREE.DodecahedronGeometry(0.8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: COLORS.enemy_filth, 
            roughness: 0.8,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        this.mesh.add(mesh);
        
        // Arms
        const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const leftArm = new THREE.Mesh(armGeo, mat);
        leftArm.position.set(-0.6, 0, 0.4);
        leftArm.rotation.x = Math.PI / 4;
        this.mesh.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, mat);
        rightArm.position.set(0.6, 0, 0.4);
        rightArm.rotation.x = Math.PI / 4;
        this.mesh.add(rightArm);
    }

    update(dt) {
        if (!gameState.player || this.isDead) return;
        
        // Gravity
        this.velocity.y += gameState.gravity.y * dt;
        
        const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
        
        // Simple AI
        if (dist < this.detectionRange) {
            const dir = new THREE.Vector3().subVectors(gameState.player.mesh.position, this.mesh.position).normalize();
            
            // Move on XZ plane
            this.velocity.x = dir.x * this.speed;
            this.velocity.z = dir.z * this.speed;
            
            // Face player
            this.mesh.lookAt(gameState.player.mesh.position.x, this.mesh.position.y, gameState.player.mesh.position.z);
            
            // Attack
            if (dist < 2.5 && this.attackTimer <= 0) {
                this.attack();
            }
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        if (this.attackTimer > 0) this.attackTimer -= dt;
        
        // Apply movement
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        handleWorldCollision(this);
    }

    attack() {
        this.attackTimer = 1.0;
        // Lunge visual or logic
        if (gameState.player) {
            gameState.player.takeDamage(15);
        }
    }
}

export class Stray extends Enemy {
    constructor(x, y, z) {
        super(x, y, z);
        this.health = 80;
        this.speed = 2.0;
        
        // Visuals: Tall Red
        const geo = new THREE.CapsuleGeometry(0.6, 1.5, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: COLORS.enemy_stray });
        const mesh = new THREE.Mesh(geo, mat);
        this.mesh.add(mesh);
    }

    update(dt) {
        if (!gameState.player || this.isDead) return;
        
        this.velocity.y += gameState.gravity.y * dt;
        
        const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
        
        if (dist < this.detectionRange) {
            // Keep distance
            const dir = new THREE.Vector3().subVectors(gameState.player.mesh.position, this.mesh.position).normalize();
            
            this.mesh.lookAt(gameState.player.mesh.position.x, this.mesh.position.y, gameState.player.mesh.position.z);

            if (dist > 15) {
                this.velocity.x = dir.x * this.speed;
                this.velocity.z = dir.z * this.speed;
            } else if (dist < 8) {
                // Back up
                this.velocity.x = -dir.x * this.speed;
                this.velocity.z = -dir.z * this.speed;
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
            }

            if (this.attackTimer <= 0) {
                this.shoot();
            }
        }
        
        if (this.attackTimer > 0) this.attackTimer -= dt;
        
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        handleWorldCollision(this);
    }

    shoot() {
        this.attackTimer = 2.0;
        // Spawn orb projectile
        const dir = new THREE.Vector3().subVectors(gameState.player.mesh.position, this.mesh.position).normalize();
        const proj = new ProjectileOrb(this.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0)), dir);
        gameState.projectiles.push(proj);
    }
}

// ==========================================
// Projectiles & Particles
// ==========================================
export class Beam {
    constructor(start, end) {
        const points = [start, end];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: COLORS.beam, linewidth: 2 });
        this.mesh = new THREE.Line(geo, mat);
        
        this.life = 0.1; // Short lived
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            gameState.scene.remove(this.mesh);
            const idx = gameState.projectiles.indexOf(this);
            if (idx > -1) gameState.projectiles.splice(idx, 1);
        }
    }
}

export class ProjectileOrb {
    constructor(pos, dir) {
        const geo = new THREE.SphereGeometry(0.3, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: COLORS.enemy_stray });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(pos);
        
        this.velocity = dir.multiplyScalar(15.0); // Fast orb
        this.life = 5.0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        this.life -= dt;
        
        // Check collision with player
        if (gameState.player) {
            if (checkSphereCollision(this.mesh.position, 0.3, gameState.player.mesh.position, 1.0)) {
                gameState.player.takeDamage(20);
                this.destroy();
                return;
            }
        }

        // World collision (simple floor check)
        if (this.mesh.position.y < 0) this.destroy();

        if (this.life <= 0) this.destroy();
    }
    
    destroy() {
        gameState.scene.remove(this.mesh);
        const idx = gameState.projectiles.indexOf(this);
        if (idx > -1) gameState.projectiles.splice(idx, 1);
    }
}

export class BloodParticle {
    constructor(pos) {
        const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const mat = new THREE.MeshBasicMaterial({ color: COLORS.blood });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(pos);
        
        // Random velocity spread
        const vx = (Math.random() - 0.5) * 10;
        const vy = (Math.random() * 5) + 5;
        const vz = (Math.random() - 0.5) * 10;
        
        this.velocity = new THREE.Vector3(vx, vy, vz);
        this.life = 2.0;
        this.collected = false;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.velocity.y += gameState.gravity.y * dt;
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // Floor collision
        if (this.mesh.position.y <= 0) {
            this.mesh.position.y = 0;
            this.velocity.y = 0;
            this.velocity.x *= 0.5; // Friction
            this.velocity.z *= 0.5;
        }
        
        // Healing Logic
        if (!this.collected && gameState.player) {
            const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
            // Magnetize slightly
            if (dist < CONSTANTS.BLOOD_HEAL_RADIUS) {
                const dir = new THREE.Vector3().subVectors(gameState.player.mesh.position, this.mesh.position).normalize();
                this.velocity.add(dir.multiplyScalar(50 * dt)); // Suck towards player
                
                if (dist < 1.0) {
                    gameState.player.heal(CONSTANTS.BLOOD_HEAL_AMOUNT);
                    this.collected = true;
                    this.life = 0; // Destroy
                    // Add style for collecting blood
                    addStyle(1, "ABSORB");
                }
            }
        }
        
        this.life -= dt;
        if (this.life <= 0) {
            gameState.scene.remove(this.mesh);
            const idx = gameState.particles.indexOf(this);
            if (idx > -1) gameState.particles.splice(idx, 1);
        }
    }
}

// Helper to spawn blood
function spawnBloodExplosion(pos, count) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new BloodParticle(pos));
    }
}

// Helper to add style
function addStyle(amount, label) {
    gameState.styleRank = Math.min(100, gameState.styleRank + amount);
    // Logic to calculate grade S/A/B/C/D based on rank value
    updateStyleGrade();
    // Maybe show label in UI
    if (window.showStyleLabel) window.showStyleLabel(label);
}

function updateStyleGrade() {
    const s = gameState.styleRank;
    if (s > 90) gameState.styleGrade = "ULTRAKILL";
    else if (s > 75) gameState.styleGrade = "SS";
    else if (s > 60) gameState.styleGrade = "S";
    else if (s > 45) gameState.styleGrade = "A";
    else if (s > 30) gameState.styleGrade = "B";
    else if (s > 15) gameState.styleGrade = "C";
    else gameState.styleGrade = "D";
}