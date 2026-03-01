/**
 * Game Entities: Player, Enemy, Projectile, Interactive Objects
 */
import { PhysicsBody } from './physics.js';
import { gameState, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_JUMP_FORCE, PLAYER_DOUBLE_JUMP_FORCE, CANVAS_HEIGHT } from './globals.js';
import { getAction } from './input.js';
import { spawnExplosion, spawnBlood, Particle } from './particles.js';
import { checkAABB, dist } from './utils.js';
import { collideRectRect, collideCircleRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

// ==========================================
// Base Entity
// ==========================================
class Entity extends PhysicsBody {
    constructor(x, y, w, h, type) {
        super(x, y, w, h);
        this.type = type;
        this.active = true;
        this.facing = 1; // 1 Right, -1 Left
        this.health = 100;
        this.maxHealth = 100;
        this.color = [255, 255, 255];
        this.flashTime = 0; // For damage feedback
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTime = 5;
        spawnBlood(this.x + this.width/2, this.y + this.height/2, 3);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        spawnBlood(this.x + this.width/2, this.y + this.height/2, 10);
    }

    render(p) {
        if (!this.active) return;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        
        if (this.flashTime > 0) {
            p.fill(255); // White flash
            this.flashTime--;
        } else {
            p.fill(this.color);
        }
        
        this.drawSprite(p);
        p.pop();
    }

    drawSprite(p) {
        // Override me
        p.rect(-this.width/2, -this.height/2, this.width, this.height);
    }
}

// ==========================================
// Player Class
// ==========================================
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, 'player');
        this.color = [50, 100, 255]; // Blue Bro
        this.canDoubleJump = false;
        this.shootCooldown = 0;
        this.grenadeCooldown = 0;
        this.ammo = 999;
        this.grenades = 3;
    }

    update() {
        // Input Handling
        if (getAction('LEFT')) {
            this.vx -= 1; // Acceleration feel
            if (this.vx < -PLAYER_SPEED) this.vx = -PLAYER_SPEED;
            this.facing = -1;
        } else if (getAction('RIGHT')) {
            this.vx += 1;
            if (this.vx > PLAYER_SPEED) this.vx = PLAYER_SPEED;
            this.facing = 1;
        } else {
            // Drag handled in physics
        }

        // Jump
        if (getAction('JUMP_TRIGGER')) {
            if (this.onGround) {
                this.vy = PLAYER_JUMP_FORCE;
                this.canDoubleJump = true;
            } else if (this.canDoubleJump) {
                this.vy = PLAYER_DOUBLE_JUMP_FORCE;
                this.canDoubleJump = false;
                // Add particle effect
                gameState.particles.push(new Particle(this.x + this.width/2, this.y + this.height, 'smoke'));
            }
        }

        // Shooting
        if (getAction('SHOOT') && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 8; // Fire rate
        }
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Grenade
        if (getAction('GRENADE') && this.grenadeCooldown <= 0 && this.grenades > 0) {
            this.throwGrenade();
            this.grenadeCooldown = 60;
            this.grenades--;
        }
        if (this.grenadeCooldown > 0) this.grenadeCooldown--;

        // Update Physics
        super.updatePhysics();

        // Check for void death
        if (this.y > gameState.levelHeight) {
            this.health = 0;
            this.die();
        }
    }

    shoot() {
        const bx = this.facing === 1 ? this.x + this.width : this.x;
        const by = this.y + this.height / 3;
        const b = new Projectile(bx, by, this.facing * 12, 0, 'bullet', this);
        gameState.projectiles.push(b);
        
        // Screen shake (micro)
        gameState.camera.shakeStrength = Math.max(gameState.camera.shakeStrength, 2);
    }

    throwGrenade() {
        const gx = this.facing === 1 ? this.x + this.width : this.x;
        const gy = this.y;
        // Arc throw
        const g = new Projectile(gx, gy, this.facing * 8, -6, 'grenade', this);
        gameState.projectiles.push(g);
    }

    die() {
        super.die();
        gameState.gamePhase = "GAME_OVER_LOSE";
        spawnExplosion(this.x, this.y, 2);
    }

    drawSprite(p) {
        p.noStroke();
        // Body
        p.fill(this.flashTime > 0 ? 255 : [60, 60, 200]);
        p.rect(-12, -20, 24, 40);
        // Headband
        p.fill(255, 0, 0);
        p.rect(-12, -16, 24, 6);
        p.rect(12, -16, 8, 4); // Tail of headband
        // Gun
        p.fill(20);
        p.rect(0, 0, 25, 8);
        // Muscle Arm
        p.fill(200, 150, 100);
        p.rect(-5, 0, 10, 8);
    }
}

