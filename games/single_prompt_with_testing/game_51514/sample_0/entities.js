/**
 * entities.js
 * Definitions for all game entities: Player, Enemy, Platform, etc.
 */

import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
    GRAVITY, FRICTION, AIR_RESISTANCE, PLAYER_SPEED, PLAYER_JUMP_FORCE,
    PLAYER_MAX_HEALTH, PLAYER_MAX_STABILITY, STABILITY_DRAIN_RATE, STABILITY_REGEN_RATE,
    PHASE_COLOR, NORMAL_COLOR, DAMAGE_COLOR
} from './globals.js';
import { resolveMapCollisions, checkAABB, checkRectCircle } from './physics.js';
import { isKeyDown, KEYS } from './input.js';
import { spawnExplosion, spawnDust } from './particles.js';

// ==========================================
// Base Entity Class
// ==========================================
export class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.visible = true;
    }

    update(p) {
        // Base update logic
    }

    render(p) {
        // Base render logic
    }
}

// ==========================================
// Player Class
// ==========================================
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.health = PLAYER_MAX_HEALTH;
        this.stability = PLAYER_MAX_STABILITY;
        this.onGround = false;
        this.facing = 1; // 1 = Right, -1 = Left
        this.isPhasing = false;
        this.invincibleTimer = 0;
        this.flashTimer = 0;
    }

    update(p) {
        // 1. Input Handling
        this.handleInput(p);

        // 2. Physics Application
        this.applyPhysics();

        // 3. Collision Resolution
        resolveMapCollisions(this, gameState.platforms);

        // 4. Status Updates
        this.updateStatus();
        
        // 5. Bounds Check (Camera)
        this.updateCamera();
    }

    handleInput(p) {
        // Reset X velocity for tighter controls, or use acceleration
        // Using acceleration feels better usually, but prompt constraints might imply simple physics
        // We'll use velocity setting with friction for responsiveness.
        
        // Stability/Phasing Logic
        if (isKeyDown(KEYS.SHIFT) && this.stability > 0) {
            this.isPhasing = true;
            this.stability -= STABILITY_DRAIN_RATE;
            // Spawn little phase particles
            if (p.frameCount % 5 === 0) {
                spawnDust(this.x + this.width/2, this.y + this.height/2, 1);
            }
        } else {
            this.isPhasing = false;
            if (this.stability < PLAYER_MAX_STABILITY) {
                this.stability += STABILITY_REGEN_RATE;
            }
        }

        // Movement
        if (isKeyDown(KEYS.LEFT)) {
            this.vx = -PLAYER_SPEED;
            this.facing = -1;
        } else if (isKeyDown(KEYS.RIGHT)) {
            this.vx = PLAYER_SPEED;
            this.facing = 1;
        } else {
            this.vx = 0;
        }

        // Jump
        if (isKeyDown(KEYS.SPACE) && this.onGround) {
            this.vy = PLAYER_JUMP_FORCE;
            this.onGround = false;
            spawnDust(this.x + this.width/2, this.y + this.height, 5);
            // Log jump
            p.logs.player_info.push({ event: 'jump', x: this.x, y: this.y, frame: p.frameCount });
        }

        // Shoot
        if (isKeyDown(KEYS.Z)) {
            // Simple cooldown
            if (p.frameCount % 20 === 0) {
                this.shoot(p);
            }
        }
    }

    applyPhysics() {
        // Gravity
        this.vy += GRAVITY;

        // Velocity Application
        this.x += this.vx;
        this.y += this.vy;
    }

    updateStatus() {
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.flashTimer > 0) this.flashTimer--;
        
        // Check Health
        if (this.health <= 0) {
            this.die();
        }
    }
    
    updateCamera() {
        // Center camera on player with some smoothing
        let targetX = this.x - CANVAS_WIDTH / 2 + this.width / 2;
        let targetY = this.y - CANVAS_HEIGHT / 2;
        
        // Clamp to world
        // const WORLD_WIDTH handled in resolve collisions
        // But camera needs to know world bounds? 
        // We'll just let it scroll freely horizontally, clamp vertically maybe?
        
        // Basic Linear Interpolation (Lerp)
        gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
        gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
        
        // Clamp Camera
        if (gameState.camera.x < 0) gameState.camera.x = 0;
        // Assume WORLD_WIDTH is limit
        // if (gameState.camera.x > WORLD_WIDTH - CANVAS_WIDTH) gameState.camera.x = WORLD_WIDTH - CANVAS_WIDTH;
    }

    shoot(p) {
        const bulletX = this.facing === 1 ? this.x + this.width : this.x - 10;
        const bulletY = this.y + this.height / 2 - 5;
        const pSpeed = 10 * this.facing;
        
        const proj = new Projectile(bulletX, bulletY, pSpeed, 0);
        gameState.projectiles.push(proj);
        gameState.entities.push(proj);
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;
        
        this.health -= amount;
        this.invincibleTimer = 60; // 1 second invincibility
        this.flashTimer = 10;
        
        spawnExplosion(this.x + this.width/2, this.y + this.height/2, [255, 0, 0], 5);
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Determine Color
        let c;
        if (this.flashTimer > 0) {
            c = p.color(...DAMAGE_COLOR);
        } else if (this.isPhasing) {
            c = p.color(PHASE_COLOR[0], PHASE_COLOR[1], PHASE_COLOR[2], 150); // Transparent
        } else {
            c = p.color(...NORMAL_COLOR);
        }
        
        p.fill(c);
        p.stroke(255);
        p.strokeWeight(2);
        
        // Draw Body
        p.rect(0, 0, this.width, this.height);
        
        // Draw Eyes (Direction)
        p.fill(255);
        p.noStroke();
        if (this.facing === 1) {
            p.rect(18, 5, 8, 8);
            p.rect(22, 5, 2, 2); // Glint
        } else {
            p.rect(4, 5, 8, 8);
        }
        
        p.pop();
    }
}

