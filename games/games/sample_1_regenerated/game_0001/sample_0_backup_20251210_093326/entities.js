/**
 * entities.js
 * Defines all game objects: Player, Enemies, Projectiles, Teleporter.
 */

import { 
    COLORS, GRAVITY, FRICTION, AIR_RESISTANCE, PLAYER_SPEED, 
    PLAYER_JUMP_FORCE, PLAYER_MAX_HEALTH, gameState, INVULNERABILITY_FRAMES,
    CANVAS_HEIGHT, CANVAS_WIDTH
} from './globals.js';
import { isKeyDown, wasKeyPressed, KEYS } from './input.js';
import { resolveMapCollision, checkAABB } from './physics.js';
import { spawnParticles, FloatingText } from './particles.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.type = type; // 'PLAYER', 'ENEMY', 'PROJECTILE', 'OBJECT'
        this.active = true;
        this.grounded = false;
        this.facing = 1; // 1 = Right, -1 = Left
    }

    update() {
        // Base physics
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
    }

    render(p) {
        // Placeholder render
        p.fill(255);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ------------------------------------------------------------------
// Player Class
// ------------------------------------------------------------------

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 32, 'PLAYER');
        this.health = PLAYER_MAX_HEALTH;
        this.invulnTimer = 0;
        this.weapon = 'BLASTER'; // BLASTER, SPREAD
        this.shootCooldown = 0;
        this.animFrame = 0;
        this.aimUp = false;
    }

    update(p) {
        // 1. Input Handling
        this.handleInput();

        // 2. Physics & Collision
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        
        // Map Collision
        resolveMapCollision(this);

        // Friction
        if (this.grounded) {
            this.vx *= FRICTION;
        } else {
            this.vx *= AIR_RESISTANCE;
        }

        // Screen Boundaries (Left/Bottom)
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.y > CANVAS_HEIGHT + 100) { this.die(); } // Fall death

        // 3. Timers
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invulnTimer > 0) this.invulnTimer--;

        // 4. Animation logic
        if (Math.abs(this.vx) > 0.5) {
            this.animFrame += 0.2;
        } else {
            this.animFrame = 0;
        }

        // TEST_2 God Mode Logic
        if (gameState.controlMode === 'TEST_2') {
            this.health = PLAYER_MAX_HEALTH;
            this.shootCooldown = 0; // Rapid fire
        }
    }

    handleInput() {
        // Movement
        if (isKeyDown(KEYS.LEFT)) {
            this.vx -= 0.5;
            if (this.vx < -PLAYER_SPEED) this.vx = -PLAYER_SPEED;
            this.facing = -1;
        }
        if (isKeyDown(KEYS.RIGHT)) {
            this.vx += 0.5;
            if (this.vx > PLAYER_SPEED) this.vx = PLAYER_SPEED;
            this.facing = 1;
        }
        
        // Aiming
        this.aimUp = isKeyDown(KEYS.UP);
        
        // Jump
        if (wasKeyPressed(KEYS.SPACE) && this.grounded) {
            this.vy = PLAYER_JUMP_FORCE;
            this.grounded = false;
            spawnParticles(this.x + this.width/2, this.y + this.height, 'JUMP_DUST', 5);
        }

        // Shooting
        if (isKeyDown(KEYS.Z) && this.shootCooldown <= 0) {
            this.shoot();
        }

        // Weapon Switch
        if (wasKeyPressed(KEYS.SHIFT)) {
            this.switchWeapon();
        }
    }

    shoot() {
        // Determine muzzle position
        let mx, my;
        let dirX = 0, dirY = 0;

        if (this.aimUp) {
            mx = this.x + this.width / 2;
            my = this.y - 10;
            dirY = -1;
        } else {
            mx = this.facing === 1 ? this.x + this.width + 5 : this.x - 5;
            my = this.y + this.height / 2;
            dirX = this.facing;
        }

        if (this.weapon === 'BLASTER') {
            new Projectile(mx, my, dirX, dirY, 'PLAYER_BASIC');
            this.shootCooldown = 15;
        } else if (this.weapon === 'SPREAD') {
            new Projectile(mx, my, dirX, dirY, 'PLAYER_BASIC');
            if (this.aimUp) {
                new Projectile(mx, my, -0.3, -0.9, 'PLAYER_BASIC');
                new Projectile(mx, my, 0.3, -0.9, 'PLAYER_BASIC');
            } else {
                new Projectile(mx, my, dirX, -0.3, 'PLAYER_BASIC');
                new Projectile(mx, my, dirX, 0.3, 'PLAYER_BASIC');
            }
            this.shootCooldown = 25;
        }
        
        // Recoil
        if (!this.grounded) {
            if (dirY === -1) this.vy += 2;
            else this.vx -= dirX * 1;
        }
    }

    switchWeapon() {
        this.weapon = this.weapon === 'BLASTER' ? 'SPREAD' : 'BLASTER';
        gameState.particles.push(new FloatingText(this.x, this.y - 20, this.weapon, [200, 200, 255]));
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return;
        
        this.health -= amount;
        this.invulnTimer = INVULNERABILITY_FRAMES;
        gameState.cameraShake = 10;
        
        gameState.particles.push(new FloatingText(this.x, this.y, `-${amount}`, [255, 0, 0]));
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'GLITCH', 10);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        spawnParticles(this.x, this.y, 'EXPLOSION', 30);
        this.active = false;
        gameState.gamePhase = 'GAME_OVER_LOSE';
    }

    render(p) {
        if (!this.active) return;

        // Flicker if invulnerable
        if (this.invulnTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) return;

        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);

        // Draw Body (Frog)
        p.fill(COLORS.PLAYER);
        p.stroke(0);
        p.strokeWeight(2);
        
        // Bobbing animation
        const bob = Math.sin(this.animFrame) * 2;
        p.rectMode(p.CENTER);
        p.rect(0, bob, this.width, this.height, 5);

        // Eyes
        p.fill(255);
        p.ellipse(0, -12 + bob, 12, 12); // Big single eye style or two eyes? Let's do two.
        p.ellipse(-6, -14 + bob, 10, 10);
        p.ellipse(6, -14 + bob, 10, 10);
        p.fill(0);
        p.ellipse(this.aimUp ? -6 : -4, this.aimUp ? -16 : -14 + bob, 3, 3);
        p.ellipse(this.aimUp ? 6 : 8, this.aimUp ? -16 : -14 + bob, 3, 3);

        // Gun
        p.fill(150);
        if (this.aimUp) {
            p.rect(8, -5 + bob, 6, 15);
        } else {
            p.rect(10, 5 + bob, 15, 6);
        }

        p.pop();
    }
}

