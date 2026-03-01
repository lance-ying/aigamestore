/**
 * Game Entities
 * Includes Player (Cannon), Mobs, Gates, and Bases.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, 
    COLOR_PLAYER, COLOR_ENEMY, COLOR_GATE_MULT, COLOR_GATE_ADD, 
    MOB_RADIUS, MOB_SPEED, ENEMY_MOB_SPEED,
    gameState,
    PLAYER_COOLDOWN
} from './globals.js';

import { isKeyDown, KEYS } from './input.js';

// --- Base Entity ---
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
    }
    
    update(p) {}
    render(p) {}
    
    kill() {
        this.dead = true;
    }
    
    get isDead() {
        return this.dead;
    }
}

// --- Player Cannon ---
export class Player extends Entity {
    constructor() {
        super(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
        this.width = 40;
        this.height = 40;
        this.baseHealth = 100;
        this.maxBaseHealth = 100;
        
        this.cooldownTimer = 0;
        this.speed = 5;
    }

    update(p) {
        // Movement
        if (isKeyDown(KEYS.LEFT)) {
            this.x -= this.speed;
        }
        if (isKeyDown(KEYS.RIGHT)) {
            this.x += this.speed;
        }
        
        // Clamp to screen
        this.x = Math.max(this.width/2, Math.min(CANVAS_WIDTH - this.width/2, this.x));

        // Shooting
        if (this.cooldownTimer > 0) this.cooldownTimer--;
        
        const isRapid = isKeyDown(KEYS.SHIFT) && gameState.energy > 0;
        const shootRate = isRapid ? 4 : PLAYER_COOLDOWN;
        
        if (isKeyDown(KEYS.SPACE)) {
            if (this.cooldownTimer <= 0) {
                this.shoot();
                this.cooldownTimer = shootRate;
                
                if (isRapid) gameState.energy = Math.max(0, gameState.energy - 0.5);
            }
        }
        
        // Energy Regen
        if (!isRapid && gameState.energy < gameState.maxEnergy) {
            gameState.energy += 0.1;
        }
        
        // Champion Spawn (Z)
        if (isKeyDown(KEYS.Z)) {
             // Logic for champion handled in debounced input or simple cooldown check
             // For now, let's keep it simple or implement if space permits
        }
    }

    shoot() {
        // Spawn a friendly mob
        this.spawnMobAt(this.x, this.y - 20);
    }
    
    spawnMobAt(x, y) {
        const mob = new Mob(x, y, 'FRIENDLY');
        gameState.mobs.push(mob);
    }

    takeBaseDamage(amount) {
        this.baseHealth -= amount;
        if (this.baseHealth <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Base
        p.fill(50);
        p.rectMode(p.CENTER);
        p.rect(0, 20, 60, 20); // Platform
        
        // Cannon
        p.fill(COLOR_PLAYER);
        p.rect(0, 0, 20, 40);
        
        // Detail
        p.fill(255, 255, 255, 100);
        p.rect(0, 0, 10, 30);
        
        p.pop();
        
        // Render Base Health Line
        const hRatio = this.baseHealth / this.maxBaseHealth;
        p.noStroke();
        p.fill(50);
        p.rect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
        p.fill(hRatio > 0.3 ? COLOR_PLAYER : [255, 0, 0]);
        p.rect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH * hRatio, 10);
    }
}

// --- Mob ---
export class Mob extends Entity {
    constructor(x, y, team) {
        super(x, y);
        this.team = team; // 'FRIENDLY' or 'ENEMY'
        this.type = 'MOB';
        this.radius = MOB_RADIUS;
        
        // Physics
        // Slight randomness in velocity to avoid stacking perfectly
        const spread = (Math.random() - 0.5) * 0.5;
        
        if (team === 'FRIENDLY') {
            this.vy = -MOB_SPEED;
            this.vx = spread;
        } else {
            this.vy = ENEMY_MOB_SPEED;
            this.vx = spread;
        }
    }

    update(p) {
        // Basic Movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Wall Bounce
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x > CANVAS_WIDTH - this.radius) {
            this.x = CANVAS_WIDTH - this.radius;
            this.vx *= -1;
        }
        
        // Cull if off screen
        if (this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
            this.kill();
        }
    }

    render(p) {
        p.fill(this.team === 'FRIENDLY' ? COLOR_PLAYER : COLOR_ENEMY);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
    }
}

// --- Multiplier Gate ---
export class Gate extends Entity {
    constructor(x, y, width, value, op) {
        super(x, y);
        this.width = width;
        this.height = 30;
        this.value = value;
        this.op = op; // 'MULT' or 'ADD'
        this.type = 'GATE';
        this.speed = 0.5; // Scroll speed
    }

    update(p) {
        this.y += this.speed;
        
        // Remove if passes player
        if (this.y > CANVAS_HEIGHT - 50) {
            this.kill();
        }
    }

    render(p) {
        p.push();
        const color = this.op === 'MULT' ? COLOR_GATE_MULT : COLOR_GATE_ADD;
        
        // Glassy look
        p.fill(color[0], color[1], color[2], 100);
        p.stroke(color);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Text
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.textStyle(p.BOLD);
        const txt = this.op === 'MULT' ? `x${this.value}` : `+${this.value}`;
        p.text(txt, this.x + this.width/2, this.y + this.height/2);
        
        p.pop();
    }
}

// --- Enemy Base ---
export class EnemyBase extends Entity {
    constructor() {
        super(CANVAS_WIDTH / 2, 40);
        this.width = 120;
        this.height = 60;
        this.health = 500;
        this.maxHealth = 500;
        this.type = 'ENEMY_BASE';
        
        this.spawnTimer = 0;
        this.spawnRate = 60; // Frames
    }

    update(p) {
        // Spawning Logic
        this.spawnTimer++;
        
        // Dynamic difficulty: Spawn faster as health drops
        const currentRate = Math.max(20, Math.floor(this.spawnRate * (this.health / this.maxHealth)));
        
        if (this.spawnTimer >= currentRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }
    
    spawnEnemy() {
        const x = this.x - this.width/2 + Math.random() * this.width;
        const y = this.y + this.height/2;
        const enemy = new Mob(x, y, 'ENEMY');
        gameState.mobs.push(enemy);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    render(p) {
        p.push();
        p.rectMode(p.CENTER);
        p.translate(this.x, this.y);
        
        // Base structure
        p.fill(COLOR_ENEMY);
        p.stroke(200, 50, 50);
        p.strokeWeight(3);
        p.rect(0, 0, this.width, this.height, 10);
        
        // Health Bar (above base)
        const barW = this.width;
        const barH = 8;
        const healthPct = Math.max(0, this.health / this.maxHealth);
        
        p.noStroke();
        p.fill(50);
        p.rect(0, -this.height/2 - 10, barW, barH);
        p.fill(0, 255, 0);
        p.rectMode(p.CORNER);
        p.rect(-barW/2, -this.height/2 - 14, barW * healthPct, barH);
        
        // Label
        p.fill(255);
        p.textAlign(p.CENTER);
        p.textSize(12);
        p.text(this.health, 0, 5);
        
        p.pop();
    }
}