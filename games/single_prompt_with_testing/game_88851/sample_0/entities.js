import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, TEAMS, COLORS, GRAVITY } from './globals.js';
import { WEAPON_TYPES, fireWeapon } from './weapons.js';
import { randomRange } from './utils.js';

export class Entity {
    constructor(x, y, z, width, height, depth, color) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshLambertMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.isStatic = false;
        this.toBeRemoved = false;
    }
    
    update(deltaTime) {} // Override
    
    destroy() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.toBeRemoved = true;
    }
}

export class Character extends Entity {
    constructor(x, y, z, team, classType) {
        // Dimensions based on class
        let w = 1, h = 2, d = 1;
        let color = team === TEAMS.RED ? COLORS.RED : COLORS.BLUE;
        
        super(x, y, z, w, h, d, color);
        
        this.team = team;
        this.classType = classType;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 0.5;
        this.cooldown = 0;
        this.weapon = WEAPON_TYPES.SCATTERGUN;
        
        this.applyClassStats();
        
        // Add "Hat" or head visual
        const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xffccaa }); // Skin tone
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.2;
        this.mesh.add(this.head); // Child of body
        
        // Add Hat geometry based on class
        if (classType === 'SOLDIER') {
            const hatGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 8);
            const hatMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const hat = new THREE.Mesh(hatGeo, hatMat);
            hat.position.y = 0.4;
            this.head.add(hat);
        } else if (classType === 'SCOUT') {
            const hatGeo = new THREE.BoxGeometry(0.4, 0.1, 0.5);
            const hatMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const hat = new THREE.Mesh(hatGeo, hatMat);
            hat.position.set(0, 0.35, 0.1);
            this.head.add(hat);
        }
        
        this.lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    }
    
    applyClassStats() {
        switch(this.classType) {
            case 'SCOUT':
                this.maxHealth = 125;
                this.speed = 0.4;
                this.weapon = WEAPON_TYPES.SCATTERGUN;
                break;
            case 'SOLDIER':
                this.maxHealth = 200;
                this.speed = 0.25;
                this.weapon = WEAPON_TYPES.ROCKET_LAUNCHER;
                break;
            case 'HEAVY':
                this.maxHealth = 300;
                this.speed = 0.15;
                this.weapon = WEAPON_TYPES.MINIGUN;
                this.width = 1.5;
                this.depth = 1.5;
                this.mesh.scale.set(1.5, 1, 1.5);
                break;
        }
        this.health = this.maxHealth;
    }
    
    update(deltaTime) {
        if (this.cooldown > 0) this.cooldown -= 1; // Cooldown in frames for simplicity
        
        // Rotation for mesh (visual)
        this.mesh.rotation.y = this.lookEuler.y;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.destroy();
        // Spawn particles
        for (let i = 0; i < 8; i++) {
            const p = new Particle(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, this.team === TEAMS.RED ? COLORS.RED : COLORS.BLUE, 0.5);
            gameState.particles.push(p);
        }
    }
    
    shoot() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.lookEuler);
        
        // Pitch correction
        direction.y = Math.sin(this.lookEuler.x);
        // Re-normalize projection on XZ for proper movement, but for shooting we want 3D vector
        // The applyEuler on (0,0,-1) handles yaw correctly. Pitch needs careful handling.
        // Actually, let's use a cleaner way:
        const aimDir = new THREE.Vector3();
        gameState.camera.getWorldDirection(aimDir);
        
        // For bots, we might not use camera, so use internal look vector
        if (this !== gameState.player) {
            aimDir.set(0, 0, -1).applyEuler(this.lookEuler);
            // Bots pitch is simplified usually 0
        }
        
        fireWeapon(this, this.weapon, aimDir);
    }
}

export class Bot extends Character {
    constructor(x, y, z, team, classType) {
        super(x, y, z, team, classType);
        this.state = 'MOVE'; // MOVE, ATTACK, IDLE
        this.target = null;
        this.reactionTimer = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Simple AI
        const targetPos = gameState.controlPoint.mesh.position;
        const distToPoint = this.mesh.position.distanceTo(targetPos);
        
        // Acquire Target (Player)
        if (gameState.player && !gameState.player.toBeRemoved) {
             const distToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
             if (distToPlayer < 20) {
                 this.target = gameState.player;
                 this.state = 'ATTACK';
             } else {
                 this.target = null;
                 this.state = 'MOVE';
             }
        }
        
        if (this.state === 'MOVE') {
            // Move towards control point
            const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
            this.velocity.x = dir.x * this.speed * 0.6; // Bots are a bit slower
            this.velocity.z = dir.z * this.speed * 0.6;
            
            // Look at point
            this.lookEuler.y = Math.atan2(dir.x, dir.z) + Math.PI; // Face opposite? No, LookAt standard
            this.lookEuler.y = Math.atan2(this.velocity.x, this.velocity.z);
            
            if (distToPoint < 3) {
                this.velocity.x = 0;
                this.velocity.z = 0;
            }
        } else if (this.state === 'ATTACK' && this.target) {
            // Face target
            const dir = new THREE.Vector3().subVectors(this.target.mesh.position, this.mesh.position).normalize();
            this.lookEuler.y = Math.atan2(dir.x, dir.z);
            
            // Stop to shoot
            this.velocity.x = 0;
            this.velocity.z = 0;
            
            // Shoot
            this.shoot();
        }
    }
}