// ------------------------------------------------------------------
// Enemies
// ------------------------------------------------------------------

export class Enemy extends Entity {
    constructor(x, y, w, h, subType) {
        super(x, y, w, h, 'ENEMY');
        this.subType = subType;
        this.health = 20;
        this.damage = 10;
        gameState.entities.push(this);
    }

    update(p) {
        super.update();
        resolveMapCollision(this);

        // Collide with player
        if (gameState.player && gameState.player.active && checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(this.damage);
        }

        // Check death
        if (this.y > CANVAS_HEIGHT + 100) this.active = false;
    }

    takeDamage(amount) {
        this.health -= amount;
        gameState.particles.push(new FloatingText(this.x, this.y, amount, [255, 255, 255]));
        if (this.health <= 0) {
            this.die();
        } else {
            // Flash color? Handled in render maybe
        }
    }

    die() {
        this.active = false;
        gameState.score += 100;
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'GLITCH', 8);
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'EXPLOSION', 5);
    }
}

export class Slime extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 20, 'SLIME');
        this.color = COLORS.ENEMY_SLIME;
        this.vx = -1;
    }

    update(p) {
        super.update(p);
        
        // Simple patrol AI
        if (this.vx === 0) { // Hit a wall
            this.vx = this.facing * -1; // Flip momentum?
            // Actually vx would be 0 from resolveMapCollision
            // We need to store desired direction
        }
        
        // Check for edges
        // Look ahead
        const lookAheadX = this.x + (this.width/2) + (this.vx * 20);
        if (!resolveMapCollision({x: lookAheadX, y: this.y + this.height + 2, width: 1, height: 1}).grounded && !this.grounded) {
             // Currently resolveMapCollision modifies state. We need a purely query function.
             // Using isOverlappingMap from physics
        }
        
        // Simplification: Turn around on walls is handled by 
        // collision setting vx to 0. 
        if (Math.abs(this.vx) < 0.1) {
             this.facing *= -1;
             this.vx = this.facing;
        } else {
             this.facing = Math.sign(this.vx);
             this.vx = this.facing * 1.5;
        }
    }

    render(p) {
        p.fill(this.color);
        p.noStroke();
        // Slime wobble
        const wobble = Math.sin(p.frameCount * 0.2) * 2;
        p.rect(this.x - wobble, this.y + wobble, this.width + wobble*2, this.height - wobble);
        // Eyes
        p.fill(255);
        p.rect(this.x + 5, this.y + 5, 5, 5);
        p.rect(this.x + 20, this.y + 5, 5, 5);
    }
}

