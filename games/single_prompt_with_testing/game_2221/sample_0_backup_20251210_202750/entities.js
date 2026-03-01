/**
 * entities.js
 * Contains all game entity classes: Player, Enemy, Platform, Projectile, Collectible.
 */

import { gameState, GRAVITY, FRICTION, TERMINAL_VELOCITY, KEYS, COLORS } from './globals.js';
import { isKeyDown, isKeyPressed } from './input.js';
import { resolvePlatformCollisions, rayCastPlatforms, checkAABB } from './physics.js';
import { spawnExplosion, spawnSparks, spawnDust, FloatingText } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Base Entity Class
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.isDead = false;
        this.facing = 1; // 1 = Right, -1 = Left
    }

    update() {
        this.lastX = this.x;
        this.lastY = this.y;
    }

    render(p) {
        // Override in subclasses
        p.fill(255);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ------------------------------------------------------------------
// PLAYER CLASS
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 44);
        
        // Stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.energy = 100; // For special moves
        
        // Physics Tuning
        this.moveSpeed = 0.5;
        this.maxSpeed = 6;
        this.jumpForce = -11;
        this.wallSlideSpeed = 2;
        
        // State Machine
        this.state = "IDLE"; // IDLE, RUN, JUMP, FALL, ATTACK, GRAPPLE, HURT
        this.stateTimer = 0;
        this.invincibleTimer = 0;
        
        // Combat
        this.attackCombo = 0;
        this.attackCooldown = 0;
        this.hitbox = { x: 0, y: 0, w: 0, h: 0, active: false };
        
        // Grapple
        this.grappleTarget = null; // {x, y, entity}
        this.grappleState = "NONE"; // NONE, EXTENDING, PULLING
        this.grappleLength = 0;
        this.maxGrappleLen = 250;
        
        gameState.player = this;
    }

    update(p) {
        super.update();
        
        if (this.isDead) return;

        // Input Handling (Human vs Bot)
        let input = {
            left: false, right: false, up: false, down: false,
            jump: false, jumpHold: false, attack: false, grapple: false
        };

        if (gameState.controlMode === "HUMAN") {
            input.left = isKeyDown(KEYS.LEFT);
            input.right = isKeyDown(KEYS.RIGHT);
            input.up = isKeyDown(KEYS.UP);
            input.down = isKeyDown(KEYS.DOWN);
            input.jump = isKeyPressed(KEYS.SPACE);
            input.jumpHold = isKeyDown(KEYS.SPACE);
            input.attack = isKeyPressed(KEYS.Z);
            input.grapple = isKeyPressed(KEYS.SHIFT);
        } else {
            // Automated Testing Controller
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) input.left = true;
                if (action.right) input.right = true;
                if (action.up) input.up = true;
                if (action.down) input.down = true;
                if (action.jump) input.jump = true;
                if (action.attack) input.attack = true;
            }
        }

        // --- Physics & Logic ---
        
        // Horizontal Movement
        if (this.state !== "GRAPPLE" && this.state !== "HURT") {
            if (input.left) {
                this.vx -= this.moveSpeed;
                this.facing = -1;
            }
            if (input.right) {
                this.vx += this.moveSpeed;
                this.facing = 1;
            }
            
            // Friction
            if (!input.left && !input.right) {
                this.vx *= FRICTION;
            }
            
            // Clamp speed
            this.vx = Math.max(Math.min(this.vx, this.maxSpeed), -this.maxSpeed);
        }

        // Gravity
        if (this.state !== "GRAPPLE") {
            this.vy += GRAVITY;
            this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
        }

        // Jump
        if (input.jump && this.onGround && this.state !== "HURT" && this.state !== "GRAPPLE") {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.state = "JUMP";
            spawnDust(this.x + this.width/2, this.y + this.height);
        }
        
        // Variable Jump Height
        if (!input.jumpHold && this.vy < -4) {
            this.vy *= 0.9;
        }

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // Collision Resolution
        if (this.state !== "GRAPPLE") {
            resolvePlatformCollisions(this, gameState.platforms);
        }

        // --- Combat System ---
        
        // Attack
        if (input.attack && this.attackCooldown <= 0) {
            this.performAttack();
        }
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Hitbox logic
        if (this.hitbox.active) {
            this.hitbox.timer--;
            if (this.hitbox.timer <= 0) this.hitbox.active = false;
            else this.checkAttackCollisions();
        }

        // Grapple Logic
        if (input.grapple && this.grappleState === "NONE") {
            this.fireGrapple(input);
        }
        this.updateGrapple();

        // State Updates
        this.updateState();
        
        // Invincibility
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        
        // Screen Bounds / Death
        if (this.y > CANVAS_HEIGHT + 100) {
            this.die();
        }
    }

    performAttack() {
        this.state = "ATTACK";
        this.attackCooldown = 20;
        this.vx = this.facing * 2; // Slight lunge
        
        // Define hitbox
        this.hitbox = {
            x: this.facing === 1 ? this.x + this.width : this.x - 40,
            y: this.y + 10,
            w: 40,
            h: 30,
            active: true,
            timer: 10,
            damage: 20
        };
        
        // FX
        spawnSparks(this.hitbox.x + this.hitbox.w/2, this.hitbox.y + this.hitbox.h/2, 3);
    }

    checkAttackCollisions() {
        for (let enemy of gameState.enemies) {
            if (!enemy.isDead && checkAABB(this.hitbox, enemy)) {
                enemy.takeDamage(this.hitbox.damage);
                this.hitbox.active = false; // Hit once per swing
                
                // Screen shake effect handled in render via random offset maybe, or global cam
                gameState.camera.shake = 5;
                spawnExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 5);
                break;
            }
        }
    }

    fireGrapple(input) {
        // Determine direction: Up, Diag, or Forward
        let dirX = this.facing;
        let dirY = 0;
        
        if (input.up) {
            dirY = -1;
            dirX = 0;
            if (input.right || input.left) {
                dirX = input.right ? 0.7 : -0.7;
                dirY = -0.7;
            }
        }
        
        // Raycast
        const center = { x: this.x + this.width/2, y: this.y + this.height/2 };
        
        // Check enemies first (Auto-lock logic simplified)
        let target = null;
        let minDist = this.maxGrappleLen;
        
        for (let e of gameState.enemies) {
            const dx = (e.x + e.width/2) - center.x;
            const dy = (e.y + e.height/2) - center.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Simple cone check
            const dot = (dx * dirX + dy * dirY) / dist;
            
            if (dist < this.maxGrappleLen && dot > 0.8) {
                if (dist < minDist) {
                    minDist = dist;
                    target = { x: e.x + e.width/2, y: e.y + e.height/2, entity: e, type: 'enemy' };
                }
            }
        }
        
        // If no enemy, check platforms
        if (!target) {
            target = rayCastPlatforms(center.x, center.y, dirX, dirY, this.maxGrappleLen, gameState.platforms);
        }
        
        if (target) {
            this.grappleTarget = target;
            this.grappleState = "EXTENDING";
            this.grappleLength = 0;
            spawnSparks(this.x, this.y, 2);
        }
    }

    updateGrapple() {
        if (this.grappleState === "NONE") return;
        
        const center = { x: this.x + this.width/2, y: this.y + this.height/2 };
        const dx = this.grappleTarget.x - center.x;
        const dy = this.grappleTarget.y - center.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (this.grappleState === "EXTENDING") {
            this.grappleLength += 25; // Speed of hook
            if (this.grappleLength >= dist) {
                this.grappleState = "PULLING";
                // If enemy, damage or stun
                if (this.grappleTarget.type === 'enemy') {
                    this.grappleTarget.entity.takeDamage(5);
                }
            }
        } else if (this.grappleState === "PULLING") {
            this.state = "GRAPPLE";
            this.vx = 0; 
            this.vy = 0;
            
            // Move player towards target
            const speed = 15;
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
            
            // Check if reached
            if (dist < 20) {
                this.grappleState = "NONE";
                this.state = "JUMP"; // Pop up after grapple
                this.vy = -5;
                if (this.grappleTarget.type === 'enemy') {
                    // Dash punch through enemy
                    this.performAttack();
                }
            }
        }
    }

    updateState() {
        if (this.state === "GRAPPLE") return;
        if (this.state === "ATTACK" && this.attackCooldown > 5) return;
        
        if (this.onGround) {
            if (Math.abs(this.vx) > 0.5) this.state = "RUN";
            else this.state = "IDLE";
        } else {
            if (this.vy < 0) this.state = "JUMP";
            else this.state = "FALL";
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0 || this.isDead) return;
        
        this.health -= amount;
        this.invincibleTimer = 60;
        this.vy = -5;
        this.vx = -this.facing * 5; // Knockback
        this.state = "HURT";
        
        // Log
        gameState.particles.push(new FloatingText(this.x, this.y - 20, `-${amount}`, [255, 50, 50]));
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.health = 0;
        spawnExplosion(this.x, this.y, 50);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        if (this.isDead) return;
        
        // Flicker if invincible
        if (this.invincibleTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) return;

        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        
        // Draw Hook Line
        if (this.grappleState !== "NONE") {
            p.stroke(COLORS.HOOK);
            p.strokeWeight(3);
            // Inverse transform for line end
            const tx = (this.grappleTarget.x - (this.x + this.width/2)) * this.facing;
            const ty = this.grappleTarget.y - (this.y + this.height/2);
            p.line(0, 0, tx, ty);
        }

        // --- Character Drawing (Primitive shapes style) ---
        p.noStroke();
        
        // Body
        p.fill(COLORS.PLAYER_MAIN);
        p.rect(-10, -15, 20, 30, 4);
        
        // Head
        p.fill(COLORS.PLAYER_ACCENT);
        p.rect(-8, -28, 16, 14, 2);
        
        // Visor
        p.fill(0);
        p.rect(0, -24, 8, 4);
        
        // Scarf/Cape Trail
        if (Math.abs(this.vx) > 1 || this.state === "JUMP") {
            p.fill(COLORS.HOOK);
            p.triangle(-10, -20, -25, -25 + Math.sin(p.frameCount * 0.5) * 5, -10, -15);
        }

        // Limbs based on state
        p.fill(COLORS.PLAYER_MAIN);
        if (this.state === "RUN") {
            const limbCycle = Math.sin(p.frameCount * 0.5) * 10;
            // Legs
            p.rect(-8 + limbCycle, 10, 6, 12);
            p.rect(2 - limbCycle, 10, 6, 12);
        } else if (this.state === "ATTACK") {
            // Punch arm
            p.fill(255);
            p.rect(5, -10, 25, 10); // Extended arm
        } else {
            // Idle legs
            p.rect(-8, 10, 6, 12);
            p.rect(2, 10, 6, 12);
        }
        
        // Hitbox Debug
        if (gameState.debugMode && this.hitbox.active) {
            p.noFill();
            p.stroke(255, 0, 0);
            p.rect(this.hitbox.x - (this.x + this.width/2), this.hitbox.y - (this.y + this.height/2), this.hitbox.w, this.hitbox.h);
        }

        p.pop();
    }
}

