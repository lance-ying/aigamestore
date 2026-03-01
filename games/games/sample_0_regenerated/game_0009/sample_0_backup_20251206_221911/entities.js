import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PHYSICS, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { PhysicsSystem } from './physics.js';
import { getBox, checkAABB, randomRange } from './utils.js';

class Entity {
    constructor(x, y, z) {
        this.mesh = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.size = new THREE.Vector3(1, 1, 1);
        this.markedForDeletion = false;
        this.position = new THREE.Vector3(x, y, z);
    }
    
    update(deltaTime) {
        // Basic physics
        this.velocity.add(this.acceleration);
        this.mesh.position.add(this.velocity);
        this.acceleration.set(0, 0, 0);
        
        // Update local pos reference
        this.position.copy(this.mesh.position);
    }
}

export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        
        // Visuals: White Cylinder (Body) + Red Feet (Gunboots)
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
        const material = new THREE.MeshStandardMaterial({ 
            color: COLORS.PLAYER, 
            roughness: 0.2,
            metalness: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Gunboots visual
        const bootGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
        const bootMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
        this.leftBoot = new THREE.Mesh(bootGeo, bootMat);
        this.rightBoot = new THREE.Mesh(bootGeo, bootMat);
        this.leftBoot.position.set(-0.2, -0.6, 0);
        this.rightBoot.position.set(0.2, -0.6, 0);
        this.mesh.add(this.leftBoot);
        this.mesh.add(this.rightBoot);
        
        this.size.set(0.8, 1.2, 0.8);
        
        // Stats
        this.health = 4; // Hearts
        this.maxHealth = 4;
        this.ammo = 8;
        this.maxAmmo = 8;
        this.invulnerableTime = 0;
        
        this.onGround = false;
        this.jumpTimer = 0;
        this.shootCooldown = 0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime, input) {
        // Movement Input
        const speed = PHYSICS.MOVE_SPEED;
        
        // X/Z Movement
        if (input.moveLeft) this.velocity.x -= speed * 0.2;
        if (input.moveRight) this.velocity.x += speed * 0.2;
        if (input.moveForward) this.velocity.z -= speed * 0.2; // Forward is -Z
        if (input.moveBackward) this.velocity.z += speed * 0.2;
        
        // Friction / Air Resistance
        const friction = this.onGround ? PHYSICS.FRICTION : PHYSICS.AIR_RESISTANCE;
        this.velocity.x *= friction;
        this.velocity.z *= friction;
        
        // Gravity
        if (!this.onGround) {
            this.velocity.y += PHYSICS.GRAVITY;
            this.velocity.y = Math.max(this.velocity.y, PHYSICS.TERMINAL_VELOCITY);
        }
        
        // Jump
        if (this.onGround && input.jump) {
            this.velocity.y = PHYSICS.JUMP_FORCE;
            this.onGround = false;
        }
        
        // Shoot (Gunboots)
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
        
        if (input.shoot && !this.onGround && this.ammo > 0 && this.shootCooldown <= 0) {
            this.shoot();
        }
        
        // Apply velocity
        this.mesh.position.add(this.velocity);
        
        // Bounds check (Keep inside the shaft)
        // Shaft is approx -10 to 10 in X and Z
        const limit = 8.5;
        if (this.mesh.position.x < -limit) { this.mesh.position.x = -limit; this.velocity.x = 0; }
        if (this.mesh.position.x > limit) { this.mesh.position.x = limit; this.velocity.x = 0; }
        if (this.mesh.position.z < -limit) { this.mesh.position.z = -limit; this.velocity.z = 0; }
        if (this.mesh.position.z > limit) { this.mesh.position.z = limit; this.velocity.z = 0; }
        
        // Platform Physics
        PhysicsSystem.resolvePlatformCollisions(this);
        
        // Recharge ammo on ground
        if (this.onGround && this.ammo < this.maxAmmo) {
            this.ammo = this.maxAmmo;
        }
        
        // Update invulnerability
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= deltaTime;
            this.mesh.visible = Math.floor(gameState.frameCount / 4) % 2 === 0;
        } else {
            this.mesh.visible = true;
        }
        
        // Check win condition (Bottom of level)
        if (this.mesh.position.y < -gameState.maxDepth) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
        
        // Log info
        if (window.logs && window.logs.player_info.length < 500) {
            // Project to screen for log
            const p = this.mesh.position.clone();
            p.project(gameState.camera);
            const sx = (p.x + 1) * CANVAS_WIDTH / 2;
            const sy = (-p.y + 1) * CANVAS_HEIGHT / 2;
            
            window.logs.player_info.push({
                screen_x: sx,
                screen_y: sy,
                game_x: this.mesh.position.x,
                game_y: this.mesh.position.y,
                game_z: this.mesh.position.z,
                health: this.health,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    shoot() {
        this.ammo--;
        this.shootCooldown = 8; // Frames approx
        
        // Upward recoil force
        this.velocity.y += PHYSICS.SHOOT_RECOIL;
        // Cap upward velocity so we don't fly up forever
        if (this.velocity.y > 0.2) this.velocity.y = 0.2; 
        
        // Spawn Bullet
        // Left boot
        const b1 = new Projectile(
            new THREE.Vector3(this.mesh.position.x - 0.2, this.mesh.position.y - 0.6, this.mesh.position.z),
            new THREE.Vector3(0, -1, 0)
        );
        // Right boot
        const b2 = new Projectile(
            new THREE.Vector3(this.mesh.position.x + 0.2, this.mesh.position.y - 0.6, this.mesh.position.z),
            new THREE.Vector3(0, -1, 0)
        );
        gameState.projectiles.push(b1, b2);
        
        // Visual kick
        this.leftBoot.position.y = -0.4;
        this.rightBoot.position.y = -0.4;
        setTimeout(() => {
            this.leftBoot.position.y = -0.6;
            this.rightBoot.position.y = -0.6;
        }, 50);
    }
    
    takeDamage(amount) {
        if (this.invulnerableTime > 0) return;
        
        this.health -= amount;
        this.invulnerableTime = 60; // 1 second invulnerability (at 60fps)
        
        // Knockback
        this.velocity.y = 0.3;
        
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    bounce() {
        // Bounce off enemy
        this.velocity.y = 0.3;
        this.ammo = this.maxAmmo; // Reload on stomp
    }
}

export class Enemy extends Entity {
    constructor(x, y, z, type = 'floater') {
        super(x, y, z);
        this.type = type;
        
        let geometry, material;
        
        if (type === 'crawler') {
            geometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
            material = new THREE.MeshStandardMaterial({ color: COLORS.ENEMY });
            this.health = 1;
        } else {
            // Floater
            geometry = new THREE.SphereGeometry(0.5, 8, 8);
            material = new THREE.MeshStandardMaterial({ color: COLORS.ENEMY, roughness: 0.1 });
            this.health = 2;
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.size = type === 'crawler' ? new THREE.Vector3(0.8, 0.4, 0.8) : new THREE.Vector3(1, 1, 1);
        
        // AI State
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.timer = 0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (this.markedForDeletion) return;
        
        const distToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
        
        // Only update if relatively close to save processing (activity culling)
        if (distToPlayer > 50) return;
        
        if (this.type === 'crawler') {
            // Move back and forth
            this.velocity.x = this.direction * 0.05;
            this.mesh.position.add(this.velocity);
            
            // Check boundaries/edges
            if (this.mesh.position.x > 8 || this.mesh.position.x < -8) {
                this.direction *= -1;
            }
            
            // Should stick to platforms really, but simple patrol for now
        } else {
            // Floater: slowly float towards player if close
            if (distToPlayer < 15) {
                const dir = new THREE.Vector3().subVectors(gameState.player.mesh.position, this.mesh.position).normalize();
                this.mesh.position.add(dir.multiplyScalar(0.03));
            }
        }
        
        // Collision with Player
        const player = gameState.player;
        if (player) {
            const enemyBox = getBox(this.mesh, this.size);
            const playerBox = getBox(player.mesh, player.size);
            
            if (checkAABB(playerBox, enemyBox)) {
                // Determine collision type
                const relativeY = player.mesh.position.y - this.mesh.position.y;
                
                // If player falling and above enemy -> Stomp
                if (relativeY > 0.5 && player.velocity.y < 0) {
                    this.takeDamage(10); // Instant kill usually
                    player.bounce();
                    // Spawn particles
                    spawnParticles(this.mesh.position, 10, COLORS.ENEMY);
                } else {
                    // Player hurt
                    player.takeDamage(1);
                }
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        } else {
            // Flash white
            this.mesh.material.emissive.setHex(0xFFFFFF);
            setTimeout(() => {
                if (this.mesh) this.mesh.material.emissive.setHex(0x000000);
            }, 100);
        }
    }
    
    die() {
        this.markedForDeletion = true;
        gameState.scene.remove(this.mesh);
        // Spawn particles
        spawnParticles(this.mesh.position, 15, COLORS.ENEMY);
        gameState.score += 50;
    }
}

export class Projectile extends Entity {
    constructor(position, direction) {
        super(position.x, position.y, position.z);
        
        const geometry = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
        const material = new THREE.MeshBasicMaterial({ color: COLORS.BULLET });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // Rotate to match direction (down)
        this.mesh.rotation.x = Math.PI; 
        
        this.velocity = direction.normalize().multiplyScalar(0.6); // Fast bullet
        this.lifeTime = 60; // frames
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.mesh.position.add(this.velocity);
        this.lifeTime--;
        
        if (this.lifeTime <= 0) {
            this.markedForDeletion = true;
            gameState.scene.remove(this.mesh);
            return;
        }
        
        // Check collisions with Enemies
        const bulletBox = getBox(this.mesh, new THREE.Vector3(0.2, 0.6, 0.2));
        
        for (const enemy of gameState.enemies) {
            if (enemy.markedForDeletion) continue;
            
            const enemyBox = getBox(enemy.mesh, enemy.size);
            if (checkAABB(bulletBox, enemyBox)) {
                enemy.takeDamage(1);
                this.markedForDeletion = true;
                gameState.scene.remove(this.mesh);
                spawnParticles(this.mesh.position, 5, COLORS.BULLET);
                return;
            }
        }
        
        // Check collisions with Platforms/Walls
        for (const platform of gameState.platforms) {
            const platformBox = getBox(platform.mesh, platform.size);
            if (checkAABB(bulletBox, platformBox)) {
                this.markedForDeletion = true;
                gameState.scene.remove(this.mesh);
                spawnParticles(this.mesh.position, 3, COLORS.PLATFORM);
                return;
            }
        }
    }
}

export class Collectible extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshPhongMaterial({ 
            color: COLORS.GEM,
            emissive: 0x440011,
            shininess: 100
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.size = new THREE.Vector3(0.6, 0.6, 0.6);
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.mesh.rotation.y += 0.05;
        this.mesh.position.y += Math.sin(gameState.frameCount * 0.1) * 0.005;
        
        // Check collision with player
        if (gameState.player) {
            const dist = this.mesh.position.distanceTo(gameState.player.mesh.position);
            if (dist < 1.0) {
                this.collect();
            }
        }
    }
    
    collect() {
        this.markedForDeletion = true;
        gameState.scene.remove(this.mesh);
        gameState.score += 100;
        // Particle effect
        spawnParticles(this.mesh.position, 8, COLORS.GEM);
    }
}

export class Platform {
    constructor(x, y, z, w, h, d, color = COLORS.PLATFORM) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        
        this.size = new THREE.Vector3(w, h, d);
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this);
    }
}

// Particle System
class Particle {
    constructor(pos, color) {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(pos);
        
        this.velocity = new THREE.Vector3(
            randomRange(-0.1, 0.1),
            randomRange(-0.1, 0.2),
            randomRange(-0.1, 0.1)
        );
        this.life = 1.0;
        gameState.scene.add(this.mesh);
    }
    
    update() {
        this.velocity.y -= 0.01; // Gravity
        this.mesh.position.add(this.velocity);
        this.life -= 0.05;
        
        if (this.life <= 0) {
            gameState.scene.remove(this.mesh);
            return false;
        }
        
        this.mesh.scale.setScalar(this.life);
        return true;
    }
}

export function spawnParticles(pos, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(pos, color));
    }
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const alive = gameState.particles[i].update();
        if (!alive) {
            gameState.particles.splice(i, 1);
        }
    }
}