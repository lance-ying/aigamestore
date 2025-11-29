// entities.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState, 
    PLAYER_SPEED, 
    PLAYER_SPRINT_SPEED, 
    PLAYER_TURN_SPEED,
    PLAYER_MAX_HEALTH,
    PLAYER_MAX_HUNGER,
    PLAYER_MAX_THIRST,
    PLAYER_MAX_RADIATION,
    HUNGER_DEPLETION,
    THIRST_DEPLETION,
    RADIATION_INCREASE,
    SPRINT_HUNGER_MULTIPLIER,
    PLAYER_ATTACK_RANGE,
    PLAYER_ATTACK_COOLDOWN,
    ITEM_FOOD_RESTORE,
    ITEM_WATER_RESTORE,
    ITEM_ANTIRAD_RESTORE,
    WORLD_SIZE,
    ENEMY_SPEED,
    ENEMY_ATTACK_RANGE,
    ENEMY_ATTACK_DAMAGE,
    ENEMY_HEALTH,
    ENEMY_DETECTION_RANGE,
    BUILDING_SIZE,
    BUILDING_INTERACTION_RANGE,
    EVAC_SIZE
} from './globals.js';

export class Player {
    constructor(x, z) {
        // Create player mesh
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            roughness: 0.7,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 1, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Physics
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angle = 0;
        
        // Stats
        this.health = PLAYER_MAX_HEALTH;
        this.hunger = PLAYER_MAX_HUNGER;
        this.thirst = PLAYER_MAX_THIRST;
        this.radiation = 0;
        
        // Inventory
        this.inventory = {
            food: 0,
            water: 0,
            antirad: 0,
            scrap: 0
        };
        
        // Combat
        this.attacking = false;
        this.attackCooldown = 0;
        this.currentConsumable = 0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime, inputs) {
        // Movement
        let speed = PLAYER_SPEED;
        let sprintActive = false;
        
        if (inputs.shift && this.hunger > 0) {
            speed = PLAYER_SPRINT_SPEED;
            sprintActive = true;
        }
        
        if (inputs.up) {
            const moveX = Math.sin(this.angle) * speed;
            const moveZ = Math.cos(this.angle) * speed;
            const newX = this.mesh.position.x + moveX;
            const newZ = this.mesh.position.z + moveZ;
            
            if (newX >= -WORLD_SIZE/2 && newX <= WORLD_SIZE/2 && 
                newZ >= -WORLD_SIZE/2 && newZ <= WORLD_SIZE/2) {
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
            }
        }
        
        if (inputs.down) {
            const moveX = Math.sin(this.angle) * speed * 0.6;
            const moveZ = Math.cos(this.angle) * speed * 0.6;
            const newX = this.mesh.position.x - moveX;
            const newZ = this.mesh.position.z - moveZ;
            
            if (newX >= -WORLD_SIZE/2 && newX <= WORLD_SIZE/2 && 
                newZ >= -WORLD_SIZE/2 && newZ <= WORLD_SIZE/2) {
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
            }
        }
        
        if (inputs.left) {
            this.angle -= PLAYER_TURN_SPEED;
        }
        
        if (inputs.right) {
            this.angle += PLAYER_TURN_SPEED;
        }
        
        // Update mesh rotation
        this.mesh.rotation.y = -this.angle;
        
        // Attack
        if (inputs.space && this.attackCooldown === 0) {
            this.attacking = true;
            this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        } else {
            this.attacking = false;
        }
        
        // Consumables
        if (inputs.z) {
            this.useConsumable();
            inputs.z = false;
        }
        
        // Deplete survival stats
        const hungerRate = sprintActive ? HUNGER_DEPLETION * SPRINT_HUNGER_MULTIPLIER : HUNGER_DEPLETION;
        this.hunger -= hungerRate * deltaTime;
        this.thirst -= THIRST_DEPLETION * deltaTime;
        this.radiation += RADIATION_INCREASE * deltaTime;
        
        // Clamp values
        this.hunger = Math.max(0, this.hunger);
        this.thirst = Math.max(0, this.thirst);
        this.radiation = Math.min(PLAYER_MAX_RADIATION, this.radiation);
        
        // Take damage from low stats
        if (this.hunger <= 0) this.health -= 0.5;
        if (this.thirst <= 0) this.health -= 0.8;
        if (this.radiation >= PLAYER_MAX_RADIATION) this.health -= 1.0;
        
        this.health = Math.max(0, this.health);
    }
    
    useConsumable() {
        const types = ['food', 'water', 'antirad'];
        const type = types[this.currentConsumable];
        
        if (this.inventory[type] > 0) {
            this.inventory[type]--;
            
            if (type === 'food') {
                this.hunger = Math.min(PLAYER_MAX_HUNGER, this.hunger + ITEM_FOOD_RESTORE);
            } else if (type === 'water') {
                this.thirst = Math.min(PLAYER_MAX_THIRST, this.thirst + ITEM_WATER_RESTORE);
            } else if (type === 'antirad') {
                this.radiation = Math.max(0, this.radiation - ITEM_ANTIRAD_RESTORE);
            }
        }
        
        this.currentConsumable = (this.currentConsumable + 1) % 3;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
    }
    
