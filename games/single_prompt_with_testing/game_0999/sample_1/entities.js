/**
 * Game entities including Player, Enemies, and Projectiles.
 */

import { PhysicsBody, resolveMapCollision } from './physics.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';
import { renderCharacter, SPRITE_SKELETON, SPRITE_BOSS, drawPixelGrid } from './renderers.js';
import { isKeyDown, KEYS, wasKeyPressed } from './input.js';
import { createHitParticle, createDeathEffect } from './particles.js';

// --- BASE ENTITY ---

export class Entity extends PhysicsBody {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.active = true;
        this.health = 10;
        this.maxHealth = 10;
        this.damage = 0;
        this.invulnerable = 0;
        this.color = [255, 255, 255];
    }

    update(p) {
        if (!this.active) return;
        this.applyPhysics();
        if (gameState.currentLevel) {
            resolveMapCollision(this, gameState.currentLevel);
        }
        if (this.invulnerable > 0) this.invulnerable--;
    }

    render(p) {
        // Default render (debug box)
        if (!this.active) return;
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
    }

    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        this.health -= amount;
        this.invulnerable = 10;
        createHitParticle(this.x + this.width/2, this.y + this.height/2);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        createDeathEffect(this.x + this.width/2, this.y + this.height/2);
    }
}

// --- PLAYER ---

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 36); // Zangetsu hitbox
        this.characterType = "ZANGETSU"; // or "MIRIAM"
        this.health = 100;
        this.maxHealth = 100;
        
        // Combat Stats
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.attackFrame = 0;
        
        // Movement Stats
        this.speed = 4;
        this.jumpForce = -10;
        
        // Automation / Testing hooks
        this.autoAction = null;
    }

    update(p) {
        if (!this.active) return;
        
        // Testing hook
        if (gameState.controlMode !== "HUMAN" && window.get_automated_testing_action) {
            this.handleAutoInput(p);
        } else {
            this.handleInput(p);
        }
        
        super.update(p);
        
        // Attack logic
        if (this.isAttacking) {
            this.attackFrame++;
            this.vx *= 0.5; // Slow down while attacking
            
            // Deal damage frame
            if (this.attackFrame === 10) { // Hit frame
                this.checkAttackHitbox();
            }
            
            if (this.attackFrame > 20) {
                this.isAttacking = false;
                this.attackCooldown = 10;
            }
        } else {
            if (this.attackCooldown > 0) this.attackCooldown--;
        }
        
        // Log info
        if (p.frameCount % 10 === 0) {
             p.logs.player_info.push({
                 x: this.x, y: this.y, 
                 health: this.health, 
                 type: this.characterType,
                 frame: p.frameCount
             });
        }
    }

    handleInput(p) {
        // Movement
        if (!this.isAttacking) {
            if (isKeyDown(KEYS.LEFT)) {
                this.vx = -this.speed;
                this.facing = -1;
            } else if (isKeyDown(KEYS.RIGHT)) {
                this.vx = this.speed;
                this.facing = 1;
            } else {
                this.vx = 0;
            }

            // Jump
            if (wasKeyPressed(KEYS.SPACE) && this.isGrounded) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
            }
        }

        // Attack
        if (wasKeyPressed(KEYS.Z) && !this.isAttacking && this.attackCooldown === 0) {
            this.isAttacking = true;
            this.attackFrame = 0;
        }

        // Switch Character
        if (wasKeyPressed(KEYS.SHIFT)) {
            this.switchCharacter();
        }
    }

    handleAutoInput(p) {
        const action = window.get_automated_testing_action(gameState);
        if (!action) return;
        
        if (action.moveLeft) {
            this.vx = -this.speed;
            this.facing = -1;
        } else if (action.moveRight) {
            this.vx = this.speed;
            this.facing = 1;
        } else {
            this.vx = 0;
        }
        
        if (action.jump && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }
        
        if (action.attack && !this.isAttacking && this.attackCooldown === 0) {
            this.isAttacking = true;
            this.attackFrame = 0;
        }
        
        if (action.switchChar) {
            this.switchCharacter();
        }
    }

    switchCharacter() {
        if (this.characterType === "ZANGETSU") {
            this.characterType = "MIRIAM";
            this.speed = 3.5;
            this.jumpForce = -12; // Higher jump
            this.maxHealth = 80;
            if (this.health > 80) this.health = 80;
        } else {
            this.characterType = "ZANGETSU";
            this.speed = 4;
            this.jumpForce = -10;
            this.maxHealth = 100;
        }
        // Visual effect
        createHitParticle(this.x, this.y);
    }

    checkAttackHitbox() {
        // Define hitbox based on facing
        const reach = this.characterType === "MIRIAM" ? 60 : 40;
        const damage = this.characterType === "ZANGETSU" ? 25 : 15;
        
        const hitX = this.facing === 1 ? this.x + this.width : this.x - reach;
        const hitY = this.y + 10;
        const hitW = reach;
        const hitH = 20;
        
        const attackRect = { x: hitX, y: hitY, width: hitW, height: hitH };
        
        // Check enemies
        gameState.enemies.forEach(enemy => {
            if (enemy.active && checkRectOverlap(attackRect, enemy)) {
                enemy.takeDamage(damage);
            }
        });
    }

    render(p) {
        if (!this.active) return;
        if (this.invulnerable > 0 && p.frameCount % 4 < 2) return; // Blink effect

        renderCharacter(p, this, this.characterType, this.isAttacking ? "ATTACK" : "IDLE");
        
        // Debug hitbox
        if (gameState.debugMode) {
            p.noFill();
            p.stroke(0, 255, 0);
            p.rect(this.x, this.y, this.width, this.height);
        }
    }
    
    die() {
        super.die();
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

// --- ENEMIES ---

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type || "SKELETON";
        this.health = 30;
        this.damage = 10;
        this.detectRange = 200;
        this.state = "IDLE"; // IDLE, CHASE, ATTACK
        this.stateTimer = 0;
    }

    update(p) {
        super.update(p);
        
        if (!gameState.player || !gameState.player.active) return;
        
        const distToPlayer = Math.abs(gameState.player.x - this.x);
        const yDist = Math.abs(gameState.player.y - this.y);
        
        // Simple AI
        if (this.state === "IDLE") {
            if (distToPlayer < this.detectRange && yDist < 100) {
                this.state = "CHASE";
            }
        } else if (this.state === "CHASE") {
            if (distToPlayer > this.detectRange * 1.5) {
                this.state = "IDLE";
                this.vx = 0;
            } else {
                // Move towards player
                const dir = Math.sign(gameState.player.x - this.x);
                this.vx = dir * 1.5;
                this.facing = dir;
                
                // Attack if close
                if (distToPlayer < 40) {
                    this.state = "ATTACK";
                    this.stateTimer = 30;
                    this.vx = 0;
                }
            }
        } else if (this.state === "ATTACK") {
            this.stateTimer--;
            if (this.stateTimer === 15) {
                // Deal damage
                if (checkRectOverlap(this, gameState.player)) {
                    gameState.player.takeDamage(this.damage);
                }
            }
            if (this.stateTimer <= 0) {
                this.state = "CHASE";
            }
        }
    }

    render(p) {
        if (!this.active) return;
        
        p.push();
        const scale = 3;
        const sprite = SPRITE_SKELETON;
        const colorMap = {
            1: PALETTE.skeleton, 
            2: [255, 0, 0] // Eyes
        };
        
        // Center drawing
        const drawX = this.x + this.width/2 - (sprite[0].length*scale)/2;
        const drawY = this.y + this.height/2 - (sprite.length*scale)/2;
        
        p.translate(drawX, drawY);
        drawPixelGrid(p, sprite, scale, colorMap, this.facing === -1);
        p.pop();
    }
    
    die() {
        super.die();
        gameState.score += 100;
        // Remove from list
        gameState.enemies = gameState.enemies.filter(e => e !== this);
    }
}

