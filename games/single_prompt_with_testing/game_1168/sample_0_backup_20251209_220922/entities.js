import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, 
    TYPE_PLAYER, TYPE_ENEMY, TYPE_PROJECTILE, TYPE_COLLECTIBLE, TYPE_PARTICLE,
    WEAPON_PISTOL, WEAPON_SHOTGUN, WEAPON_LASER, WEAPON_MACHINEGUN,
    PHASE_GAME_OVER_LOSE
} from './globals.js';
import { applyPhysics, resolvePlatformCollisions, checkAABB } from './physics.js';

// --- Base Entity ---
export class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.onGround = false;
        this.color = [255, 255, 255];
        this.facing = 1; // 1 right, -1 left
    }

    update(p) {
        applyPhysics(this);
        this.x += this.vx;
        this.y += this.vy;
        
        // Basic boundary check (horizontal)
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.width > CANVAS_WIDTH) { this.x = CANVAS_WIDTH - this.width; this.vx = 0; }
    }

    render(p, camY) {
        // Cull if off screen
        if (this.y - camY > CANVAS_HEIGHT || this.y + this.height - camY < 0) return;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2 - camY);
        p.scale(this.facing, 1);
        this.drawSprite(p);
        p.pop();
    }

    drawSprite(p) {
        p.fill(this.color);
        p.rect(-this.width/2, -this.height/2, this.width, this.height);
    }
}

// --- Player ---
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 36, TYPE_PLAYER);
        this.speed = 0.8; // Acceleration
        this.maxSpeed = 5;
        this.jumpForce = -12;
        this.health = 100;
        this.maxHealth = 100;
        
        this.jumps = 0;
        this.maxJumps = 2;
        
        this.weapon = WEAPON_PISTOL;
        this.shootCooldown = 0;
        this.maxCooldown = 20;
        
        this.dashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        
        this.invincible = false;
        this.invincibleTimer = 0;
    }

    update(p) {
        // Handle dash physics override
        if (this.dashing) {
            this.vx = this.facing * 15;
            this.vy = 0;
            this.dashTimer--;
            this.x += this.vx; // Manual move
            if (this.dashTimer <= 0) {
                this.dashing = false;
                this.vx = 0;
            }
        } else {
            // Normal Physics
            applyPhysics(this);
            
            // Move X
            this.x += this.vx;
            // Wall collisions (simple clamp)
            if (this.x < 0) { this.x = 0; this.vx = 0; }
            if (this.x + this.width > CANVAS_WIDTH) { this.x = CANVAS_WIDTH - this.width; this.vx = 0; }

            // Move Y & Resolve Platforms
            this.y += this.vy;
            resolvePlatformCollisions(this);
            
            if (this.onGround) {
                this.jumps = 0;
            }
        }

        // Timers
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Smoke check
        if (this.y + this.height > gameState.smokeY) {
            this.takeDamage(1); // DoT from smoke
        }
        
        // Death check
        if (this.health <= 0) {
            this.dead = true;
            gameState.gamePhase = PHASE_GAME_OVER_LOSE;
            createExplosion(p, this.x + this.width/2, this.y + this.height/2, 20, [255, 0, 0]);
        }
    }

    moveLeft() {
        if (this.dashing) return;
        this.vx -= this.speed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;
        this.facing = -1;
    }

    moveRight() {
        if (this.dashing) return;
        this.vx += this.speed;
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        this.facing = 1;
    }

    jump() {
        if (this.dashing) return;
        if (this.jumps < this.maxJumps) {
            this.vy = this.jumpForce;
            this.jumps++;
            this.onGround = false;
            // Spawn dust particles
            createExplosion(window.gameInstance, this.x + this.width/2, this.y + this.height, 5, [200, 200, 200]);
        }
    }

    dash() {
        if (this.dashCooldown <= 0 && !this.dashing) {
            this.dashing = true;
            this.dashTimer = 10; // Frames
            this.dashCooldown = 60; // 1 sec
            this.invincible = true;
            this.invincibleTimer = 15;
            createExplosion(window.gameInstance, this.x + this.width/2, this.y + this.height/2, 10, [0, 255, 255]);
        }
    }

    tryShoot(p) {
        if (this.shootCooldown <= 0) {
            let offsetXY = { x: this.x + this.width/2 + (this.facing * 20), y: this.y + this.height/3 };
            
            switch(this.weapon) {
                case WEAPON_PISTOL:
                    new Projectile(offsetXY.x, offsetXY.y, this.facing * 12, 0, "PLAYER", 10, 60, [255, 255, 0]);
                    this.shootCooldown = 15;
                    break;
                case WEAPON_SHOTGUN:
                    for(let i=-1; i<=1; i++) {
                        new Projectile(offsetXY.x, offsetXY.y, this.facing * 10, i * 2, "PLAYER", 8, 40, [255, 100, 0]);
                    }
                    this.shootCooldown = 40;
                    break;
                case WEAPON_LASER:
                    new Projectile(offsetXY.x, offsetXY.y, this.facing * 18, 0, "PLAYER", 25, 80, [0, 255, 255], true); // piercing
                    this.shootCooldown = 25;
                    break;
            }
            // Recoil
            this.vx -= this.facing * 2;
        }
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 40;
        gameState.cameraShake = 5;
    }

    drawSprite(p) {
        // Flash if invincible
        if (this.invincible && Math.floor(p.frameCount / 4) % 2 === 0) return;

        // Draw Suit
        p.noStroke();
        // Body
        p.fill(this.dashing ? 100 : 50, 100, 200);
        p.rect(-10, -15, 20, 30, 4);
        // Head
        p.fill(200, 200, 200);
        p.circle(0, -18, 16);
        // Visor
        p.fill(0, 255, 200);
        p.rect(2, -22, 8, 6);
        // Gun Arm
        p.fill(80);
        p.rect(5, -5, 15, 6);
        // Legs (animate)
        p.fill(40, 40, 60);
        if (Math.abs(this.vx) > 0.5 && !this.onGround) {
            p.rect(-8, 15, 6, 8); // Jump pose
            p.rect(2, 10, 6, 6);
        } else if (Math.abs(this.vx) > 0.5) {
            // Run cycle
            let cycle = p.frameCount * 0.2;
            p.rect(-8, 15 + Math.sin(cycle)*4, 6, 8);
            p.rect(2, 15 + Math.cos(cycle)*4, 6, 8);
        } else {
            p.rect(-8, 15, 6, 8);
            p.rect(2, 15, 6, 8);
        }
    }
}

