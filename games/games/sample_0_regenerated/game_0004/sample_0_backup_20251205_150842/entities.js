/**
 * Game entities including Player, Enemies, Platforms, and Projectiles.
 * Contains logic for movement, AI, and interaction.
 */

import { gameState, GRAVITY, TERMINAL_VELOCITY, PLAYER_SPEED, JUMP_FORCE, GUN_RECOIL, GUN_AMMO_MAX, COLORS, CANVAS_WIDTH } from './globals.js';
import { checkAABB, resolveCollision } from './physics.js';
import { isKeyDown, KEYS } from './input.js';
import { createExplosion } from './particles.js';

// ==========================================
// Base Entity
// ==========================================
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
        this.color = [255, 255, 255];
    }

    update() {}
    
    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ==========================================
// Player
// ==========================================
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 30);
        this.health = 4;
        this.maxHealth = 4;
        this.ammo = GUN_AMMO_MAX;
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.invulnerableTimer = 0;
        this.shootCooldown = 0;
        
        // Physics tweaks
        this.airFriction = 0.98;
        this.groundFriction = 0.85;
    }

    update(p) {
        this.handleInput();
        this.applyPhysics();
        this.checkCollisions();
        this.checkWorldBounds();
        this.updateTimers();
        
        // Camera Follow
        const targetY = this.y - 150;
        // Only scroll down
        if (targetY > gameState.cameraY) {
            gameState.cameraY = Math.lerp(gameState.cameraY, targetY, 0.1);
        }
        
        // Check Death
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, 50, 'DEBRIS');
        }
        
        // Update Logs
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                health: this.health,
                ammo: this.ammo,
                depth: Math.floor(this.y),
                frame: p.frameCount
            });
        }
    }
    
    handleInput() {
        // Horizontal Movement
        if (isKeyDown(KEYS.LEFT)) {
            this.vx -= 0.8;
            this.facing = -1;
        }
        if (isKeyDown(KEYS.RIGHT)) {
            this.vx += 0.8;
            this.facing = 1;
        }
        
        // Cap horizontal speed
        this.vx = Math.max(Math.min(this.vx, PLAYER_SPEED), -PLAYER_SPEED);
        
        // Friction
        if (this.onGround) {
            this.vx *= this.groundFriction;
        } else {
            this.vx *= this.airFriction;
        }
        
        // Jump
        if (this.onGround && isKeyDown(KEYS.SPACE)) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
        }
        
        // Shoot (Gunboots) - Only in air
        if (!this.onGround && (isKeyDown(KEYS.SPACE) || isKeyDown(KEYS.Z))) {
            // Logic: Tap space to shoot. 
            // We need a cooldown or semi-automatic trigger.
            // Using a cooldown for simplicity.
            if (this.shootCooldown <= 0 && this.ammo > 0) {
                this.shoot();
            }
        }
        
        // Fast Fall
        if (isKeyDown(KEYS.SHIFT)) {
            this.vy += 0.2; // Extra gravity
        }
    }
    
    shoot() {
        this.ammo--;
        this.vy = Math.min(this.vy, 0) - GUN_RECOIL; // Negate downward velocity and boost up
        this.shootCooldown = 10; // Frames
        
        // Spawn Projectile
        const projX = this.x + this.width / 2;
        const projY = this.y + this.height;
        gameState.projectiles.push(new Projectile(projX, projY));
        
        // Effect
        createExplosion(projX, projY, 5, 'SMOKE');
        createExplosion(this.x + (this.facing === 1 ? 0 : this.width), this.y + this.height, 1, 'SHELL');
    }
    
    applyPhysics() {
        this.vy += GRAVITY;
        this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Reset ground flag (will be set by collisions)
        this.onGround = false;
    }
    
    checkCollisions() {
        // Platform Collisions
        for (const platform of gameState.platforms) {
            // Optimization: Only check platforms near player vertically
            if (Math.abs(platform.y - this.y) < 100) {
                resolveCollision(this, platform);
            }
        }
        
        // If on ground, recharge ammo
        if (this.onGround) {
            this.ammo = GUN_AMMO_MAX;
            gameState.combo = 0; // Reset combo on landing
        }
        
        // Enemy Collisions (Taking Damage)
        if (this.invulnerableTimer <= 0) {
            for (const enemy of gameState.enemies) {
                if (checkAABB(this, enemy)) {
                    // Stomp Mechanic: If falling and player bottom is above enemy center
                    if (this.vy > 0 && this.y + this.height < enemy.y + enemy.height / 2) {
                        enemy.takeDamage(5); // Kill enemy
                        this.vy = JUMP_FORCE * 0.5; // Bounce
                        this.ammo = GUN_AMMO_MAX; // Reward
                        gameState.combo++;
                    } else {
                        this.takeDamage(1);
                    }
                }
            }
        }
        
        // Gem Collisions
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const gem = gameState.collectibles[i];
            if (checkAABB(this, gem)) {
                gameState.score += gem.value;
                gameState.collectibles.splice(i, 1);
                createExplosion(gem.x, gem.y, 5, 'SPARK');
            }
        }
    }
    
    checkWorldBounds() {
        // Wrap Horizontal
        if (this.x < -this.width) {
            this.x = CANVAS_WIDTH;
        } else if (this.x > CANVAS_WIDTH) {
            this.x = -this.width;
        }
    }
    
    updateTimers() {
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.invulnerableTimer = INVULNERABILITY_FRAMES;
        createExplosion(this.x, this.y, 10, 'DEBRIS');
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Flash if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.fill(COLORS.PLAYER_HURT);
        } else {
            p.fill(COLORS.PLAYER);
        }
        
        // Draw Player Body (Simple box with eyes)
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        
        // Eyes based on facing
        p.fill(0);
        const eyeOffset = 6 * this.facing;
        p.rect(eyeOffset, -5, 4, 8);
        
        // Gunboots
        p.fill(100);
        p.rect(-5, 15, 6, 8);
        p.rect(5, 15, 6, 8);
        
        p.pop();
    }
}

