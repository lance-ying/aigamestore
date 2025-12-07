/**
 * entities.js
 * Game entity classes (Player, Enemies, Collectibles).
 */

import { gameState, GRAVITY, TILE_SIZE, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolveMapCollision, checkEntityCollision, raycastMap } from './physics.js';
import { spawnParticles, spawnFloatingText } from './particles.js';

// --- Base Entity ---
export class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
        this.visible = true;
    }
    
    update(p) {
        // Base physics
        this.vy += GRAVITY;
        resolveMapCollision(this);
    }
    
    render(p) {
        // Override
    }
    
    getCenter() {
        return { x: this.x + this.width/2, y: this.y + this.height/2 };
    }
}

// --- Player ---
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 34); // Slightly smaller than tile
        this.speed = 4;
        this.sprintSpeed = 7;
        this.jumpForce = -10;
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        
        // Stats
        this.hp = 4;
        this.maxHp = 4;
        this.iframes = 0;
        
        // Attack
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackHitbox = { x:0, y:0, w:30, h:20 };
    }
    
    update(p) {
        const inputs = gameState.inputs;
        
        // Horizontal Movement
        let currentSpeed = inputs.sprint ? this.sprintSpeed : this.speed;
        if (inputs.left) {
            this.vx = -currentSpeed;
            this.facing = -1;
        } else if (inputs.right) {
            this.vx = currentSpeed;
            this.facing = 1;
        } else {
            this.vx *= 0.5; // Friction
        }
        
        // Jump
        if (inputs.jump && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            spawnParticles(this.x + this.width/2, this.y + this.height, 'dust', 5);
        }
        
        // Variable Jump Height
        if (!inputs.jump && this.vy < -4) {
            this.vy *= 0.9;
        }
        
        // Apply Physics
        super.update(p);
        
        // Screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x > gameState.worldWidth - this.width) this.x = gameState.worldWidth - this.width;
        
        // Fall damage / Void death
        if (this.y > gameState.worldHeight) {
            this.hp = 0;
        }
        
        // Attack Logic
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        if (inputs.attack && this.attackCooldown === 0) {
            this.performAttack();
        }
        
        // Invulnerability
        if (this.iframes > 0) this.iframes--;
        
        // Check Interactions
        this.checkEntityInteractions();
        
        // Check Death
        if (this.hp <= 0) {
            spawnParticles(this.x, this.y, 'blood', 20);
            gameState.gamePhase = "GAME_OVER_LOSE";
        }

        // Log Player State
        if (gameState.frameCount % 10 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                hp: this.hp,
                frame: gameState.frameCount
            });
        }
    }
    
    performAttack() {
        this.isAttacking = true;
        this.attackCooldown = 20;
        
        // Determine hitbox position
        this.attackHitbox.x = this.facing === 1 ? this.x + this.width : this.x - this.attackHitbox.w;
        this.attackHitbox.y = this.y + 10;
        
        // Check enemies hit
        gameState.entities.forEach(ent => {
            if (ent instanceof Enemy && !ent.markedForDeletion) {
                if (checkEntityCollision({ x: this.attackHitbox.x, y: this.attackHitbox.y, width: this.attackHitbox.w, height: this.attackHitbox.h }, ent)) {
                    ent.takeDamage(1);
                    spawnParticles(ent.x + ent.width/2, ent.y + ent.height/2, 'spark', 5);
                    spawnFloatingText(ent.x, ent.y, "HIT", [255, 200, 0]);
                }
            }
        });
        
        setTimeout(() => { this.isAttacking = false; }, 100); // Animation timing
    }
    
    takeDamage(amount) {
        if (this.iframes > 0) return;
        this.hp -= amount;
        this.iframes = 60; // 1 second invuln
        this.vy = -5; // Knockback up
        this.vx = -this.facing * 5; // Knockback back
        
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'blood', 10);
        spawnFloatingText(this.x, this.y, "-" + amount, [255, 50, 50]);
        
        // Camera shake
        gameState.camera.shakeStrength = 10;
    }
    
    checkEntityInteractions() {
        gameState.entities.forEach(ent => {
            if (!ent.markedForDeletion && checkEntityCollision(this, ent)) {
                if (ent instanceof Collectible) {
                    ent.collect();
                } else if (ent instanceof ExitPortal) {
                    gameState.gamePhase = "GAME_OVER_WIN";
                }
            }
        });
    }

    render(p) {
        if (this.iframes > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) return; // Blink
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        
        // Body
        p.fill(COLORS.PLAYER);
        p.noStroke();
        p.rect(-this.width/2, -this.height/2, this.width, this.height, 4);
        
        // Visor
        p.fill(COLORS.PLAYER_VISOR);
        p.rect(0, -10, 8, 8);
        
        // Backpack
        p.fill(150);
        p.rect(-16, -8, 6, 16);
        
        // Whip (during attack)
        if (this.isAttacking) {
            p.stroke(255);
            p.strokeWeight(3);
            p.noFill();
            p.beginShape();
            p.vertex(10, 0);
            p.vertex(25, -5);
            p.vertex(35, 10);
            p.endShape();
        }
        
        p.pop();
    }
}

