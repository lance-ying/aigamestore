import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, JUMP_FORCE, MOVE_SPEED, FRICTION } from './globals.js';
import { applyPhysics, resolvePlatformCollisions, checkAABB } from './physics.js';
import { drawVectorChar, drawSwordSlash } from './graphics.js';
import { spawnDamageText, spawnSparkEffect } from './particles.js';

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
        this.onGround = false;
        this.isDead = false;
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 40);
        this.health = 100;
        this.maxHealth = 100;
        this.facing = 1; // 1 Right, -1 Left
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.isBlocking = false;
    }

    update(p) {
        // Input Handling (Human or AI)
        const keys = gameState.keys;
        
        // Movement
        if (keys[37]) { // Left
            this.vx -= 1;
            this.facing = -1;
        }
        if (keys[39]) { // Right
            this.vx += 1;
            this.facing = 1;
        }

        // Friction and Speed Cap
        this.vx *= FRICTION;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (this.vx > MOVE_SPEED) this.vx = MOVE_SPEED;
        if (this.vx < -MOVE_SPEED) this.vx = -MOVE_SPEED;

        // Jump
        if (keys[32] && this.onGround) { // Space
            this.vy = JUMP_FORCE;
            this.onGround = false;
        }

        // Attack
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (keys[90] && this.attackCooldown <= 0 && !this.isAttacking) { // Z
            this.startAttack();
        }

        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        // Block
        this.isBlocking = !!keys[16]; // Shift

        // Physics
        applyPhysics(this);
        resolvePlatformCollisions(this);

        // Check interactions
        this.checkAttacks();
        this.checkCollectibles();
        
        // Fall off world
        if (this.y > CANVAS_HEIGHT + 100) {
            this.takeDamage(1000); // Instant death
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.attackTimer = 15; // Frames the hitbox is active
        this.attackCooldown = 30; // Frames until next attack
    }

    checkAttacks() {
        if (!this.isAttacking) return;
        
        // Create hitbox in front of player
        const hitbox = {
            x: this.facing === 1 ? this.x + this.width : this.x - 40,
            y: this.y,
            width: 40,
            height: this.height
        };

        gameState.entities.forEach(entity => {
            if (entity instanceof Enemy && !entity.isDead) {
                if (checkAABB(hitbox, entity)) {
                    // Only hit if not already hit this swing (simplified by cooldown)
                     // Actually simplest way is just apply damage every frame of attack? 
                     // Better: check if enemy invulnerability frames.
                     // For this simple game, we'll just push back and damage once.
                     if (this.attackTimer === 10) { // Specific frame to deal damage
                         entity.takeDamage(25, this.facing);
                         spawnSparkEffect(entity.x + entity.width/2, entity.y, 5, gameState.entities);
                     }
                }
            }
        });
    }

    checkCollectibles() {
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const stone = gameState.collectibles[i];
            // Simple center-to-center check or AABB
            const pCenter = { x: this.x + this.width/2, y: this.y + this.height/2 };
            const sCenter = { x: stone.x, y: stone.y };
            const dist = Math.sqrt(Math.pow(pCenter.x - sCenter.x, 2) + Math.pow(pCenter.y - sCenter.y, 2));
            
            if (dist < 30) {
                gameState.score += 100;
                gameState.stonesCollected++;
                gameState.collectibles.splice(i, 1);
                spawnDamageText(this.x, this.y - 20, "GOT STONE!", gameState.entities);
                
                // Check Win Condition
                if (gameState.stonesCollected >= gameState.totalStones) {
                    gameState.gamePhase = "GAME_OVER_WIN";
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.isBlocking) amount = Math.floor(amount * 0.2); // 80% reduction
        this.health -= amount;
        spawnDamageText(this.x, this.y, amount, gameState.entities);
        
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    render(p) {
        // Draw Shield
        if (this.isBlocking) {
            p.push();
            p.stroke(0, 100, 255);
            p.noFill();
            p.circle(this.x + this.width/2, this.y + this.height/2, 60);
            p.pop();
        }

        // Draw Player
        // Center the vector drawing relative to the hit box
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        if (this.isAttacking) {
            drawVectorChar(p, cx, cy, 'PLAYER_ATTACK', COLORS.PLAYER);
            drawSwordSlash(p, cx + (this.facing * 10), cy, this.facing);
        } else {
            drawVectorChar(p, cx, cy, 'PLAYER_IDLE', COLORS.PLAYER);
        }
    }
}

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.health = 50;
        this.detectRange = 300;
        this.attackRange = 40;
        this.damage = 10;
        this.cooldown = 0;
        this.speed = 2;
        this.knockbackX = 0;
    }

    update(p) {
        if (!gameState.player) return;

        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Friction for knockback
        this.knockbackX *= 0.8;
        this.x += this.knockbackX;

        // AI Logic
        if (Math.abs(this.knockbackX) < 1) {
            if (dist < this.detectRange) {
                // Chase
                if (dx > this.attackRange/2) this.vx = this.speed;
                else if (dx < -this.attackRange/2) this.vx = -this.speed;
                else this.vx = 0;
            } else {
                this.vx = 0; // Idle
            }
        } else {
            this.vx = 0; // Stunned by knockback
        }

        // Attack
        if (dist < this.attackRange && this.cooldown <= 0) {
            gameState.player.takeDamage(this.damage);
            this.cooldown = 60; // 1 second cooldown
            this.vx = 0;
        }
        if (this.cooldown > 0) this.cooldown--;

        // Physics
        applyPhysics(this);
        resolvePlatformCollisions(this);
    }

    takeDamage(amount, direction) {
        this.health -= amount;
        this.knockbackX = direction * 10;
        this.vy = -5; // Hop up
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        gameState.score += 50;
        spawnSparkEffect(this.x + this.width/2, this.y + this.height/2, 10, gameState.entities);
    }

    render(p) {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        
        // Wobble effect
        const wobble = Math.sin(gameState.frameCount * 0.2) * 2;
        drawVectorChar(p, cx, cy + wobble, 'ENEMY', COLORS.ENEMY);
        
        // Health bar
        p.fill(255, 0, 0);
        p.noStroke();
        p.rect(this.x, this.y - 10, this.width * (this.health / 50), 3);
    }
}

export class SoulStone {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.origY = y;
    }

    update() {
        // Float animation
        this.y = this.origY + Math.sin(gameState.frameCount * 0.05) * 5;
    }

    render(p) {
        drawVectorChar(p, this.x, this.y, 'STONE', COLORS.STONE);
    }
}