// ------------------------------------------------------------------
// ENEMY CLASS
// ------------------------------------------------------------------
export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // "WALKER", "FLYER"
        this.health = 40;
        this.speed = 1.5;
        this.patrolRange = 100;
        this.startX = x;
        this.damage = 10;
        
        gameState.enemies.push(this);
    }

    update() {
        super.update();
        if (this.isDead) return;

        if (this.type === "WALKER") {
            this.updateWalker();
        } else if (this.type === "FLYER") {
            this.updateFlyer();
        }
        
        // Collision with player (Touch damage)
        if (gameState.player && !gameState.player.isDead && checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(10);
        }
        
        // Check dead
        if (this.y > CANVAS_HEIGHT + 100) this.die();
    }

    updateWalker() {
        this.vx = this.speed * this.facing;
        this.vy += GRAVITY;
        
        // Move
        this.x += this.vx;
        this.y += this.vy;
        
        resolvePlatformCollisions(this, gameState.platforms);
        
        // Patrol Logic
        if (this.x > this.startX + this.patrolRange) this.facing = -1;
        if (this.x < this.startX - this.patrolRange) this.facing = 1;
        
        // Turn at walls
        if (Math.abs(this.vx) < 0.1 && this.onGround) this.facing *= -1;
    }

    updateFlyer() {
        // Sine wave hover
        this.y = this.startX + Math.sin(gameState.frameCount * 0.05) * 30;
        
        // Move towards player slowly
        if (gameState.player) {
            const dx = gameState.player.x - this.x;
            if (Math.abs(dx) < 200) {
                this.x += Math.sign(dx) * 0.5;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        spawnSparks(this.x + this.width/2, this.y + this.height/2);
        gameState.particles.push(new FloatingText(this.x, this.y - 10, `${amount}`, [255, 255, 255]));
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        gameState.score += 100;
        spawnExplosion(this.x + this.width/2, this.y + this.height/2, 15);
        
        // Remove from array
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.type === "WALKER") {
            p.fill(COLORS.ENEMY_MAIN);
            p.rectMode(p.CENTER);
            p.rect(0, 0, 30, 30, 5);
            // Eye
            p.fill(255);
            p.rect(5 * this.facing, -5, 10, 5);
            // Wheels
            p.fill(50);
            p.circle(-10, 15, 8);
            p.circle(10, 15, 8);
        } else {
            p.fill(COLORS.ENEMY_ACCENT);
            p.triangle(0, -15, -15, 10, 15, 10);
            // Eye
            p.fill(255, 0, 0);
            p.circle(0, 0, 8);
        }
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// WORLD OBJECTS
// ------------------------------------------------------------------

export class Platform {
    constructor(x, y, w, h, type = "SOLID") {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // SOLID, SEMISOLID
        gameState.platforms.push(this);
    }
    
    render(p) {
        p.fill(COLORS.PLATFORM);
        p.noStroke();
        p.rect(this.x, this.y, this.width, this.height);
        
        // Detail lines
        p.stroke(COLORS.BACKGROUND);
        p.strokeWeight(2);
        p.line(this.x, this.y, this.x + this.width, this.y);
        p.line(this.x, this.y + this.height, this.x + this.width, this.y + this.height);
    }
}

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.baseY = y;
        gameState.collectibles.push(this);
    }
    
    update() {
        this.y = this.baseY + Math.sin(gameState.frameCount * 0.1) * 5;
        
        if (checkAABB(this, gameState.player)) {
            gameState.score += 50;
            gameState.player.energy = Math.min(gameState.player.energy + 10, 100);
            spawnSparks(this.x, this.y);
            gameState.particles.push(new FloatingText(this.x, this.y, "+50", COLORS.COLLECTIBLE));
            
            // Remove
            const idx = gameState.collectibles.indexOf(this);
            if (idx > -1) gameState.collectibles.splice(idx, 1);
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x + 8, this.y + 8);
        p.rotate(gameState.frameCount * 0.05);
        p.fill(COLORS.COLLECTIBLE);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 12, 12);
        p.stroke(255);
        p.line(-6, -6, 6, 6);
        p.line(-6, 6, 6, -6);
        p.pop();
    }
}