// ==========================================
// Enemy Classes
// ==========================================
export class Enemy extends Entity {
    constructor(x, y, type = 'grunt') {
        super(x, y, 24, 40, 'enemy');
        this.aiType = type;
        this.detectRange = 400;
        this.shootRange = 250;
        this.shootTimer = 0;
        
        if (type === 'grunt') {
            this.health = 30;
            this.color = [50, 150, 50];
        } else if (type === 'bomber') {
            this.health = 20;
            this.color = [200, 50, 50];
            this.shootRange = 20; // Melee
        } else if (type === 'boss') {
            this.health = 300;
            this.width = 40;
            this.height = 60;
            this.color = [100, 20, 20];
            this.shootRange = 500;
        }
    }

    update() {
        if (!gameState.player || !gameState.player.active) return;
        
        const distToPlayer = dist(this.x, this.y, gameState.player.x, gameState.player.y);
        const dx = gameState.player.x - this.x;
        
        // AI Logic
        if (distToPlayer < this.detectRange) {
            // Face player
            this.facing = dx > 0 ? 1 : -1;
            
            if (this.aiType === 'grunt') {
                // Keep distance or approach
                if (Math.abs(dx) > 150) {
                    this.vx = this.facing * 2;
                } else if (Math.abs(dx) < 100) {
                    this.vx = -this.facing * 1.5; // Back away
                } else {
                    this.vx = 0;
                }
                
                // Shoot
                if (this.shootTimer <= 0 && Math.abs(dx) < this.shootRange) {
                    this.shoot();
                    this.shootTimer = 60 + Math.random() * 60;
                }
            } else if (this.aiType === 'bomber') {
                // Rush
                this.vx = this.facing * 4;
                // Explode if close
                if (distToPlayer < 30) {
                    this.explode();
                }
            } else if (this.aiType === 'boss') {
                if (Math.abs(dx) > 300) {
                    this.vx = this.facing * 1;
                } else {
                    this.vx = 0;
                }
                
                if (this.shootTimer <= 0) {
                    // Minigun burst
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => this.shoot(), i * 100);
                    }
                    this.shootTimer = 120;
                }
            }
        } else {
            this.vx = 0;
        }
        
        this.shootTimer--;
        super.updatePhysics();
    }

    shoot() {
        const bx = this.facing === 1 ? this.x + this.width : this.x;
        const by = this.y + this.height / 3;
        // Enemy bullets are slower, distinct color
        const b = new Projectile(bx, by, this.facing * 8, 0, 'enemy_bullet', this);
        gameState.projectiles.push(b);
    }
    
    explode() {
        this.health = 0;
        this.die();
        // Create explosion logic entity or just visual+damage check
        const exp = new Explosion(this.x, this.y, 100, 60); // range, damage
        gameState.projectiles.push(exp);
    }

    die() {
        super.die();
        gameState.enemiesKilled++;
        // Remove from array happens in game loop cleanup
    }

    drawSprite(p) {
        p.noStroke();
        // Uniform
        p.fill(this.flashTime > 0 ? 255 : this.color);
        
        if (this.aiType === 'bomber') {
            // Vest
            p.rect(-this.width/2, -this.height/2, this.width, this.height);
            p.fill(50); // Bomb
            p.rect(-10, -5, 20, 15);
            // Fuse sparks
            if (p.random() > 0.5) p.fill(255, 200, 0);
            p.circle(0, -10, 5);
        } else {
            p.rect(-this.width/2, -this.height/2, this.width, this.height);
            // Balaclava
            p.fill(20);
            p.rect(-10, -18, 20, 10);
            // Eyes
            p.fill(255);
            p.rect(2 * this.facing, -15, 4, 2);
        }
    }
}

// ==========================================
// Projectiles (Bullet, Grenade, Explosion)
// ==========================================
export class Projectile extends PhysicsBody {
    constructor(x, y, vx, vy, type, owner) {
        super(x, y, 8, 8);
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.owner = owner; // Who fired it
        this.active = true;
        this.life = type === 'grenade' ? 120 : 100; // Frames
    }

