/**
 * Entities Module
 * 
 * Defines the core game objects: Fighter (Player/CPU), Platform, Projectile, Hitbox.
 * Implements a State Machine pattern for fighter logic.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRAVITY, JUMP_FORCE, MOVE_SPEED } from './globals.js';
import { checkAABB, resolvePlatformCollisions, applyPhysics, checkBlastZone, calculateKnockbackMagnitude } from './physics.js';
import { isKeyDown, wasKeyPressed, consumeKey, KEYS, getInputVector } from './input.js';
import { spawnParticles } from './particles.js';
import { get_automated_testing_action } from './automated_tests.js';

// ==========================================
// BASE CLASSES
// ==========================================

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.lastX = x;
        this.lastY = y;
        this.markedForDeletion = false;
    }
    
    update() {}
    render(p) {}
}

export class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }
    
    render(p) {
        p.push();
        p.fill(COLORS.PLATFORM);
        p.stroke(50);
        p.rect(this.x, this.y, this.width, this.height, 4);
        p.pop();
    }
}

export class Hitbox extends Entity {
    constructor(owner, x, y, width, height, damage, knockback, duration, angle) {
        super(x, y, width, height);
        this.owner = owner;
        this.damage = damage;
        this.baseKnockback = knockback;
        this.duration = duration;
        this.age = 0;
        this.angle = angle; // Radians direction of knockback
        this.hasHit = []; // List of entity IDs hit to prevent multi-hit per frame
    }
    
    update() {
        this.age++;
        if (this.age >= this.duration) {
            this.markedForDeletion = true;
        }
        
        // Hitbox tracks owner if relative? simplified: static offset usually
        // For this demo, static position hitboxes spawned by attacks
    }
    
    render(p) {
        // Debug render
        // p.push();
        // p.fill(COLORS.HITBOX);
        // p.noStroke();
        // p.rect(this.x, this.y, this.width, this.height);
        // p.pop();
    }
}

export class Projectile extends Entity {
    constructor(owner, x, y, vx, vy) {
        super(x, y, 20, 20);
        this.owner = owner;
        this.vx = vx;
        this.vy = vy;
        this.damage = 8;
        this.knockback = 5;
        this.life = 120;
    }
    
    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        // Particles
        spawnParticles(this.x + 10, this.y + 10, 'fire', 1);
        
        if (this.life <= 0 || checkBlastZone(this)) {
            this.markedForDeletion = true;
        }
        
        // Collision check with enemies
        const targets = this.owner.isPlayer ? gameState.enemies : (gameState.player ? [gameState.player] : []);
        
        for (const target of targets) {
            if (checkAABB(this, target)) {
                target.takeDamage(this.damage, this.knockback, Math.atan2(this.vy, this.vx));
                this.markedForDeletion = true;
                spawnParticles(this.x, this.y, 'spark', 10);
                break;
            }
        }
        
        // Wall check
        for (const platform of gameState.platforms) {
            if (checkAABB(this, platform)) {
                this.markedForDeletion = true;
                spawnParticles(this.x, this.y, 'smoke', 5);
                break;
            }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x + 10, this.y + 10);
        p.rotate(p.frameCount * 0.2);
        p.fill(COLORS.FIRE_PRIMARY);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 15, 15);
        p.pop();
    }
}

// ==========================================
// FIGHTER CLASS (STATE MACHINE)
// ==========================================

export class Fighter extends Entity {
    constructor(x, y, isPlayer, color) {
        super(x, y, 32, 48); // Standard size
        this.isPlayer = isPlayer;
        this.color = color;
        
        // Stats
        this.percent = 0;
        this.stocks = 3;
        this.isDead = false;
        
        // Physics State
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.jumpsRemaining = 2;
        
        // Combat State
        this.state = 'IDLE'; // IDLE, RUN, JUMP, FALL, ATTACK, SPECIAL, HITSTUN, DEAD
        this.stateTimer = 0;
        this.invulnerableTimer = 0;
        
        // Automated Test ID (for hit tracking)
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    changeState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    update(p) {
        if (this.isDead) return;
        
        // 1. Input Handling (Movement)
        let input = { x: 0, y: 0, jump: false, attack: false, special: false };
        
        if (this.isPlayer) {
            // Human or Test Input
            if (gameState.controlMode === "HUMAN") {
                const vec = getInputVector();
                input.x = vec.x;
                input.y = vec.y;
                input.jump = wasKeyPressed(p, KEYS.SPACE);
                input.attack = wasKeyPressed(p, KEYS.Z);
                input.special = wasKeyPressed(p, KEYS.SHIFT);
                
                if (input.jump) consumeKey(KEYS.SPACE);
                if (input.attack) consumeKey(KEYS.Z);
                if (input.special) consumeKey(KEYS.SHIFT);
            } else {
                // Automated Test Input
                const action = get_automated_testing_action(gameState);
                if (action) {
                    if (action.keyCode === KEYS.RIGHT) input.x = 1;
                    if (action.keyCode === KEYS.LEFT) input.x = -1;
                    if (action.keyCode === KEYS.SPACE) input.jump = true;
                    if (action.keyCode === KEYS.Z) input.attack = true;
                    if (action.keyCode === KEYS.SHIFT) input.special = true;
                }
            }
        } else {
            // Simple CPU AI
            const target = gameState.player;
            if (target && !target.isDead) {
                // Move towards player
                if (target.x > this.x + 50) input.x = 1;
                else if (target.x < this.x - 50) input.x = -1;
                
                // Jump gaps or to reach player
                if (this.y > target.y + 100 || (input.x !== 0 && !this.onGround && Math.random() < 0.05)) {
                    input.jump = true;
                }
                
                // Attack if close
                const dist = Math.abs(target.x - this.x);
                if (dist < 60 && Math.abs(target.y - this.y) < 50) {
                    if (Math.random() < 0.1) input.attack = true;
                }
                
                // Recovery
                if (this.y > CANVAS_HEIGHT - 100) {
                    input.jump = true;
                    if (this.jumpsRemaining <= 0) input.special = true; // Up special
                }
            }
        }
        
        // 2. State Logic
        this.handleState(input, p);
        
        // 3. Physics Application
        applyPhysics(this);
        resolvePlatformCollisions(this, gameState.platforms);
        
        // 4. Boundary Check / Blast Zone
        if (checkBlastZone(this)) {
            this.die();
        }
        
        // 5. Timers
        this.stateTimer++;
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        
        // Refresh jumps on ground
        if (this.onGround && this.vy >= 0) {
            this.jumpsRemaining = 2;
        }
        
        // Update Hitboxes owned by this fighter
        // (Handled in gameState loop, but we could manage creation here)
    }
    
    handleState(input, p) {
        // Can't control during hitstun
        if (this.state === 'HITSTUN') {
            if (this.stateTimer > 20 && Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1) {
                this.changeState('IDLE');
            }
            return;
        }
        
        // Direction
        if (input.x !== 0) this.facing = input.x;
        
        // Movement Physics
        const speed = this.onGround ? MOVE_SPEED : 4; // AIR_MOVE_SPEED constant not imported directly to save line
        
        // State Machine
        switch (this.state) {
            case 'IDLE':
            case 'RUN':
                // Ground Movement
                if (input.x !== 0) {
                    this.vx = input.x * speed;
                    this.changeState('RUN');
                } else {
                    this.vx *= 0.8;
                    this.changeState('IDLE');
                }
                
                // Jump
                if (input.jump && this.jumpsRemaining > 0) {
                    this.performJump();
                }
                
                // Fall
                if (!this.onGround) {
                    this.changeState('FALL');
                }
                
                // Attack
                if (input.attack) {
                    this.performAttack('NEUTRAL', input);
                }
                
                // Special
                if (input.special) {
                    this.performSpecial(input);
                }
                break;
                
            case 'JUMP':
            case 'FALL':
                // Air Drift
                if (input.x !== 0) {
                    // Air accel
                    this.vx += input.x * 0.5;
                    if (this.vx > speed) this.vx = speed;
                    if (this.vx < -speed) this.vx = -speed;
                }
                
                // Double Jump
                if (input.jump && this.jumpsRemaining > 0) {
                    this.performJump();
                }
                
                // Landing
                if (this.onGround) {
                    this.changeState('IDLE');
                    spawnParticles(this.x + this.width/2, this.y + this.height, 'dust', 3);
                }
                
                // Aerial Attack
                if (input.attack) {
                    this.performAttack('AIR', input);
                }
                
                // Special
                if (input.special) {
                    this.performSpecial(input);
                }
                break;
                
            case 'ATTACK':
                // Velocity drag during attack
                if (this.onGround) this.vx *= 0.5;
                
                // End lag
                if (this.stateTimer > 20) { // Fixed duration for simplicity
                    this.changeState(this.onGround ? 'IDLE' : 'FALL');
                }
                break;
                
            case 'SPECIAL':
                // Special move logic
                if (this.stateTimer > 30) {
                    this.changeState('FALL');
                }
                break;
        }
    }
    
    performJump() {
        this.vy = JUMP_FORCE;
        this.jumpsRemaining--;
        this.changeState('JUMP');
        spawnParticles(this.x + this.width/2, this.y + this.height, 'dust', 5);
    }
    
    performAttack(type, input) {
        this.changeState('ATTACK');
        
        // Directional offset
        let hx = this.x + (this.facing === 1 ? this.width : -30);
        let hy = this.y + 10;
        let w = 30;
        let h = 30;
        
        // Spawn Hitbox
        const hitbox = new Hitbox(
            this, hx, hy, w, h, 
            5, 8, 10, 
            this.facing === 1 ? 0 : Math.PI // Direction
        );
        gameState.hitboxes.push(hitbox);
        
        // Visual cue
        spawnParticles(hx + w/2, hy + h/2, 'spark', 3);
    }
    
    performSpecial(input) {
        this.changeState('SPECIAL');
        
        // Fireball
        const vx = this.facing * 8;
        const projectile = new Projectile(this, this.x + this.width/2, this.y + 10, vx, 0);
        gameState.projectiles.push(projectile);
    }
    
    takeDamage(damage, baseKnockback, angle) {
        if (this.invulnerableTimer > 0) return;
        
        this.percent += damage;
        
        // Calculate knockback
        const magnitude = calculateKnockbackMagnitude(this.percent, baseKnockback, 1.0);
        
        this.vx = Math.cos(angle) * magnitude;
        this.vy = Math.sin(angle) * magnitude - 2; // Small pop up
        
        this.changeState('HITSTUN');
        this.stateTimer = 0;
        
        // Visual
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'spark', 15);
        gameState.camera.shake = 5;
    }
    
    die() {
        this.stocks--;
        spawnParticles(this.x, this.y, 'fire', 30); // Explosion
        
        if (this.stocks > 0) {
            this.respawn();
        } else {
            this.isDead = true;
            // Trigger Game Over logic in Game loop
            if (this.isPlayer) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            } else {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
    }
    
    respawn() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 4;
        this.vx = 0;
        this.vy = 0;
        this.percent = 0;
        this.invulnerableTimer = 180;
        this.changeState('FALL');
    }
    
    render(p) {
        if (this.isDead) return;
        
        // Blink if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        // Draw Shadow
        p.noStroke();
        p.fill(0, 50);
        p.ellipse(this.width/2, this.height, 20, 5);
        
        // Draw Body
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(2);
        
        // Squash and stretch
        let drawW = this.width;
        let drawH = this.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (this.state === 'JUMP') {
            drawW *= 0.8;
            drawH *= 1.1;
            offsetX = (this.width - drawW) / 2;
        } else if (this.onGround && Math.abs(this.vx) > 1) {
            // Running lean
            p.shearX(this.facing * -0.2);
        }
        
        p.rect(offsetX, offsetY, drawW, drawH, 5);
        
        // Draw Eyes (Direction indicator)
        p.fill(255);
        p.noStroke();
        const eyeX = this.facing === 1 ? drawW * 0.7 : drawW * 0.3;
        p.rect(eyeX - 4, 10, 8, 8);
        p.fill(0);
        p.rect(eyeX + (this.facing * 2) - 2, 12, 4, 4);
        
        // Shield / Invulnerable visual
        if (this.invulnerableTimer > 0) {
            p.noFill();
            p.stroke(COLORS.SHIELD);
            p.strokeWeight(2);
            p.circle(this.width/2, this.height/2, 60);
        }
        
        p.pop();
        
        // Render Player Indicator
        if (this.isPlayer) {
            p.fill(255, 255, 0);
            p.noStroke();
            p.triangle(
                this.x + this.width/2 - 5, this.y - 10,
                this.x + this.width/2 + 5, this.y - 10,
                this.x + this.width/2, this.y - 5
            );
        }
    }
}