export class Projectile extends Entity {
    constructor(pos, dir, speed, damage, team, radius) {
        super(pos.x, pos.y, pos.z, 0.4, 0.4, 0.4, 0xffff00);
        this.velocity.copy(dir.normalize().multiplyScalar(speed));
        this.damage = damage;
        this.team = team;
        this.radius = radius;
        this.life = 100; // Frames
        this.isRocket = true;
        
        // Make it look like a rocket
        this.mesh.geometry = new THREE.ConeGeometry(0.2, 0.6, 8);
        this.mesh.rotation.x = Math.PI / 2;
        // Align rotation to velocity
        this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    }
    
    update(deltaTime) {
        this.mesh.position.add(this.velocity); // No gravity for rockets in TF2 usually, or very little. We use linear for simplicity
        
        this.life--;
        if (this.life <= 0) {
            this.explode();
            return;
        }
        
        // Collision check
        // Check ground/walls
        if (this.mesh.position.y < 0) {
            this.explode();
            return;
        }
        
        // Simple radius check against entities
        for (const entity of gameState.entities) {
            if (entity.team !== this.team && !entity.toBeRemoved) {
                if (entity.mesh.position.distanceTo(this.mesh.position) < 2) {
                    this.explode();
                    return;
                }
            }
        }
        
        // Check walls
        for (const wall of gameState.walls) {
            const box = new THREE.Box3().setFromObject(wall.mesh);
            if (box.containsPoint(this.mesh.position)) {
                this.explode();
                return;
            }
        }
    }
    
    explode() {
        this.destroy();
        // Visuals
        for (let i=0; i<10; i++) {
            const p = new Particle(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0xffaa00, 0.6);
            gameState.particles.push(p);
        }
        
        // Area Damage
        for (const entity of gameState.entities) {
            if (entity.team !== this.team && !entity.toBeRemoved) {
                const dist = entity.mesh.position.distanceTo(this.mesh.position);
                if (dist < this.radius) {
                    // Linear falloff
                    const dmg = this.damage * (1 - dist / this.radius);
                    entity.takeDamage(dmg);
                    
                    // Knockback
                    const dir = new THREE.Vector3().subVectors(entity.mesh.position, this.mesh.position).normalize();
                    entity.velocity.add(dir.multiplyScalar(0.5));
                    entity.velocity.y += 0.2; // Pop up
                }
            }
        }
    }
}

export class Particle extends Entity {
    constructor(x, y, z, color, size) {
        super(x, y, z, size, size, size, color);
        this.velocity.set(
            randomRange(-0.2, 0.2),
            randomRange(0.1, 0.4),
            randomRange(-0.2, 0.2)
        );
        this.life = 60;
        this.mesh.material.transparent = true;
    }
    
    update(deltaTime) {
        this.velocity.y += GRAVITY;
        this.mesh.position.add(this.velocity);
        this.life--;
        this.mesh.scale.multiplyScalar(0.95);
        this.mesh.material.opacity = this.life / 60;
        
        if (this.life <= 0) {
            this.destroy();
        }
    }
}

export class Pickup extends Entity {
    constructor(x, y, z) {
        super(x, y, z, 1, 1, 1, COLORS.HEALTH);
        this.mesh.rotation.x = Math.PI / 4;
        this.mesh.rotation.z = Math.PI / 4;
        this.baseY = y;
    }
    
    update(deltaTime) {
        this.mesh.rotation.y += 0.05;
        this.mesh.position.y = this.baseY + Math.sin(gameState.frameCount * 0.05) * 0.2;
        
        // Check collision with player
        if (gameState.player && !gameState.player.toBeRemoved) {
            if (this.mesh.position.distanceTo(gameState.player.mesh.position) < 1.5) {
                if (gameState.player.health < gameState.player.maxHealth) {
                    gameState.player.health = Math.min(gameState.player.health + 50, gameState.player.maxHealth);
                    this.destroy();
                }
            }
        }
    }
}