// --- Enemy ---
export class Enemy extends Entity {
    constructor(x, y, type_variant) {
        super(x, y, 30, 30, TYPE_ENEMY);
        this.variant = type_variant; // "SLIME", "BAT", "TURRET", "BOSS"
        this.hp = 30;
        this.points = 100;
        gameState.entities.push(this);
    }

    update(p) {
        const player = gameState.player;
        if (!player) return;

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        if (this.variant === "SLIME") {
            // Patrol platform
            this.vx = this.facing * 2;
            applyPhysics(this);
            this.x += this.vx;
            this.y += this.vy;
            resolvePlatformCollisions(this);
            
            // Turn around at edges or walls
            if (this.vx === 0) this.facing *= -1;
            // Check for ledge (raycast down ahead)
            let aheadX = this.x + this.width/2 + (this.facing * (this.width/2 + 5));
            let ledgeFound = true;
            // Simple check: is there a platform under the point ahead?
            // Just turn around randomly for simplicity in this complexity budget
            if (p.frameCount % 100 === 0) this.facing *= -1;

        } else if (this.variant === "BAT") {
            // Fly towards player if close
            if (distToPlayer < 300) {
                let angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angle) * 3;
                this.vy = Math.sin(angle) * 3;
                this.facing = this.vx > 0 ? 1 : -1;
            } else {
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
            this.x += this.vx;
            this.y += this.vy;
        } else if (this.variant === "TURRET") {
            // Static, shoots
            if (distToPlayer < 400 && p.frameCount % 120 === 0) {
                let angle = Math.atan2(player.y - this.y, player.x - this.x);
                let speed = 6;
                new Projectile(this.x + this.width/2, this.y + this.height/2, 
                    Math.cos(angle)*speed, Math.sin(angle)*speed, 
                    "ENEMY", 10, 100, [255, 0, 0]);
            }
        }

        if (this.y > gameState.smokeY + 200) {
            this.dead = true; // Despawn if deep in smoke
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        createExplosion(window.gameInstance, this.x + this.width/2, this.y + this.height/2, 5, [255, 255, 255]);
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        gameState.score += this.points;
        createExplosion(window.gameInstance, this.x + this.width/2, this.y + this.height/2, 15, [100, 255, 100]);
        // Drop chance
        if (Math.random() < 0.2) {
            new Collectible(this.x, this.y, "HEALTH");
        } else if (Math.random() < 0.1) {
            let weapons = [WEAPON_SHOTGUN, WEAPON_LASER, WEAPON_PISTOL];
            let w = weapons[Math.floor(Math.random()*weapons.length)];
            new Collectible(this.x, this.y, w);
        }
    }

    drawSprite(p) {
        if (this.variant === "SLIME") {
            p.fill(100, 255, 100);
            p.arc(0, 15, 30, 30, p.PI, 0, p.CHORD);
            p.fill(0);
            p.rect(5, 5, 5, 5);
            p.rect(-10, 5, 5, 5);
        } else if (this.variant === "BAT") {
            p.fill(150, 50, 200);
            p.triangle(-15, -5, 15, -5, 0, 10);
            p.fill(255);
            p.circle(-5, 0, 4);
            p.circle(5, 0, 4);
            // Flapping wings
            let wingY = Math.sin(p.frameCount * 0.5) * 10;
            p.fill(100, 40, 150);
            p.triangle(-15, -5, -30, -15 + wingY, -15, 10);
            p.triangle(15, -5, 30, -15 + wingY, 15, 10);
        } else if (this.variant === "TURRET") {
            p.fill(100);
            p.rect(-15, -15, 30, 30);
            p.fill(255, 0, 0);
            p.circle(0, 0, 10); // eye
        }
    }
}

// --- Projectile ---
export class Projectile extends Entity {
    constructor(x, y, vx, vy, owner, damage, life, color, piercing = false) {
        super(x, y, 8, 8, TYPE_PROJECTILE);
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.damage = damage;
        this.life = life;
        this.color = color;
        this.piercing = piercing;
        gameState.entities.push(this);
    }

    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.dead = true;
        