    update() {
        if (!this.active) return;
        
        if (this.type === 'grenade') {
            this.vy += 0.3; // Gravity for grenade
            this.x += this.vx;
            this.y += this.vy;
            
            // Bounce
            for (let plat of gameState.platforms) {
                if (checkAABB(this, plat)) {
                    this.vy *= -0.6;
                    this.vx *= 0.8;
                    this.y += this.vy * 2; // Unstuck
                }
            }
            
            this.life--;
            if (this.life <= 0) {
                this.explode();
            }
        } else {
            // Bullet - straight line usually, but lets use physics body for simplicity
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            
            // Check Collision
            // 1. Walls
            for (let plat of gameState.platforms) {
                if (checkAABB(this, plat)) {
                    this.active = false;
                    gameState.particles.push(new Particle(this.x, this.y, 'spark'));
                    return;
                }
            }
            
            // 2. Entities
            const targets = this.type === 'bullet' ? gameState.entities.filter(e => e.type === 'enemy' || e.type === 'barrel') : [gameState.player];
            
            for (let t of targets) {
                if (!t || !t.active) continue;
                if (checkAABB(this, t)) {
                    t.takeDamage(this.type === 'bullet' ? 10 : 10);
                    this.active = false;
                    return;
                }
            }
            
            if (this.life <= 0) this.active = false;
        }
    }
    
    explode() {
        this.active = false;
        const exp = new Explosion(this.x, this.y, 120, 80); // Big boom
        gameState.projectiles.push(exp);
        spawnExplosion(this.x, this.y, 2);
    }

    render(p) {
        if (!this.active) return;
        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === 'grenade') {
            p.fill(0, 100, 0);
            p.circle(4, 4, 8);
            if (this.life < 30 && p.frameCount % 4 === 0) p.fill(255, 0, 0);
            p.circle(4, 4, 4); // Blink
        } else if (this.type === 'bullet') {
            p.fill(255, 255, 0);
            p.rect(0, 0, 8, 4);
        } else {
            p.fill(255, 100, 100);
            p.circle(4, 4, 6);
        }
        p.pop();
    }
}

export class Explosion {
    constructor(x, y, radius, damage) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.life = 5; // Damage frames
        this.active = true;
        this.hasDamaged = []; // Prevent multi-hit
    }
    
    update() {
        this.life--;
        if (this.life <= 0) this.active = false;
        
        // Check everything in radius
        const allTargets = [...gameState.entities, gameState.player];
        
        for (let t of allTargets) {
            if (!t || !t.active || this.hasDamaged.includes(t)) continue;
            
            // Simple center distance check
            const tx = t.x + t.width/2;
            const ty = t.y + t.height/2;
            
            if (dist(this.x, this.y, tx, ty) < this.radius) {
                t.takeDamage(this.damage);
                this.hasDamaged.push(t);
            }
        }
    }
    
    render(p) {
        // Rendered via particles mostly, but debug circle:
        // p.noFill();
        // p.stroke(255, 0, 0);
        // p.circle(this.x, this.y, this.radius * 2);
    }
}

// ==========================================
// Interactives (Barrel, Flag)
// ==========================================
export class Barrel extends Entity {
    constructor(x, y) {
        super(x, y, 24, 32, 'barrel');
        this.health = 1; // Dies instantly
        this.color = [200, 0, 0];
    }
    
    die() {
        super.die();
        const exp = new Explosion(this.x + 12, this.y + 16, 150, 100);
        gameState.projectiles.push(exp);
        spawnExplosion(this.x, this.y, 2.5);
    }
    
    drawSprite(p) {
        p.noStroke();
        p.fill(this.color);
        p.rect(-12, -16, 24, 32);
        p.fill(255, 200, 0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text("TNT", 0, 0);
    }
}

export class Flag extends Entity {
    constructor(x, y) {
        super(x, y, 40, 100, 'flag');
        this.health = 9999; // Invincible
    }
    
    update() {
        if (checkAABB(gameState.player, this)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    drawSprite(p) {
        p.stroke(200);
        p.strokeWeight(4);
        p.line(-10, -50, -10, 50); // Pole
        
        p.noStroke();
        p.fill(0, 0, 255);
        p.rect(-10, -50, 40, 30); // Flag
        
        // Stars
        p.fill(255);
        p.circle(10, -35, 10);
    }
}