// --- Enemies ---

export class Enemy extends Entity {
    constructor(x, y, w, h, hp) {
        super(x, y, w, h);
        this.hp = hp;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
            spawnParticles(this.x + this.width/2, this.y + this.height/2, 'dust', 10);
            gameState.score += 100; // Kill score
        }
    }
    
    checkPlayerCollision() {
        const player = gameState.player;
        if (player && !player.iframes && checkEntityCollision(this, player)) {
            // Check if player jumped on head
            if (player.vy > 0 && player.y + player.height < this.y + this.height / 2) {
                this.takeDamage(5); // Stomp kills usually
                player.vy = -6; // Bounce
            } else {
                player.takeDamage(1);
            }
        }
    }
}

export class Snake extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 20, 2);
        this.speed = 2;
        this.vx = this.speed;
        this.color = COLORS.ENEMY_SNAKE;
    }
    
    update(p) {
        this.vy += GRAVITY;
        
        // Patrol logic
        // Check if about to fall off edge or hit wall
        // Look ahead
        let lookAheadX = this.vx > 0 ? this.x + this.width + 5 : this.x - 5;
        let mapCollision = checkEntityCollision({x: lookAheadX, y: this.y, width: 2, height: this.height}, {x:0, y:0, width:0, height:0}); // Dummy check actually handled by resolveMapCollision
        
        // Better edge detection: check tile under lookahead
        let tileX = Math.floor(lookAheadX / TILE_SIZE);
        let tileY = Math.floor((this.y + this.height + 2) / TILE_SIZE);
        
        let aboutToFall = false;
        if (tileX >= 0 && tileX < gameState.tiles.length && tileY >= 0 && tileY < gameState.tiles[0].length) {
            if (gameState.tiles[tileX][tileY] === 0) aboutToFall = true; // Empty space below ahead
        }

        resolveMapCollision(this);
        
        if (this.vx === 0 || aboutToFall) {
            this.vx *= -1; // Turn around
        }
        
        // Apply movement
        if (Math.abs(this.vx) < 0.1) this.vx = this.speed; // Unstuck
        
        this.checkPlayerCollision();
    }
    
    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height, 4);
        // Eye
        p.fill(0);
        if (this.vx > 0) p.rect(this.x + 20, this.y + 4, 4, 4);
        else p.rect(this.x + 4, this.y + 4, 4, 4);
    }
}

