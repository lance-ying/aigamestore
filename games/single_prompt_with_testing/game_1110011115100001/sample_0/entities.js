import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Base Entity Class
class Entity {
    constructor(x, y, z) {
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.active = true;
        this.size = new THREE.Vector3(1, 1, 1);
    }
}

export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 0.15;
        this.jumpForce = 0.8;
        this.weapon = 'sword'; // sword, hammer
        this.attackCooldown = 0;
        this.attackTimer = 0;
        
        // Character Mesh Group
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        
        // Body (Blocky char)
        const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc, 
            roughness: 0.9,
            wireframe: false 
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.castShadow = true;
        this.body.position.y = 0.6; // Pivot at feet
        this.mesh.add(this.body);

        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.45;
        this.mesh.add(this.head);
        
        // Weapon pivot
        this.weaponPivot = new THREE.Group();
        this.weaponPivot.position.set(0.4, 0.8, 0);
        this.mesh.add(this.weaponPivot);
        
        this.createWeaponMesh();
        
        gameState.scene.add(this.mesh);
    }
    
    createWeaponMesh() {
        // Clear previous
        while(this.weaponPivot.children.length > 0){ 
            this.weaponPivot.remove(this.weaponPivot.children[0]); 
        }

        if (this.weapon === 'sword') {
            // Sword: Long thin box
            const geo = new THREE.BoxGeometry(0.1, 1.5, 0.1);
            const mat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0044aa, emissiveIntensity: 0.5 });
            const sword = new THREE.Mesh(geo, mat);
            sword.position.y = 0.5;
            this.weaponPivot.add(sword);
            this.attackRange = 2.5;
            this.attackRate = 30; // Frames
            this.damage = 25;
        } else {
            // Hammer: Heavy head
            const handleGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
            const handleMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const handle = new THREE.Mesh(handleGeo, handleMat);
            handle.position.y = 0.6;
            
            const headGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
            const headMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 1.2;
            
            this.weaponPivot.add(handle);
            this.weaponPivot.add(head);
            this.attackRange = 2.0;
            this.attackRate = 60; // Frames
            this.damage = 60;
        }
    }
    
    swapWeapon() {
        this.weapon = this.weapon === 'sword' ? 'hammer' : 'sword';
        this.createWeaponMesh();
    }
    
    update(deltaTime) {
        // Attack Cooldown
        if (this.attackTimer > 0) this.attackTimer--;
        
        // Auto-Attack Logic
        if (this.attackTimer <= 0) {
            // Find closest enemy
            let closestDist = Infinity;
            let target = null;
            
            gameState.enemies.forEach(enemy => {
                const dist = this.mesh.position.distanceTo(enemy.mesh.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    target = enemy;
                }
            });
            
            if (target && closestDist <= this.attackRange) {
                this.attack(target);
            }
        }
        
        // Animation reset
        if (this.attackTimer < this.attackRate - 10) {
             this.weaponPivot.rotation.z = THREE.MathUtils.lerp(this.weaponPivot.rotation.z, 0, 0.1);
        }
        
        // Check falling out of world
        if (this.mesh.position.y < -20) {
            this.health = 0;
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    attack(target) {
        this.attackTimer = this.attackRate;
        // Visual Swing
        this.weaponPivot.rotation.z = -Math.PI / 2;
        
        // Apply Damage
        target.takeDamage(this.damage);
        
        // Particle effect
        createParticles(target.mesh.position, 5, 0xff0000);
    }
    
    move(x, z) {
        this.velocity.x = x * this.speed;
        this.velocity.z = z * this.speed;
        
        // Face direction
        if (x !== 0) {
            this.mesh.rotation.y = x > 0 ? 0 : Math.PI;
        }
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createParticles(this.mesh.position, 3, 0xffffff);
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
}

export class Enemy extends Entity {
    constructor(x, y, z, type = 'crawler') {
        super(x, y, z);
        this.type = type;
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);
        
        if (type === 'crawler') {
            // Small fast enemy
            const geo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
            const mat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
            const body = new THREE.Mesh(geo, mat);
            body.position.y = 0.2;
            this.mesh.add(body);
            this.speed = 0.08;
            this.health = 40;
            this.damage = 10;
            this.size = new THREE.Vector3(0.6, 0.4, 0.6);
        } else if (type === 'golem') {
            // Big slow enemy
            const geo = new THREE.BoxGeometry(1.2, 1.8, 1.0);
            const mat = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const body = new THREE.Mesh(geo, mat);
            body.position.y = 0.9;
            this.mesh.add(body);
            this.speed = 0.03;
            this.health = 120;
            this.damage = 25;
            this.size = new THREE.Vector3(1.2, 1.8, 1);
        }
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (!gameState.player) return;
        
        const distToPlayer = this.mesh.position.distanceTo(gameState.player.mesh.position);
        
        // Simple AI: Move towards player if active
        if (distToPlayer < 20) {
            const dir = Math.sign(gameState.player.mesh.position.x - this.mesh.position.x);
            // Don't overlap completely
            if (distToPlayer > 0.8) {
                this.velocity.x = dir * this.speed;
            } else {
                this.velocity.x = 0;
            }
        }
        
        // Face player
        const lookDir = Math.sign(gameState.player.mesh.position.x - this.mesh.position.x);
        if (lookDir !== 0) {
             // Only rotate visual
             // this.mesh.rotation.y = lookDir > 0 ? 0 : Math.PI; 
             // Logic assumes simple movement
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        // Flash red
        this.mesh.children[0].material.emissive = new THREE.Color(0xff0000);
        setTimeout(() => {
            if (this.mesh && this.mesh.children[0])
                this.mesh.children[0].material.emissive = new THREE.Color(0x000000);
        }, 100);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        createParticles(this.mesh.position, 10, 0xaaaaaa);
        gameState.scene.remove(this.mesh);
        gameState.score += (this.type === 'golem' ? 50 : 20);
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
    }
}

export class Collectible extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        // Soul Stone visual
        const geo = new THREE.OctahedronGeometry(0.4, 0);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00aaaa,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.8
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, y, z);
        
        // Bobbing animation init
        this.startY = y;
        this.offset = Math.random() * Math.PI * 2;
        
        this.applyGravity = false; // Floats
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.mesh.rotation.y += 0.05;
        this.mesh.rotation.x += 0.02;
        this.mesh.position.y = this.startY + Math.sin(gameState.frameCount * 0.05 + this.offset) * 0.2;
    }
    
    collect() {
        gameState.score += 100;
        gameState.stonesCollected++;
        createParticles(this.mesh.position, 20, 0x00ffff);
        
        if (gameState.stonesCollected >= gameState.totalStones) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
}

export class Platform {
    constructor(x, y, z, w, h, d) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, y, z);
        this.size = new THREE.Vector3(w, h, d);
        this.mesh.receiveShadow = true;
        gameState.scene.add(this.mesh);
    }
}

// Particle System Helper
function createParticles(pos, count, color) {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: color });
    
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pos);
        mesh.position.x += (Math.random() - 0.5) * 0.5;
        mesh.position.y += (Math.random() - 0.5) * 0.5;
        mesh.position.z += (Math.random() - 0.5) * 0.5;
        
        const particle = {
            mesh: mesh,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.3
            ),
            life: 60, // Frames
            active: true
        };
        
        gameState.scene.add(mesh);
        gameState.particles.push(particle);
    }
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.life--;
        p.velocity.y -= 0.01; // Gravity
        p.mesh.position.add(p.velocity);
        
        if (p.life <= 0) {
            gameState.scene.remove(p.mesh);
            gameState.particles.splice(i, 1);
        }
    }
}