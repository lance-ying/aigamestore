/**
 * Cavern Tale - Entities
 * Defines Player, Enemy, Projectile, and Collectible classes.
 * Contains core game logic for interactions.
 */

import { gameState, TILE_SIZE, GRAVITY, FRICTION, TERMINAL_VELOCITY, ENTITY_TYPES, PALETTE } from './globals.js';
import { resolveMapCollision, checkEntityCollision, checkSpecialTileCollision } from './physics.js';
import { KEYS, isKeyDown, isKeyJustPressed } from './input.js';
import { createExplosion, createSpark, createDamageNumber, createLevelUpText } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Base Entity Class
class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.color = [255, 255, 255];
    }

    update() {
        // Base update logic usually overridden
    }

    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ------------------------------------------------------------------
// PLAYER CLASS
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 16, 24, ENTITY_TYPES.PLAYER); // Slightly smaller than tile
        
        // Stats
        this.maxHealth = 20;
        this.health = 20;
        this.invincibleTimer = 0;
        
        // Weapon
        this.weaponLevel = 1;
        this.weaponXP = 0;
        this.weaponMaxXP = 10;
        this.shootCooldown = 0;
        
        // Movement state
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.aimUp = false;
        
        // Movement constants
        this.speed = 4;
        this.jumpForce = -9.5;
        
        gameState.player = this;
        gameState.entities.push(this);
    }

    update(p) {
        this.handleInput(p);
        this.applyPhysics();
        this.checkInteractions();
        this.updateTimers();
    }

    handleInput(p) {
        // Check for automated testing input override
        const autoAction = get_automated_testing_action(gameState);
        
        let left = isKeyDown(KEYS.LEFT);
        let right = isKeyDown(KEYS.RIGHT);
        let up = isKeyDown(KEYS.UP);
        let jump = isKeyJustPressed(KEYS.SPACE, p.frameCount);
        let shoot = isKeyJustPressed(KEYS.Z, p.frameCount) || (isKeyDown(KEYS.Z) && this.weaponLevel === 3 && p.frameCount % 10 === 0); // Auto fire at lvl 3
        let shift = isKeyDown(KEYS.SHIFT); // Lock direction

        // Override with automated inputs if available
        if (autoAction) {
            if (autoAction.left) left = true;
            if (autoAction.right) right = true;
            if (autoAction.jump) jump = true;
            if (autoAction.shoot) shoot = true;
            if (autoAction.up) up = true;
        }

        // Horizontal Movement
        if (left) {
            this.vx = -this.speed;
            if (!shift) this.facing = -1;
        } else if (right) {
            this.vx = this.speed;
            if (!shift) this.facing = 1;
        } else {
            this.vx = 0;
        }

        // Aiming
        this.aimUp = up;

        // Jumping
        if (jump && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            // Spawn jump particles
            createSpark(this.x + this.width/2, this.y + this.height);
        }
        
        // Variable jump height (release space to fall faster)
        if (!isKeyDown(KEYS.SPACE) && !autoAction?.jump && this.vy < -3) {
            this.vy *= 0.5;
        }

        // Shooting
        if (shoot && this.shootCooldown <= 0) {
            this.shoot();
        }
    }

    applyPhysics() {
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        resolveMapCollision(this);
    }

    checkInteractions() {
        // Spikes and Hazards
        const special = checkSpecialTileCollision(this);
        if (special === 'SPIKE') {
            this.takeDamage(10); // Spikes hurt a lot
            this.vy = -5; // Bounce
        } else if (special === 'DOOR') {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    updateTimers() {
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
    }

    shoot() {
        this.shootCooldown = 15 - (this.weaponLevel * 2); // Faster fire at higher levels
        
        let bx = this.x + this.width/2;
        let by = this.y + this.height/2;
        let bvx = 0;
        let bvy = 0;
        const speed = 8;

        if (this.aimUp) {
            by = this.y - 4;
            bvy = -speed;
            // Spread for level 3
            if (this.weaponLevel >= 3) {
                 new Projectile(bx, by, -1, -speed);
                 new Projectile(bx, by, 1, -speed);
            }
        } else {
            bx = this.facing === 1 ? this.x + this.width : this.x - 8;
            bvx = this.facing * speed;
            if (this.weaponLevel >= 3) {
                new Projectile(bx, by, bvx, -1);
                new Projectile(bx, by, bvx, 1);
            }
        }
        
        new Projectile(bx, by, bvx, bvy);
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;
        
        this.health -= amount;
        this.invincibleTimer = 60; // 1 second invincibility
        createDamageNumber(this.x, this.y, amount);
        
        // Weapon XP Loss
        if (this.weaponXP > 0) {
            this.weaponXP = Math.max(0, this.weaponXP - 5);
        } else if (this.weaponLevel > 1) {
            this.weaponLevel--;
            this.weaponXP = this.weaponMaxXP * 0.75; // Drop to 75% of previous level
            createLevelUpText(this.x, this.y - 20); // Reuse logic but say "LEVEL DOWN" ideally, but for now ok
        }
        
        // Knockback
        this.vy = -4;
        this.vx = -this.facing * 5;

        if (this.health <= 0) {
            this.die();
        }
    }
    
    addXP(amount) {
        if (this.weaponLevel >= 3 && this.weaponXP >= this.weaponMaxXP) return; // Max level cap
        
        this.weaponXP += amount;
        if (this.weaponXP >= this.weaponMaxXP) {
            if (this.weaponLevel < 3) {
                this.weaponLevel++;
                this.weaponXP = 0;
                this.weaponMaxXP = this.weaponMaxXP * 1.5;
                createLevelUpText(this.x, this.y);
                this.health = this.maxHealth; // Heal on level up
            } else {
                this.weaponXP = this.weaponMaxXP;
            }
        }
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        createExplosion(this.x, this.y, 50, PALETTE.PLAYER_CAP);
    }

    render(p) {
        if (this.invincibleTimer > 0 && p.frameCount % 4 < 2) return; // Blink effect

        p.push();
        // Quote Body
        p.fill(PALETTE.PLAYER);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Red Cap
        p.fill(PALETTE.PLAYER_CAP);
        p.rect(this.x, this.y, this.width, 6);
        p.rect(this.facing === 1 ? this.x + 10 : this.x - 2, this.y + 3, 8, 3); // Bill
        
        // Scarf
        p.fill(PALETTE.PLAYER_SCARF);
        p.rect(this.x + (this.facing === 1 ? -2 : 12), this.y + 12, 6, 4); 

        // Eyes
        p.fill(0);
        if (this.aimUp) {
            p.rect(this.x + 4, this.y + 4, 2, 4);
            p.rect(this.x + 10, this.y + 4, 2, 4);
        } else {
            const eyeX = this.facing === 1 ? this.x + 8 : this.x + 2;
            p.rect(eyeX, this.y + 8, 2, 4);
        }
        
        // Gun
        p.fill(50);
        if (this.aimUp) {
            p.rect(this.x + 6, this.y - 4, 4, 10);
        } else {
            p.rect(this.facing === 1 ? this.x + 10 : this.x - 6, this.y + 12, 12, 4);
        }
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// PROJECTILE CLASS
// ------------------------------------------------------------------
export class Projectile extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 6, 6, ENTITY_TYPES.PROJECTILE);
        this.vx = vx;
        this.vy = vy;
        this.lifetime = 40; // Range limit
        
        // Size based on weapon level
        if (gameState.player.weaponLevel >= 2) {
            this.width = 10;
            this.height = 10;
            this.lifetime = 50;
        }
        
        gameState.projectiles.push(this);
        gameState.entities.push(this);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;

        // Map Collision
        if (checkMapCollision(this.x, this.y, this.width, this.height)) {
            this.destroy();
            createSpark(this.x, this.y);
            return;
        }

        // Enemy Collision
        for (let enemy of gameState.enemies) {
            if (checkEntityCollision(this, enemy)) {
                enemy.takeDamage(gameState.player.weaponLevel * 2); // 2, 4, 6 dmg
                this.destroy();
                createExplosion(this.x, this.y, 3, PALETTE.BULLET);
                return;
            }
        }

        if (this.lifetime <= 0) this.destroy();
    }
    
    destroy() {
        this.active = false;
        // Cleanup handled by game loop filter
    }

    render(p) {
        p.fill(PALETTE.BULLET);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ------------------------------------------------------------------
// ENEMY CLASSES
// ------------------------------------------------------------------
export class Enemy extends Entity {
    constructor(x, y, w, h, hp) {
        super(x, y, w, h, ENTITY_TYPES.ENEMY);
        this.health = hp;
        this.damage = 5;
        gameState.enemies.push(this);
        gameState.entities.push(this);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        } else {
            // Flash white effect could be done here with a timer
        }
    }

    die() {
        this.active = false;
        createExplosion(this.x + this.width/2, this.y + this.height/2, 15, this.color);
        
        // Drop XP
        const dropCount = Math.floor(Math.random() * 3) + 1;
        for(let i=0; i<dropCount; i++) {
            new Collectible(this.x + this.width/2, this.y + this.height/2);
        }
        
        gameState.score += 100;
    }

    checkPlayerCollision() {
        if (gameState.player && checkEntityCollision(this, gameState.player)) {
            gameState.player.takeDamage(this.damage);
        }
    }
}

export class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 16, 10);
        this.color = PALETTE.ENEMY_BAT;
        this.startX = x;
        this.startY = y;
        this.angle = 0;
    }

    update() {
        // Sine wave flight pattern
        this.angle += 0.1;
        this.y = this.startY + Math.sin(this.angle) * 30;
        
        // Move towards player slowly if close
        if (gameState.player) {
            const dist = Math.abs(gameState.player.x - this.x);
            if (dist < 200) {
                if (gameState.player.x > this.x) this.x += 1;
                else this.x -= 1;
            }
        }
        
        this.checkPlayerCollision();
    }
    
    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
        // Wings
        const wingOffset = Math.sin(this.angle * 2) * 5;
        p.rect(this.x - 5, this.y + wingOffset, 5, 10);
        p.rect(this.x + this.width, this.y + wingOffset, 5, 10);
    }
}