export class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 1);
        this.state = 'SLEEP'; // SLEEP, ATTACK, RETURN
        this.originX = x;
        this.originY = y;
        this.color = COLORS.ENEMY_BAT;
    }
    
    update(p) {
        const player = gameState.player;
        if (!player) return;
        
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (this.state === 'SLEEP') {
            if (dist < 150 && player.y > this.y) {
                // Line of sight check could go here
                this.state = 'ATTACK';
            }
        } else if (this.state === 'ATTACK') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx = Math.cos(angle) * 3;
            this.vy = Math.sin(angle) * 3;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // If passed player or too far, give up
            if (dist > 300) this.state = 'RETURN';
        } else if (this.state === 'RETURN') {
            const angle = Math.atan2(this.originY - this.y, this.originX - this.x);
            this.vx = Math.cos(angle) * 2;
            this.vy = Math.sin(angle) * 2;
            this.x += this.vx;
            this.y += this.vy;
            
            if (Math.hypot(this.originX - this.x, this.originY - this.y) < 5) {
                this.x = this.originX;
                this.y = this.originY;
                this.vx = 0;
                this.vy = 0;
                this.state = 'SLEEP';
            }
        }
        
        this.checkPlayerCollision();
    }
    
    render(p) {
        p.fill(this.color);
        p.circle(this.x + this.width/2, this.y + this.height/2, this.width);
        // Wings
        if (this.state !== 'SLEEP') {
            p.triangle(this.x, this.y + 10, this.x - 10, this.y, this.x, this.y - 5);
            p.triangle(this.x + this.width, this.y + 10, this.x + this.width + 10, this.y, this.x + this.width, this.y - 5);
        }
    }
}

export class WalkerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 30, 3);
        this.vx = 1;
        this.color = [255, 100, 100];
        this.jumpTimer = 0;
    }
    
    update(p) {
        this.vy += GRAVITY;
        resolveMapCollision(this);
        
        if (this.vx === 0) this.vx = Math.random() > 0.5 ? 2 : -2;
        
        // Random jump
        if (this.onGround && Math.random() < 0.02) {
            this.vy = -8;
            this.onGround = false;
        }
        
        this.checkPlayerCollision();
    }
    
    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
        // Antenna
        p.stroke(255);
        p.line(this.x + 15, this.y, this.x + 15, this.y - 10);
    }
}

// --- Collectibles ---

export class Collectible extends Entity {
    constructor(x, y, value) {
        super(x, y, 20, 20);
        this.value = value;
        this.bobOffset = 0;
        this.initialY = y;
    }
    
    update(p) {
        this.bobOffset = Math.sin(gameState.frameCount * 0.1) * 3;
        this.y = this.initialY + this.bobOffset;
    }
    
    collect() {
        this.markedForDeletion = true;
        gameState.score += this.value;
        spawnParticles(this.x + 10, this.y + 10, 'gem_shine', 5);
        spawnFloatingText(this.x, this.y - 10, "+" + this.value, COLORS.GOLD);
    }
}

export class Gold extends Collectible {
    constructor(x, y) {
        super(x, y, 100);
        this.color = COLORS.GOLD;
    }
    
    render(p) {
        p.fill(this.color);
        p.noStroke();
        p.circle(this.x + 10, this.y + 10, 15);
    }
}

export class Gem extends Collectible {
    constructor(x, y) {
        super(x, y, 500);
        this.color = COLORS.GEM;
    }
    
    render(p) {
        p.fill(this.color);
        p.noStroke();
        p.push();
        p.translate(this.x + 10, this.y + 10);
        p.rotate(gameState.frameCount * 0.05);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 12, 12);
        p.pop();
    }
}

export class Heart extends Collectible {
    constructor(x, y) {
        super(x, y, 0);
    }
    
    collect() {
        if (gameState.player.hp < gameState.player.maxHp) {
            gameState.player.hp++;
            super.collect();
            spawnFloatingText(this.x, this.y, "HP UP", [255, 50, 50]);
        }
    }
    
    render(p) {
        p.fill(255, 50, 50);
        p.noStroke();
        p.circle(this.x + 10, this.y + 10, 12);
    }
}

// --- Exit ---
export class ExitPortal extends Entity {
    constructor(x, y) {
        super(x, y, 40, 50);
    }
    
    update(p) {
        // Static
    }
    
    render(p) {
        p.fill(COLORS.EXIT);
        p.noStroke();
        p.ellipse(this.x + 20, this.y + 25, 40, 60);
        // Swirl effect
        p.fill(0);
        p.circle(this.x + 20 + Math.sin(gameState.frameCount * 0.2) * 10, this.y + 25 + Math.cos(gameState.frameCount * 0.2) * 10, 10);
    }
}