        // Wall collision
        // Simple check against platforms
        // For performance, maybe skip or use very broad check
        // Let's destroy on platform hit
        for (let plat of gameState.platforms) {
            if (checkAABB(this, plat)) {
                this.dead = true;
                createExplosion(p, this.x, this.y, 3, this.color);
                break;
            }
        }
    }

    hit() {
        if (!this.piercing) this.dead = true;
    }

    drawSprite(p) {
        p.fill(this.color);
        p.circle(0, 0, 8);
    }
}

// --- Collectible ---
export class Collectible extends Entity {
    constructor(x, y, subtype) {
        super(x, y, 20, 20, TYPE_COLLECTIBLE);
        this.subtype = subtype; // "HEALTH" or WEAPON_CONST
        gameState.entities.push(this);
    }

    update(p) {
        // Bobbing
        this.y += Math.sin(p.frameCount * 0.1) * 0.5;
    }

    collect(player) {
        if (this.dead) return;
        this.dead = true;
        
        if (this.subtype === "HEALTH") {
            player.health = Math.min(player.health + 25, player.maxHealth);
            gameState.score += 50;
        } else {
            player.weapon = this.subtype;
            gameState.score += 100;
        }
        // Sound effect visual
        createExplosion(window.gameInstance, this.x, this.y, 20, [255, 255, 0]);
    }

    drawSprite(p) {
        p.noStroke();
        if (this.subtype === "HEALTH") {
            p.fill(255);
            p.rect(-10, -10, 20, 20);
            p.fill(255, 0, 0);
            p.rect(-3, -8, 6, 16);
            p.rect(-8, -3, 16, 6);
        } else {
            p.fill(0, 200, 255);
            p.circle(0, 0, 20);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.text(this.subtype.charAt(0), 0, 0);
        }
    }
}

// --- Particle ---
export class Particle {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30 + Math.random() * 20;
        this.type = TYPE_PARTICLE;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.95;
    }

    render(p, camY) {
        if (this.life <= 0) return;
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 4);
        p.circle(this.x, this.y - camY, this.size);
    }
}

export function createExplosion(p, x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, Math.random() * 5 + 2, color));
    }
}

// --- Platform Class for reference in global arrays ---
export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = TYPE_PLATFORM;
    }
    // No update needed for static platforms
}