export class Critter extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 15);
        this.color = PALETTE.ENEMY_CRITTER;
        this.onGround = false;
        this.timer = 0;
        this.jumpWait = 60 + Math.random() * 60;
    }

    update() {
        this.vy += GRAVITY;
        resolveMapCollision(this);
        
        if (this.onGround) {
            this.vx = 0;
            this.timer++;
            if (this.timer > this.jumpWait) {
                // Jump towards player
                this.vy = -8;
                if (gameState.player) {
                    this.vx = gameState.player.x > this.x ? 3 : -3;
                } else {
                    this.vx = Math.random() > 0.5 ? 3 : -3;
                }
                this.timer = 0;
                this.onGround = false;
            }
        }
        
        this.checkPlayerCollision();
    }
    
    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
        // Eyes
        p.fill(255);
        p.rect(this.x + 4, this.y + 4, 4, 4);
        p.rect(this.x + 12, this.y + 4, 4, 4);
    }
}

// ------------------------------------------------------------------
// COLLECTIBLE CLASS
// ------------------------------------------------------------------
export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 12, 12, ENTITY_TYPES.COLLECTIBLE);
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -3; // Pop up
        this.bounceCount = 0;
        this.value = 5;
    }

    update() {
        this.vy += GRAVITY;
        
        // Simple bouncing physics against map
        let nextY = this.y + this.vy;
        if (checkMapCollision(this.x, nextY, this.width, this.height)) {
             this.vy *= -0.6;
             this.vx *= 0.9; // Friction
             if (Math.abs(this.vy) < 1) this.vy = 0;
        } else {
            this.y += this.vy;
        }
        
        this.x += this.vx;
        // Wall bounce
        if (checkMapCollision(this.x, this.y, this.width, this.height)) {
            this.x -= this.vx;
            this.vx *= -1;
        }

        // Collection
        if (gameState.player && checkEntityCollision(this, gameState.player)) {
            gameState.player.addXP(this.value);
            this.active = false;
            // create sparkle
            createSpark(this.x, this.y);
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.rotate(p.frameCount * 0.1);
        p.fill(PALETTE.EXP_TRIANGLE);
        p.triangle(0, -6, 6, 6, -6, 6);
        p.pop();
    }
}