    getAttackPoint() {
        return {
            x: this.mesh.position.x + Math.sin(this.angle) * PLAYER_ATTACK_RANGE,
            z: this.mesh.position.z + Math.cos(this.angle) * PLAYER_ATTACK_RANGE
        };
    }
}

export class Enemy {
    constructor(x, z) {
        // Create enemy mesh
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x003300,
            roughness: 0.6
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 0.5, z);
        this.mesh.castShadow = true;
        
        // Stats
        this.health = ENEMY_HEALTH;
        this.angle = Math.random() * Math.PI * 2;
        this.state = 'idle';
        this.attackCooldown = 0;
        this.dead = false;
        this.wanderTimer = 0;
        this.wanderAngle = 0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(player) {
        if (this.dead) return;
        
        const dx = player.mesh.position.x - this.mesh.position.x;
        const dz = player.mesh.position.z - this.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        // State machine
        if (dist < ENEMY_DETECTION_RANGE) {
            if (dist < ENEMY_ATTACK_RANGE) {
                this.state = 'attack';
            } else {
                this.state = 'chase';
            }
        } else {
            this.state = 'idle';
        }
        
        // Behavior
        if (this.state === 'chase') {
            this.angle = Math.atan2(dx, dz);
            this.mesh.position.x += Math.sin(this.angle) * ENEMY_SPEED;
            this.mesh.position.z += Math.cos(this.angle) * ENEMY_SPEED;
        } else if (this.state === 'idle') {
            this.wanderTimer--;
            if (this.wanderTimer <= 0) {
                this.wanderAngle = Math.random() * Math.PI * 2;
                this.wanderTimer = Math.floor(Math.random() * 60 + 60);
            }
            this.mesh.position.x += Math.sin(this.wanderAngle) * ENEMY_SPEED * 0.3;
            this.mesh.position.z += Math.cos(this.wanderAngle) * ENEMY_SPEED * 0.3;
        } else if (this.state === 'attack') {
            if (this.attackCooldown === 0) {
                player.takeDamage(ENEMY_ATTACK_DAMAGE);
                this.attackCooldown = 60;
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        // Update rotation
        this.mesh.rotation.y = -this.angle;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            this.mesh.visible = false;
        }
    }
    
    checkHit(attackX, attackZ, range) {
        const dx = this.mesh.position.x - attackX;
        const dz = this.mesh.position.z - attackZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist < range;
    }
}

export class Building {
    constructor(x, z, type) {
        this.type = type; // 0: apartments, 1: shop, 2: warehouse
        this.scavenged = false;
        
        // Create building mesh
        const width = BUILDING_SIZE;
        const height = BUILDING_SIZE * (1.5 + Math.random() * 0.5);
        const depth = BUILDING_SIZE;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        let color;
        if (type === 0) color = 0x505a64;
        else if (type === 1) color = 0x645046;
        else color = 0x465064;
        
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, height / 2, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
    }
    
    canScavenge(playerX, playerZ) {
        const dx = this.mesh.position.x - playerX;
        const dz = this.mesh.position.z - playerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return !this.scavenged && dist < BUILDING_INTERACTION_RANGE;
    }
    
    scavenge(player) {
        if (this.scavenged) return null;
        
        this.scavenged = true;
        
        // Change material to indicate scavenged
        this.mesh.material = new THREE.MeshStandardMaterial({ 
            color: 0x3c3c3c,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Generate loot
        const loot = {
            food: 0,
            water: 0,
            antirad: 0,
            scrap: 0
        };
        
        switch(this.type) {
            case 0: // apartments
                loot.food = Math.floor(Math.random() * 2 + 1);
                loot.water = Math.floor(Math.random() * 2 + 1);
                loot.scrap = Math.floor(Math.random() * 2);
                break;
            case 1: // shop
                loot.food = Math.floor(Math.random() * 2 + 2);
                loot.water = Math.floor(Math.random() * 2 + 2);
                loot.antirad = Math.floor(Math.random() * 2);
                break;
            case 2: // warehouse
                loot.scrap = Math.floor(Math.random() * 3 + 3);
                loot.antirad = Math.floor(Math.random() * 2 + 1);
                break;
        }
        
        player.inventory.food += loot.food;
        player.inventory.water += loot.water;
        player.inventory.antirad += loot.antirad;
        player.inventory.scrap += loot.scrap;
        
        return loot;
    }
}

export class EvacuationPoint {
    constructor(x, z) {
        // Create evacuation platform
        const geometry = new THREE.CylinderGeometry(EVAC_SIZE, EVAC_SIZE, 0.5, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 0.25, z);
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
    }
    
    update() {
        // Pulse effect
        const pulse = 0.3 + Math.sin(gameState.frameCount * 0.05) * 0.2;
        this.mesh.material.emissiveIntensity = pulse;
    }
}