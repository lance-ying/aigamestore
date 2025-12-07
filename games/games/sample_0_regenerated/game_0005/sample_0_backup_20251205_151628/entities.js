/**
 * entities.js
 * Classes for Player, Enemies, Items.
 */

import { gameState, TILE_SIZE, GRAVITY, FRICTION, ACCELERATION, MAX_SPEED, JUMP_FORCE, COLORS, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { KEYS, isKeyDown } from './input.js';
import { TILE } from './level.js';
import { checkAABB, generateID, constrain } from './utils.js';
import { spawnParticles } from './particles.js';
// Corrected import path for p5.collide2d as an ES module
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/dist/p5.collide2d.min.js?module';

class Entity {
    constructor(x, y, w, h) {
        this.id = generateID();
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.dead = false;
    }

    update(p) {
        // Default physics
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
    }

    resolveMapCollision() {
        if (!gameState.level) return;

        // Horizontal
        let leftTile = Math.floor(this.x / TILE_SIZE);
        let rightTile = Math.floor((this.x + this.w - 0.1) / TILE_SIZE);
        let topTile = Math.floor(this.y / TILE_SIZE);
        let bottomTile = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);

        // Check walls (left/right)
        // We check top and bottom points on each side
        
        // Right collision
        if (this.vx > 0) {
            if (this.isSolid(rightTile, topTile) || this.isSolid(rightTile, bottomTile)) {
                this.x = rightTile * TILE_SIZE - this.w;
                this.vx = 0;
            }
        }
        // Left collision
        else if (this.vx < 0) {
            if (this.isSolid(leftTile, topTile) || this.isSolid(leftTile, bottomTile)) {
                this.x = (leftTile + 1) * TILE_SIZE;
                this.vx = 0;
            }
        }

        // Re-calc for vertical
        leftTile = Math.floor(this.x / TILE_SIZE);
        rightTile = Math.floor((this.x + this.w - 0.1) / TILE_SIZE);
        topTile = Math.floor(this.y / TILE_SIZE);
        bottomTile = Math.floor((this.y + this.h - 0.1) / TILE_SIZE);

        this.isGrounded = false;

        // Bottom collision
        if (this.vy > 0) {
            if (this.isSolid(leftTile, bottomTile) || this.isSolid(rightTile, bottomTile)) {
                this.y = bottomTile * TILE_SIZE - this.h;
                this.vy = 0;
                this.isGrounded = true;
            }
        }
        // Top collision
        else if (this.vy < 0) {
            if (this.isSolid(leftTile, topTile) || this.isSolid(rightTile, topTile)) {
                this.y = (topTile + 1) * TILE_SIZE;
                this.vy = 0;
            }
        }
    }

    isSolid(tx, ty) {
        const tile = gameState.level.getTileAt(tx, ty);
        return tile === TILE.DIRT || tile === TILE.ROCK;
    }

    render(p) {
        // Placeholder
        p.fill(255);
        p.rect(this.x, this.y, this.w, this.h);
    }
    
    getCenter() {
        return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 32); // Slightly smaller than tile
        this.health = 4;
        this.maxHealth = 4;
        this.facing = 1; // 1 Right, -1 Left
        this.state = 'IDLE'; // IDLE, RUN, JUMP, CLIMB, ATTACK, HIT
        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.onLadder = false;
        this.invulnerable = 0;
    }

    update(p) {
        this.handleInput(p);
        
        // Ladder Logic overrides gravity
        if (this.onLadder) {
            this.x += this.vx;
            this.y += this.vy;
            // No gravity on ladder
            this.vx = 0; 
            this.vy = 0; 
        } else {
            // Apply Gravity
            this.vy += GRAVITY;
            this.vx *= FRICTION;
            
            // Move
            this.x += this.vx;
            this.y += this.vy;
        }

        // Map Collision
        this.resolveMapCollision();
        
        // Check Ladder Intersection
        this.checkLadder();

        // Check Exit
        this.checkExit();

        // Updates timers
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackTimer > 0) {
            this.attackTimer--;
            // Attack hitbox logic
            if (this.attackTimer === 10) { // Active frame
                this.performAttack(p);
            }
        }
        if (this.invulnerable > 0) this.invulnerable--;

        // Screen Log
        if (gameState.frameCount % 10 === 0) {
            if (p.logs && p.logs.player_info) {
                p.logs.player_info.push({
                    x: this.x,
                    y: this.y,
                    health: this.health,
                    state: this.state,
                    framecount: gameState.frameCount
                });
            }
        }
        
        if (this.y > gameState.level.rows * TILE_SIZE) {
            this.die();
        }
    }

    handleInput(p) {
        if (this.attackTimer > 0) return; // Cannot move while attacking

        const control = window.get_automated_testing_action ? window.get_automated_testing_action(gameState) : null;
        
        const left = isKeyDown(KEYS.LEFT) || (control && control.keyCode === KEYS.LEFT);
        const right = isKeyDown(KEYS.RIGHT) || (control && control.keyCode === KEYS.RIGHT);
        const up = isKeyDown(KEYS.UP) || (control && control.keyCode === KEYS.UP);
        const down = isKeyDown(KEYS.DOWN) || (control && control.keyCode === KEYS.DOWN);
        const jump = isKeyDown(KEYS.SPACE) || (control && control.keyCode === KEYS.SPACE);
        const sprint = isKeyDown(KEYS.SHIFT);
        const attack = isKeyDown(KEYS.Z) || (control && control.keyCode === KEYS.Z);

        // Movement
        let speed = sprint ? MAX_SPEED * 1.5 : MAX_SPEED;

        if (this.onLadder) {
            this.vy = 0;
            if (up) this.vy = -3;
            if (down) this.vy = 3;
            if (left) this.x -= 2;
            if (right) this.x += 2;
            if (jump) {
                this.onLadder = false;
                this.vy = JUMP_FORCE;
            }
        } else {
            if (left) {
                this.vx -= ACCELERATION;
                this.facing = -1;
            }
            if (right) {
                this.vx += ACCELERATION;
                this.facing = 1;
            }
            this.vx = constrain(this.vx, -speed, speed);

            // Jump
            if (jump && this.isGrounded) {
                this.vy = JUMP_FORCE;
                this.isGrounded = false;
                spawnParticles(this.x + this.w/2, this.y + this.h, 'DUST', 5);
            }
        }

        // Attack
        if (attack && this.attackCooldown === 0) {
            this.state = 'ATTACK';
            this.attackTimer = 20;
            this.attackCooldown = 30;
        }
    }

    checkLadder() {
        const center = this.getCenter();
        const tile = gameState.level.getTileAtPixel(center.x, center.y);
        
        if (tile === TILE.LADDER) {
            // If pressing up/down, grab ladder
            const up = isKeyDown(KEYS.UP);
            const down = isKeyDown(KEYS.DOWN);
            
            // Also check automation
            const control = window.get_automated_testing_action ? window.get_automated_testing_action(gameState) : null;
            const autoUp = control && control.keyCode === KEYS.UP;
            const autoDown = control && control.keyCode === KEYS.DOWN;

            if ((up || down || autoUp || autoDown) && !this.onLadder) {
                this.onLadder = true;
                this.vx = 0;
                // Snap to center of ladder horizontally
                const tx = Math.floor(center.x / TILE_SIZE);
                this.x = tx * TILE_SIZE + (TILE_SIZE - this.w)/2;
            }
        } else {
            this.onLadder = false;
        }
    }

    checkExit() {
        const center = this.getCenter();
        const tile = gameState.level.getTileAtPixel(center.x, center.y);
        if (tile === TILE.EXIT) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    performAttack(p) {
        // Create hitbox in front
        const hitbox = {
            x: this.facing === 1 ? this.x + this.w : this.x - 40,
            y: this.y + 5,
            w: 40,
            h: 20
        };

        // Check enemies
        gameState.enemies.forEach(e => {
            if (!e.dead && checkAABB(hitbox, e)) {
                e.takeDamage(1);
                spawnParticles(e.x + e.w/2, e.y + e.h/2, 'BLOOD', 5);
            }
        });
        
        // Spawn whip particles
        spawnParticles(hitbox.x + hitbox.w/2, hitbox.y + hitbox.h/2, 'DEBRIS', 3);
    }

    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        this.health -= amount;
        this.invulnerable = 60;
        spawnParticles(this.x + this.w/2, this.y + this.h/2, 'BLOOD', 10);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Blink if invulnerable
        if (this.invulnerable > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) {
            p.pop();
            return;
        }

        // Draw Player Body
        p.fill(COLORS.PLAYER);
        p.rect(0, 0, this.w, this.h, 4);

        // Draw Eyes
        p.fill(0);
        if (this.facing === 1) {
            p.rect(14, 8, 4, 4);
            p.rect(18, 8, 2, 4);
        } else {
            p.rect(6, 8, 4, 4);
            p.rect(4, 8, 2, 4);
        }

        // Draw Hat/Helmet
        p.fill(COLORS.GOLD);
        p.rect(-2, -4, this.w + 4, 8);
        p.fill(200, 200, 50);
        p.circle(this.w/2, -4, 10);

        // Draw Whip (if attacking)
        if (this.attackTimer > 0) {
            p.stroke(COLORS.PLAYER_WHIP);
            p.strokeWeight(4);
            p.noFill();
            if (this.facing === 1) {
                p.line(this.w/2, this.h/2, this.w + 30, this.h/2);
            } else {
                p.line(this.w/2, this.h/2, -30, this.h/2);
            }
        }

        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // 'SNAKE', 'BAT'
        this.health = 2;
        this.speed = 1.5;
        this.dir = 1;
        
        if (type === 'BAT') {
            this.active = false; // Bat hangs until player is close
        }
    }

    update(p) {
        if (this.dead) return;

        if (this.type === 'SNAKE') {
            this.updateSnake(p);
        } else if (this.type === 'BAT') {
            this.updateBat(p);
        }

        // Check collision with player
        if (!gameState.player.invulnerable && collideRectRect(this.x, this.y, this.w, this.h, gameState.player.x, gameState.player.y, gameState.player.w, gameState.player.h)) {
            gameState.player.takeDamage(1);
        }
    }

    updateSnake(p) {
        this.vy += GRAVITY;
        this.x += this.speed * this.dir;
        this.y += this.vy;

        this.resolveMapCollision();

        // Check edges (turn around if about to fall)
        if (this.isGrounded) {
            const lookAheadX = this.dir === 1 ? this.x + this.w + 5 : this.x - 5;
            const tx = Math.floor(lookAheadX / TILE_SIZE);
            const ty = Math.floor((this.y + this.h + 2) / TILE_SIZE);
            
            // Check for wall
            const wallTx = Math.floor(lookAheadX / TILE_SIZE);
            const wallTy = Math.floor((this.y + this.h/2) / TILE_SIZE);

            if (!this.isSolid(tx, ty) || this.isSolid(wallTx, wallTy)) {
                this.dir *= -1;
            }
        }
    }

    updateBat(p) {
        const dist = Math.sqrt(distSq(this.x, this.y, gameState.player.x, gameState.player.y));
        
        if (!this.active) {
            // Check trigger
            if (dist < 200) {
                this.active = true;
            }
        } else {
            // Fly towards player
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            this.vx = Math.cos(angle) * (this.speed * 1.2);
            this.vy = Math.sin(angle) * (this.speed * 1.2);

            this.x += this.vx;
            this.y += this.vy;
            
            // Simple bounce off walls
            if (this.isSolid(Math.floor(this.x/TILE_SIZE), Math.floor(this.y/TILE_SIZE))) {
                this.vx *= -1;
                this.vy *= -1;
                this.x += this.vx * 2;
                this.y += this.vy * 2;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.dead = true;
            // Spawn gold chance
            gameState.score += 100;
        }
    }

    render(p) {
        if (this.dead) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === 'SNAKE') {
            p.fill(COLORS.ENEMY_SNAKE);
            p.rect(0, 10, this.w, 20); // Low profile
            // Eyes
            p.fill(255);
            if (this.dir === 1) p.rect(20, 12, 4, 4);
            else p.rect(4, 12, 4, 4);
        } else if (this.type === 'BAT') {
            p.fill(COLORS.ENEMY_BAT);
            if (!this.active) {
                // Hanging
                p.triangle(0, 0, this.w, 0, this.w/2, this.h);
            } else {
                // Flying
                p.rect(5, 10, 20, 10);
                // Wings
                if (Math.floor(p.frameCount / 5) % 2 === 0) {
                    p.triangle(-10, 0, 5, 15, 5, 10);
                    p.triangle(this.w+10, 0, this.w-5, 15, this.w-5, 10);
                } else {
                    p.triangle(-10, 20, 5, 15, 5, 10);
                    p.triangle(this.w+10, 20, this.w-5, 15, this.w-5, 10);
                }
            }
        }

        p.pop();
    }
}

export class Collectible extends Entity {
    constructor(x, y, type) {
        super(x + 10, y + 10, 20, 20);
        this.type = type; // 'GOLD', 'GEM'
        this.value = type === 'GOLD' ? 500 : 1000;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI;
    }

    update(p) {
        if (this.collected) return;
        
        // Bobbing
        this.y += Math.sin(p.frameCount * 0.1 + this.bobOffset) * 0.2;

        // Check collision
        if (collideRectRect(this.x, this.y, this.w, this.h, gameState.player.x, gameState.player.y, gameState.player.w, gameState.player.h)) {
            this.collected = true;
            gameState.score += this.value;
            spawnParticles(this.x + this.w/2, this.y + this.h/2, 'GOLD_SPARKLE', 10);
        }
    }

    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === 'GOLD') {
            p.fill(COLORS.GOLD);
            p.rect(2, 5, 16, 10, 2);
            p.fill(255, 255, 200, 100);
            p.rect(4, 7, 5, 3);
        } else {
            p.fill(COLORS.GEM);
            p.beginShape();
            p.vertex(10, 0);
            p.vertex(20, 10);
            p.vertex(10, 20);
            p.vertex(0, 10);
            p.endShape(p.CLOSE);
        }
        
        p.pop();
    }
}