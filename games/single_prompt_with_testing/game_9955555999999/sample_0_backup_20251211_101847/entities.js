/**
 * Game entities: Player, Enemy, Platform, Hitbox.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updatePhysics, resolvePlatformCollision, checkCollision, applyKnockback } from './physics.js';
import { createExplosion } from './particles.js';

// --- Base Entity ---
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = 1; // 1 Right, -1 Left
        this.color = [255, 255, 255];
        this.markedForDeletion = false;
    }

    update() {}
    render(p) {}
}

// --- Platform ---
export class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.color = [100, 100, 120];
    }

    render(p) {
        p.push();
        p.fill(this.color);
        p.stroke(200);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.width, this.height);
        p.pop();
    }
}

// --- Hitbox ---
// Represents an active attack area
export class Hitbox extends Entity {
    constructor(owner, x, y, width, height, damage, knockbackX, knockbackY, duration) {
        super(x, y, width, height);
        this.owner = owner;
        this.damage = damage;
        this.kbX = knockbackX;
        this.kbY = knockbackY;
        this.duration = duration;
        this.age = 0;
        this.hitList = []; // Entities already hit
    }

    update() {
        this.age++;
        if (this.age >= this.duration) {
            this.markedForDeletion = true;
        }

        // Move with owner if it's a melee attack attached to body
        // For now, static relative to spawn or attached logic could be complex. 
        // We'll assume detached for simplicity or simple offset updates in owner.
    }

    render(p) {
        // Debug render
        // p.push();
        // p.noFill();
        // p.stroke(255, 0, 0, 100);
        // p.rectMode(p.CENTER);
        // p.rect(this.x, this.y, this.width, this.height);
        // p.pop();
    }
}

// --- Fighter (Base for Player and AI) ---
export class Fighter extends Entity {
    constructor(x, y, isPlayer = false) {
        super(x, y, 30, 60); // Standard human size
        this.isPlayer = isPlayer;
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.moveSpeed = 5;
        this.jumpForce = -12;
        this.dashSpeed = 15;
        
        // State
        this.state = "IDLE"; // IDLE, RUN, JUMP, FALL, ATTACK, DASH, STUN, DEAD
        this.stateTimer = 0;
        this.canDash = true;
        this.hasDoubleJump = true;
        this.attackCooldown = 0;
        this.dashCooldown = 0;
        
        // Combo system
        this.hasHit = false; // Can we cancel?
        
        // Visuals
        this.animFrame = 0;
    }

    update(p) {
        if (this.health <= 0 && this.state !== "DEAD") {
            this.setState("DEAD");
        }
        
        this.stateTimer++;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;

        // Input handling (Overridden by AI subclass or Input module)
        let input = { x: 0, jump: false, attack: false, dash: false };
        
        if (this.state !== "STUN" && this.state !== "DEAD") {
            if (this.isPlayer) {
                // Get inputs from global input module
                // Assuming imported functions, but for better encapsulation pass via arg or global read
                // We'll read from key state manually here or pass in
                // Using global helper for now
                const { isKeyDown, isKeyPressed, KEYS, consumeKeyPress } =  await import('./input.js').then(m => m); // Dynamic import workaround or just use global if set
                // Actually, let's assume keys are available.
                // Re-importing inside method is bad for performance. 
                // We'll rely on the update method being called with context or direct global access.
            }
        }
        
        // State Machine Update
        switch (this.state) {
            case "IDLE":
            case "RUN":
            case "JUMP":
            case "FALL":
                this.handleMovementState(p);
                break;
            case "ATTACK":
                this.handleAttackState(p);
                break;
            case "DASH":
                this.handleDashState(p);
                break;
            case "STUN":
                this.handleStunState(p);
                break;
            case "DEAD":
                this.vx = 0;
                break;
        }

        updatePhysics(this);
        
        // Collision with Platforms
        gameState.platforms.forEach(platform => {
            resolvePlatformCollision(this, platform);
        });

        // Bounds check (Death pit)
        if (this.y > CANVAS_HEIGHT + 100) {
            this.health = 0;
            this.setState("DEAD");
        }
    }

    handleMovementState(p) {
        // Base physics logic happens in updatePhysics, this controls velocity intent
    }

    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
        if (newState === "ATTACK") {
            this.hasHit = false;
        }
    }

    takeDamage(amount, kbX, kbY) {
        if (this.state === "DEAD") return;
        this.health -= amount;
        applyKnockback(this, kbX, kbY);
        this.setState("STUN");
        
        // Hitstop effect
        gameState.hitStop = 5;
        gameState.camera.shake = 10;
        
        createExplosion(this.x, this.y, 10, 'SPARK');
        createExplosion(this.x, this.y, 5, 'BLOOD');
    }

    // Render Stick Figure
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        if (this.facing === -1) p.scale(-1, 1);

        // Flicker if damaged recently?
        if (this.state === "STUN" && p.frameCount % 4 === 0) {
            p.pop();
            return; 
        }

        p.stroke(this.isPlayer ? 0 : 255); // Black for player, White for enemy (or configurable)
        if (!this.isPlayer) p.stroke(255, 50, 50); // Red tint for enemy
        if (this.isPlayer) p.stroke(50, 255, 100); // Green tint for player

        p.strokeWeight(3);
        p.noFill();

        // Animation procedural logic
        let legOffset = 0;
        let armOffset = 0;
        
        if (this.state === "RUN" && this.isGrounded) {
            legOffset = Math.sin(p.frameCount * 0.5) * 10;
        }
        
        // Head
        p.circle(0, -20, 15);
        
        // Body
        p.line(0, -12, 0, 10);
        
        // Legs
        p.line(0, 10, -10 + legOffset, 30);
        p.line(0, 10, 10 - legOffset, 30);
        
        // Arms
        if (this.state === "ATTACK") {
            p.line(0, -5, 20, -5); // Punch
        } else {
            p.line(0, -5, 15 + armOffset, 10);
            p.line(0, -5, -15 - armOffset, 10);
        }

        // Debug Hitbox
        // p.stroke(0, 255, 0);
        // p.rect(0, 0, this.width, this.height);

        p.pop();
    }
}

// --- Player Class ---
export class Player extends Fighter {
    constructor(x, y) {
        super(x, y, true);
    }

    update(p) {
        // Imports
        const { isKeyDown, isKeyPressed, KEYS, consumeKeyPress } =  window.inputModule; // We will attach input to window for easy access in classes
        
        super.update(p);
        
        if (this.state === "DEAD") return;
        if (this.state === "STUN") {
            if (this.stateTimer > 20) this.setState("IDLE"); // Recovery
            return;
        }

        // Movement
        if (this.state !== "DASH" && this.state !== "ATTACK") {
            if (isKeyDown(KEYS.LEFT)) {
                this.vx = -this.moveSpeed;
                this.facing = -1;
                if (this.isGrounded) this.setState("RUN");
            } else if (isKeyDown(KEYS.RIGHT)) {
                this.vx = this.moveSpeed;
                this.facing = 1;
                if (this.isGrounded) this.setState("RUN");
            } else {
                this.vx = 0;
                if (this.isGrounded) this.setState("IDLE");
            }

            // Jump
            if (isKeyPressed(KEYS.SPACE)) {
                if (this.isGrounded) {
                    this.vy = this.jumpForce;
                    this.isGrounded = false;
                    this.setState("JUMP");
                    createExplosion(this.x, this.y + 30, 5, 'DUST');
                    consumeKeyPress(KEYS.SPACE);
                } else if (this.hasDoubleJump) {
                    this.vy = this.jumpForce;
                    this.hasDoubleJump = false;
                    createExplosion(this.x, this.y + 30, 5, 'DUST');
                    consumeKeyPress(KEYS.SPACE);
                }
            }
        }
        
        // Dash
        if (isKeyPressed(KEYS.SHIFT) && this.canDash && this.dashCooldown === 0) {
            // Can dash if idle/move/jump OR if Attacking and HasHit (Dash Cancel)
            if (this.state !== "ATTACK" || (this.state === "ATTACK" && this.hasHit)) {
                this.setState("DASH");
                this.canDash = false; // Need to land to reset or cooldown
                this.dashCooldown = 60;
                
                // Dash direction
                let dirX = 0;
                let dirY = 0;
                if (isKeyDown(KEYS.LEFT)) dirX = -1;
                if (isKeyDown(KEYS.RIGHT)) dirX = 1;
                if (isKeyDown(KEYS.UP)) dirY = -1;
                if (isKeyDown(KEYS.DOWN)) dirY = 1;
                
                if (dirX === 0 && dirY === 0) dirX = this.facing;
                
                // Normalize roughly
                const mag = Math.sqrt(dirX*dirX + dirY*dirY);
                this.vx = (dirX / mag) * this.dashSpeed;
                this.vy = (dirY / mag) * this.dashSpeed;
                
                consumeKeyPress(KEYS.SHIFT);
                createExplosion(this.x, this.y, 8, 'LINE');
            }
        }

        // Attack
        if (isKeyPressed(KEYS.Z) && this.attackCooldown === 0 && this.state !== "DASH") {
            this.setState("ATTACK");
            this.attackCooldown = 20;
            // Spawn Hitbox
            const hbX = this.x + (30 * this.facing);
            const hb = new Hitbox(this, hbX, this.y, 40, 40, 10, 10 * this.facing, -5, 10);
            gameState.projectiles.push(hb);
            consumeKeyPress(KEYS.Z);
        }
        
        if (this.state === "ATTACK") {
            // Apply a little friction during ground attack
            if (this.isGrounded) this.vx *= 0.5;
            if (this.stateTimer > 15) {
                this.setState("IDLE");
            }
        }
        
        if (this.state === "DASH") {
            this.vy = 0; // defy gravity
            if (this.stateTimer > 10) {
                this.vx *= 0.2;
                this.vy *= 0.2;
                this.setState("FALL");
            }
        }
    }
}

// --- Enemy AI ---
export class Enemy extends Fighter {
    constructor(x, y) {
        super(x, y, false);
        this.decisionTimer = 0;
        this.target = null;
    }

    update(p) {
        super.update(p);
        this.target = gameState.player;
        if (!this.target) return;
        
        if (this.state === "DEAD" || this.state === "STUN") return;
        
        const dist = Math.abs(this.target.x - this.x);
        const dy = this.target.y - this.y;
        
        // Simple AI
        this.decisionTimer++;
        if (this.decisionTimer > 30) { // React every half second roughly
             this.decisionTimer = 0;
        }

        // Face player
        if (this.target.x > this.x) this.facing = 1;
        else this.facing = -1;

        if (this.state !== "ATTACK" && this.state !== "DASH") {
            // Movement
            if (dist > 50) {
                this.vx = this.moveSpeed * this.facing;
                this.setState("RUN");
            } else {
                this.vx = 0;
                this.setState("IDLE");
                
                // Attack if close
                if (this.attackCooldown === 0 && Math.random() < 0.1) {
                     this.setState("ATTACK");
                     this.attackCooldown = 40; // Slower than player
                     const hbX = this.x + (30 * this.facing);
                     const hb = new Hitbox(this, hbX, this.y, 40, 40, 8, 8 * this.facing, -5, 10);
                     gameState.projectiles.push(hb);
                }
            }
            
            // Jump if target is above or random
            if ((dy < -50 || Math.random() < 0.01) && this.isGrounded) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.setState("JUMP");
            }
        }
        
        if (this.state === "ATTACK") {
             if (this.stateTimer > 20) this.setState("IDLE");
        }
    }
}