// ==========================================
// Projectile
// ==========================================
export class Projectile extends Entity {
    constructor(x, y) {
        super(x - 3, y, 6, 12); // Narrow vertical projectile
        this.vy = 12; // Fast downward speed
        this.lifetime = 40;
    }
    
    update() {
        this.y += this.vy;
        this.lifetime--;
        
        if (this.lifetime <= 0) this.markedForDeletion = true;
        
        // Collision with Enemies
        for (const enemy of gameState.enemies) {
            if (checkAABB(this, enemy)) {
                enemy.takeDamage(1);
                this.markedForDeletion = true;
                createExplosion(this.x, this.y, 5, 'SPARK');
                break;
            }
        }
        
        // Collision with Platforms
        for (const platform of gameState.platforms) {
             if (checkAABB(this, platform)) {
                 this.markedForDeletion = true;
                 createExplosion(this.x, this.y, 3, 'SMOKE');
                 
                 // Breakable blocks logic could go here
                 if (platform.isBreakable) {
                     platform.takeDamage();
                 }
                 break;
             }
        }
    }
    
    render(p) {
        p.fill(COLORS.PROJECTILE);
        p.noStroke();
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ==========================================
// Enemies
// ==========================================
export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // 'FLYER', 'CRAWLER'
        this.hp = 2;
        this.speed = 1.5;
        this.dir = Math.random() > 0.5 ? 1 : -1;
    }
    
    update() {
        if (!gameState.player) return;

        // Basic AI
        if (this.type === 'CRAWLER') {
            this.x += this.speed * this.dir;
            
            // Check platform edges (simple turn around)
            // Raycast down ahead
            // For now, simpler: bounce off walls
            if (this.x <= 0 || this.x >= CANVAS_WIDTH - this.width) {
                this.dir *= -1;
            }
        } else if (this.type === 'FLYER') {
            // Float towards player slowly
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 300) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        
        // Despawn if far above camera
        if (this.y < gameState.cameraY - 200) {
            this.markedForDeletion = true;
        }
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
            gameState.score += 100 * (gameState.combo + 1);
            createExplosion(this.x + this.width/2, this.y + this.height/2, 15, 'DEBRIS');
        } else {
            createExplosion(this.x, this.y, 3, 'SPARK');
        }
    }
    
    render(p) {
        p.fill(this.type === 'FLYER' ? COLORS.ENEMY_FLYER : COLORS.ENEMY_CRAWLER);
        p.stroke(0);
        p.strokeWeight(1);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Monster Face
        p.fill(0);
        p.rect(this.x + 5, this.y + 8, 5, 5);
        p.rect(this.x + 20, this.y + 8, 5, 5);
        p.rect(this.x + 8, this.y + 20, 14, 3);
    }
}

// ==========================================
// Platform
// ==========================================
export class Platform extends Entity {
    constructor(x, y, w, h, breakable = false) {
        super(x, y, w, h);
        this.isBreakable = breakable;
    }
    
    takeDamage() {
        if (this.isBreakable) {
            this.markedForDeletion = true;
            createExplosion(this.x + this.width/2, this.y + this.height/2, 10, 'SMOKE');
        }
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.isBreakable ? COLORS.PLATFORM_BREAKABLE : COLORS.PLATFORM);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Detail
        if (this.isBreakable) {
            p.stroke(50);
            p.line(this.x, this.y, this.x + this.width, this.y + this.height);
        }
    }
}

// ==========================================
// Collectible (Gem)
// ==========================================
export class Gem extends Entity {
    constructor(x, y) {
        super(x, y, 15, 15);
        this.value = 50;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update(p) { // Pass p here or handle via time
        // Bobbing animation handled in render
    }
    
    render(p) {
        const offset = Math.sin(p.frameCount * 0.1 + this.bobOffset) * 3;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2 + offset);
        p.rotate(p.frameCount * 0.05);
        
        p.fill(COLORS.GEM);
        p.noStroke();
        p.beginShape();
        p.vertex(0, -8);
        p.vertex(8, 0);
        p.vertex(0, 8);
        p.vertex(-8, 0);
        p.endShape(p.CLOSE);
        
        p.pop();
    }
}