export class Boss extends Entity {
    constructor(x, y) {
        super(x, y, 60, 60);
        this.type = "BOSS";
        this.health = 300;
        this.maxHealth = 300;
        this.damage = 20;
        this.phase = 1;
        this.attackTimer = 100;
        this.hoverOffset = 0;
    }

    update(p) {
        // Boss doesn't obey standard physics completely (hovers)
        this.hoverOffset += 0.05;
        this.y += Math.sin(this.hoverOffset) * 0.5;
        
        if (!gameState.player) return;
        
        // Always face player
        this.facing = Math.sign(gameState.player.x - this.x) || 1;
        
        this.attackTimer--;
        if (this.attackTimer <= 0) {
            this.performAttack();
            this.attackTimer = 120;
        }
        
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Collision with player (body damage)
        if (checkRectOverlap(this, gameState.player)) {
            gameState.player.takeDamage(10);
        }
    }
    
    performAttack() {
        // Spawn projectile
        const p = new Projectile(this.x + this.width/2, this.y + this.height/2, this.facing);
        gameState.entities.push(p);
        gameState.projectiles.push(p);
    }

    render(p) {
        if (!this.active) return;
        p.push();
        const scale = 6; // Big boss
        const sprite = SPRITE_BOSS;
        const colorMap = {
            1: PALETTE.boss,
            2: [255, 255, 0], // Glowing eyes
            3: [50, 0, 0] // Mouth
        };
        
        const drawX = this.x + this.width/2 - (sprite[0].length*scale)/2;
        const drawY = this.y + this.height/2 - (sprite.length*scale)/2;
        
        p.translate(drawX, drawY);
        if (this.invulnerable > 0) p.tint(255, 100, 100); // Doesnt work on rects, manually handled usually
        
        drawPixelGrid(p, sprite, scale, colorMap, this.facing === -1);
        p.pop();
        
        // Boss Health Bar
        p.fill(100, 0, 0);
        p.rect(CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT - 30, 200, 10);
        p.fill(255, 0, 0);
        p.rect(CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT - 30, 200 * (this.health/this.maxHealth), 10);
    }
    
    die() {
        super.die();
        gameState.gamePhase = "GAME_OVER_WIN";
    }
}

export class Projectile extends PhysicsBody {
    constructor(x, y, dir) {
        super(x, y, 10, 10);
        this.vx = dir * 6;
        this.vy = 0;
        this.life = 100;
    }
    
    update(p) {
        this.x += this.vx;
        this.life--;
        if (this.life <= 0) this.active = false;
        
        // Check Player Hit
        if (gameState.player && checkRectOverlap(this, gameState.player)) {
            gameState.player.takeDamage(15);
            this.active = false;
        }
    }
    
    render(p) {
        p.fill(255, 100, 0);
        p.circle(this.x + 5, this.y + 5, 10);
    }
}

// Utility
function checkRectOverlap(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}