export class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 'BAT');
        this.color = COLORS.ENEMY_FLYER;
        this.startY = y;
        this.xOffset = Math.random() * 100;
    }

    update(p) {
        // No gravity for bats
        this.x -= 2; // Move left constantly
        this.y = this.startY + Math.sin((this.x + this.xOffset) * 0.05) * 30;
        
        // Collide with player logic in base
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(this.damage);
        }

        // Despawn
        if (this.x < gameState.cameraX - 100) this.active = false;
    }

    render(p) {
        p.fill(this.color);
        p.beginShape();
        p.vertex(this.x, this.y);
        p.vertex(this.x + 10, this.y + 10);
        p.vertex(this.x + 20, this.y);
        p.vertex(this.x + 10, this.y + 20);
        p.endShape(p.CLOSE);
    }
}

// ------------------------------------------------------------------
// Projectile
// ------------------------------------------------------------------

export class Projectile extends Entity {
    constructor(x, y, dirX, dirY, type) {
        super(x, y, 8, 8, 'PROJECTILE');
        this.dirX = dirX;
        this.dirY = dirY;
        
        // Normalize vector
        const mag = Math.sqrt(dirX*dirX + dirY*dirY);
        if (mag !== 0) {
            this.dirX /= mag;
            this.dirY /= mag;
        }

        this.speed = 10;
        this.vx = this.dirX * this.speed;
        this.vy = this.dirY * this.speed;
        this.damage = 10;
        this.life = 60; // Frames

        gameState.projectiles.push(this);
    }

    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Check Wall Collision
        if (resolveMapCollision(this) /* checks geometry */ ) {
             // Actually resolveMapCollision modifies position, which is weird for bullets.
             // We just want to check overlap.
        }
        // Custom check for walls to destroy bullet
        if (resolveMapCollision.grounded || this.vx === 0 || this.vy === 0) {
            // This relies on the physics function setting velocity to 0 on hit
            // But we didn't call it yet.
            // Let's just use isOverlappingMap for destruction
        }
        
        // Manual check for simplicity
        if (this.x < 0 || this.y > CANVAS_HEIGHT + 100) this.active = false;

        // Check Enemy Collision
        const enemies = gameState.entities.filter(e => e.type === 'ENEMY' && e.active);
        for (const enemy of enemies) {
            if (checkAABB(this, enemy)) {
                enemy.takeDamage(this.damage);
                this.active = false;
                spawnParticles(this.x, this.y, 'SPARK', 3);
                break;
            }
        }
    }

    render(p) {
        p.fill(COLORS.PROJECTILE_PLAYER);
        p.noStroke();
        p.circle(this.x + 4, this.y + 4, 8);
    }
}

// ------------------------------------------------------------------
// Teleporter (Goal)
// ------------------------------------------------------------------

export class Teleporter extends Entity {
    constructor(x, y) {
        super(x, y, 60, 80, 'OBJECT');
        gameState.entities.push(this);
    }

    update(p) {
        // Check collision with player
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.gamePhase = 'GAME_OVER_WIN';
            Logger.logGameInfo(p, { event: "LEVEL_COMPLETE" });
        }
    }

    render(p) {
        p.fill(COLORS.TELEPORTER);
        p.stroke(255);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Tech details
        p.fill(0, 0, 50);
        p.rect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
        
        // Oscillating energy
        const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
        p.fill(0, 255, 255, alpha);
        p.rect(this.x + 15, this.y + 15, this.width - 30, this.height - 30);
    }
}