// ==========================================
// Platform Class
// ==========================================
export class Platform extends Entity {
    constructor(x, y, w, h, type = "SOLID") {
        super(x, y, w, h);
        this.type = type; // SOLID, PHASABLE
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === "PHASABLE") {
            // Cyan outline, hollow center
            p.stroke(PHASE_COLOR[0], PHASE_COLOR[1], PHASE_COLOR[2]);
            p.strokeWeight(2);
            p.fill(PHASE_COLOR[0], PHASE_COLOR[1], PHASE_COLOR[2], 50);
            
            // Tech pattern
            p.rect(0, 0, this.width, this.height);
            p.line(0, 0, this.width, this.height);
            p.line(this.width, 0, 0, this.height);
            
        } else {
            // Solid dark metal style
            p.fill(40, 40, 50);
            p.stroke(100);
            p.strokeWeight(2);
            p.rect(0, 0, this.width, this.height);
            
            // Detail
            p.noStroke();
            p.fill(60);
            p.rect(2, 2, this.width-4, 5);
        }
        
        p.pop();
    }
}

// ==========================================
// Enemy Class
// ==========================================
export class Enemy extends Entity {
    constructor(x, y, type = "PATROLLER") {
        super(x, y, 30, 30);
        this.type = type;
        this.health = 20;
        this.startX = x;
        this.patrolDist = 100;
        this.speed = 2;
        this.facing = 1;
        this.color = [255, 50, 50];
    }

    update(p) {
        if (this.type === "PATROLLER") {
            this.vx = this.speed * this.facing;
            this.x += this.vx;
            
            // Turn around logic
            if (this.x > this.startX + this.patrolDist) {
                this.facing = -1;
            } else if (this.x < this.startX - this.patrolDist) {
                this.facing = 1;
            }
        } else if (this.type === "SEEKER") {
            // Float towards player
            if (gameState.player) {
                let dx = gameState.player.x - this.x;
                let dy = gameState.player.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 300) { // Aggro range
                    this.vx = (dx / dist) * (this.speed * 0.8);
                    this.vy = (dy / dist) * (this.speed * 0.8);
                } else {
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                }
                
                this.x += this.vx;
                this.y += this.vy;
            }
        }
        
        // Collision with player
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(10);
            // Knockback
            gameState.player.vx = Math.sign(gameState.player.x - this.x) * 10;
            gameState.player.vy = -5;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        spawnExplosion(this.x + this.width/2, this.y + this.height/2, [255, 100, 100], 3);
        if (this.health <= 0) {
            this.active = false;
            spawnExplosion(this.x + this.width/2, this.y + this.height/2, [255, 0, 0], 10);
            gameState.score += 50;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(this.color);
        p.noStroke();
        
        if (this.type === "PATROLLER") {
            // Spiky block
            p.rect(0, 0, this.width, this.height);
            p.fill(0);
            p.rect(5, 5, 20, 10); // Visor
        } else {
            // Floating Triangle
            p.triangle(this.width/2, 0, this.width, this.height, 0, this.height);
        }
        
        p.pop();
    }
}

// ==========================================
// Collectible Class
// ==========================================
export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 15, 15);
        this.bobOffset = 0;
    }

    update(p) {
        // Bobbing animation
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 5;
        
        if (gameState.player && checkRectCircle(gameState.player, {x: this.x + 7.5, y: this.y + 7.5 + this.bobOffset, radius: 10})) {
            this.collect();
        }
    }

    collect() {
        this.active = false;
        gameState.score += 100;
        spawnExplosion(this.x, this.y, [255, 255, 0], 5);
        // Add stability
        if (gameState.player) {
            gameState.player.stability = Math.min(PLAYER_MAX_STABILITY, gameState.player.stability + 20);
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + 7.5, this.y + 7.5 + this.bobOffset);
        p.rotate(p.frameCount * 0.05);
        p.fill(255, 255, 0);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 10, 10);
        p.noFill();
        p.stroke(255, 200, 0);
        p.rect(0, 0, 18, 18);
        p.pop();
    }
}

// ==========================================
// Projectile Class
// ==========================================
export class Projectile extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 10, 5);
        this.vx = vx;
        this.vy = vy;
        this.lifeTime = 60; // Frames
    }

    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.lifeTime--;
        
        if (this.lifeTime <= 0) this.active = false;
        
        // Hit Enemies
        for (let enemy of gameState.enemies) {
            if (enemy.active && checkAABB(this, enemy)) {
                enemy.takeDamage(10);
                this.active = false;
                spawnExplosion(this.x, this.y, [0, 255, 255], 3);
                break;
            }
        }
        
        // Hit Platforms
        for (let plat of gameState.platforms) {
            if (checkAABB(this, plat)) {
                this.active = false;
                break;
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(0, 255, 255);
        p.noStroke();
        p.rect(0, 0, this.width, this.height);
        p.pop();
    }
}

// ==========================================
// Portal Class
// ==========================================
export class Portal extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60);
    }
    
    update(p) {
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        // Swirling effect
        p.fill(0, 0);
        p.strokeWeight(3);
        for(let i=0; i<3; i++) {
            p.stroke(100, 100, 255, 200 - i*50);
            let offset = (p.frameCount * 0.1 + i * 2) % 10;
            p.rect(-offset, -offset, this.width + offset*2, this.height + offset*2);
        }
        
        p.fill(200, 200, 255);
        p.noStroke();
        p.rect(0, 0, this.width, this.height);
        p.pop();
    }
}