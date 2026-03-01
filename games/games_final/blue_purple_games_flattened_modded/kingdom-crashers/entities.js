/**
 * entities.js
 * Contains all game entity classes: Player, Enemy, Projectile.
 * Implements State Machine pattern for character behavior.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRAVITY, FRICTION, AIR_RESISTANCE } from './globals.js';
import { constrainToLevel, checkAttackHit } from './physics.js';
import { spawnParticles, spawnDamageNumber } from './particles.js';

// Base Entity Class
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y; // Depth
        this.z = 0; // Altitude
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        
        this.width = 30;
        this.height = 60;
        this.facing = 1; // 1 = right, -1 = left
        this.dead = false;
        
        // Z-Ordering Sort Key
        this.depth = 0; 
    }

    update() {
        this.depth = this.y; // Update depth for sorting
    }

    render(p) {}
}

/**
 * Character Entity (Player and Enemies)
 * Handles physics, health, and combat states.
 */
class Character extends Entity {
    constructor(x, y) {
        super(x, y);
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 4;
        this.damage = 10;
        this.defense = 0;
        
        // Combat State
        this.state = "IDLE"; // IDLE, RUN, JUMP, ATTACK, BLOCK, HIT, DEAD
        this.stateTimer = 0;
        this.comboCount = 0;
        this.isGrounded = true;
        this.hitStun = 0;
        
        // Animation
        this.animFrame = 0;
        this.bobbing = 0;
    }

    update(p) {
        super.update();

        // Physics: Gravity on Z axis
        if (this.z > 0 || this.vz > 0) {
            this.vz -= GRAVITY;
            this.isGrounded = false;
        } else {
            this.z = 0;
            this.vz = 0;
            this.isGrounded = true;
        }

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Friction
        if (this.isGrounded) {
            this.vx *= FRICTION;
            this.vy *= FRICTION;
        } else {
            this.vx *= AIR_RESISTANCE;
            this.vy *= AIR_RESISTANCE;
        }

        // Animation counters
        this.stateTimer++;
        this.animFrame += 0.2;
        this.bobbing = Math.sin(this.animFrame) * 2;

        constrainToLevel(this);

        // Death check
        if (this.health <= 0 && this.state !== "DEAD") {
            this.setState("DEAD");
        }
    }

    setState(newState) {
        if (this.state === "DEAD") return;
        this.state = newState;
        this.stateTimer = 0;
        this.animFrame = 0;
    }

    takeDamage(amount, fromX) {
        if (this.state === "DEAD") return;

        // Block logic
        if (this.state === "BLOCK") {
            // Check if facing damage source
            const diffX = fromX - this.x;
            if ((diffX > 0 && this.facing === 1) || (diffX < 0 && this.facing === -1)) {
                // Successfully blocked
                spawnParticles(this.x, this.y, this.z + 40, 3, 'spark');
                return; // No damage
            }
        }

        this.health -= amount;
        spawnDamageNumber(this.x, this.y, this.z, amount, false);
        spawnParticles(this.x, this.y, this.z + 40, 5, 'blood');

        // Knockback
        const dir = this.x < fromX ? -1 : 1;
        this.vx = dir * 5;
        this.vz = 3; // Pop up slightly

        if (this.health <= 0) {
            this.setState("DEAD");
        } else {
            this.setState("HIT");
            this.hitStun = 20;
        }
    }

    // Drawing helper for shadows
    drawShadow(p) {
        p.push();
        p.noStroke();
        p.fill(0, 0, 0, 50);
        // Shadow scales with height to fake height
        let scale = 1 - Math.min(this.z / 200, 0.5);
        p.ellipse(0, 0, this.width * scale, this.width * 0.4 * scale);
        p.pop();
    }
}

/**
 * Player Class
 */
export class Player extends Character {
    constructor(x, y) {
        super(x, y);
        this.name = "Knight";
        this.attackCooldown = 0;
    }

    update(p) {
        if (this.state === "DEAD") {
            super.update(p);
            // Handle Game Over transition after delay
            if (this.stateTimer > 120) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            }
            return;
        }

        // Handle Input (only if not in Hitstun)
        if (this.state !== "HIT" && this.state !== "ATTACK") {
            this.handleMovementInput(p);
            this.handleActionInput(p);
        } else if (this.state === "HIT") {
            this.hitStun--;
            if (this.hitStun <= 0) {
                this.setState("IDLE");
            }
        } else if (this.state === "ATTACK") {
            // Attack animation lock
            if (this.stateTimer > 20) { // End of attack
                this.setState("IDLE");
            }
            // Combo chaining window
            if (this.stateTimer > 10 && gameState.input.attack && this.comboCount < 3) {
                this.comboCount++;
                this.setState("ATTACK");
                this.executeAttack(p);
            }
        }

        // Camera Follow
        const targetCamX = this.x - CANVAS_WIDTH / 2;
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        
        // Clamp Camera
        gameState.cameraX = p.constrain(gameState.cameraX, 0, 2000 - CANVAS_WIDTH);

        super.update(p);
    }

    handleMovementInput(p) {
        const input = gameState.input;
        let moving = false;

        // Reset velocities (instant movement feel)
        if (this.isGrounded) {
            this.vx = 0;
            this.vy = 0;
        }

        if (input.left) {
            this.vx = -this.speed;
            this.facing = -1;
            moving = true;
        }
        if (input.right) {
            this.vx = this.speed;
            this.facing = 1;
            moving = true;
        }
        if (input.up) {
            this.vy = -this.speed * 0.7; // Slower depth movement
            moving = true;
        }
        if (input.down) {
            this.vy = this.speed * 0.7;
            moving = true;
        }

        if (input.jump && this.isGrounded) {
            this.vz = 10;
            this.setState("JUMP");
            spawnParticles(this.x, this.y, 0, 3, 'dust');
        } else if (moving && this.state !== "JUMP") {
            this.setState("RUN");
            if (p.frameCount % 10 === 0 && this.isGrounded) {
                spawnParticles(this.x, this.y, 0, 1, 'dust');
            }
        } else if (this.state !== "JUMP") {
            this.setState("IDLE");
        }
    }

    handleActionInput(p) {
        const input = gameState.input;
        
        if (input.block) {
            this.setState("BLOCK");
            this.vx = 0;
            this.vy = 0;
            return;
        }

        if (input.attack && this.attackCooldown <= 0) {
            this.comboCount = 1;
            this.setState("ATTACK");
            this.executeAttack(p);
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    executeAttack(p) {
        // Hitbox parameters
        const reach = 50;
        const height = 40;
        
        // Check for enemies in range
        gameState.enemies.forEach(enemy => {
            if (checkAttackHit(this, { offsetX: 30, offsetY: 30, width: reach, height: height }, enemy)) {
                // Determine Crit
                const isCrit = Math.random() < 0.1;
                const dmg = isCrit ? this.damage * 2 : this.damage;
                
                enemy.takeDamage(dmg, this.x);
                spawnParticles(enemy.x, enemy.y, enemy.z + 30, 2, 'spark');
                
                // Screen shake on hit
                gameState.cameraShake = 2;
            }
        });

        // Lunge forward slightly
        this.vx = this.facing * 2;
    }

    render(p) {
        const sx = this.x - gameState.cameraX;
        const sy = this.y - this.z - gameState.cameraY;
        
        // Shadow relative to ground
        p.push();
        p.translate(sx, this.y - gameState.cameraY);
        this.drawShadow(p);
        p.pop();

        p.push();
        p.translate(sx, sy);

        // Death Animation: Lie down horizontally
        if (this.state === "DEAD") {
            p.rotate(p.PI / 2); 
        }

        if (this.facing === -1) p.scale(-1, 1);
        
        // Flash on hit
        if (this.state === "HIT" && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.tint(255, 100, 100);
        }

        // --- DRAW KNIGHT ---
        
        // Legs (animated)
        p.fill(COLORS.playerTunicDark);
        p.stroke(0);
        let legOffset = 0;
        if (this.state === "RUN") legOffset = Math.sin(this.animFrame) * 10;
        
        p.rect(-10 + legOffset, -20, 8, 20); // Back leg
        p.rect(2 - legOffset, -20, 8, 20);  // Front leg

        // Body
        p.fill(COLORS.playerTunic);
        p.rect(-15, -50, 30, 35, 5);
        // Chest emblem
        p.fill(255);
        p.noStroke();
        p.rect(-5, -45, 10, 15); // Cross vertical
        p.rect(-10, -40, 20, 5); // Cross horizontal
        p.stroke(0);

        // Head/Helmet
        p.fill(COLORS.playerMetal);
        p.rect(-12, -75 + this.bobbing, 24, 25, 5); // Helmet shape
        p.fill(0); // Visor
        p.rect(-10, -68 + this.bobbing, 20, 4);
        p.rect(0, -68 + this.bobbing, 2, 10); // Vertical slit

        // Arms & Weapon
        p.fill(COLORS.playerSkin);
        
        if (this.state === "ATTACK") {
            // Sword Swipe Animation
            p.push();
            p.translate(10, -40);
            const swipeAngle = p.map(this.stateTimer, 0, 20, -p.PI/2, p.PI/2);
            p.rotate(swipeAngle);
            
            // Sword
            p.fill(COLORS.playerMetal);
            p.rect(0, -40, 6, 40); // Blade
            p.fill(COLORS.playerMetalDark);
            p.rect(-4, 0, 14, 4); // Hilt guard
            p.fill('brown');
            p.rect(-2, 4, 10, 10); // Handle
            
            // Swipe Trail
            p.noFill();
            p.stroke(255, 255, 255, 150);
            p.strokeWeight(2);
            p.arc(0, 0, 80, 80, -p.PI/4, p.PI/4);
            
            p.pop();
        } else if (this.state === "BLOCK") {
             // Shield Up
             p.fill(COLORS.playerMetal);
             p.rect(5, -45, 5, 20); // Arm
             // Shield
             p.fill('brown');
             p.strokeWeight(2);
             p.rect(10, -50, 10, 35);
        } else {
             // Idle Arms
             p.fill(COLORS.playerSkin);
             p.rect(12, -45 + this.bobbing, 8, 20); // Front arm
             // Sword held
             p.fill(COLORS.playerMetal);
             p.push();
             p.translate(16, -25 + this.bobbing);
             p.rotate(-p.PI/4);
             p.rect(0, -30, 4, 30);
             p.pop();
        }

        p.pop();
    }
}

/**
 * Enemy Base Class
 */
export class Enemy extends Character {
    constructor(x, y, type) {
        super(x, y);
        this.type = type || "BARBARIAN";
        this.detectionRange = 300;
        this.attackRange = 40;
        this.attackCooldownMax = 60;
        this.attackTimer = Math.random() * 60;
        
        // Stats based on type
        if (this.type === "BOSS") {
            this.maxHealth = 300;
            this.health = 300;
            this.scale = 1.5;
            this.damage = 25;
            this.width = 50;
        } else if (this.type === "ARCHER") {
            this.maxHealth = 40;
            this.health = 40;
            this.attackRange = 250;
            this.scale = 1;
        } else {
            // Barbarian
            this.maxHealth = 60;
            this.health = 60;
            this.scale = 1;
        }
    }

    update(p) {
        if (this.state === "DEAD") {
            super.update(p);
            // Fade out body or remove after time
            if (this.stateTimer > 100) {
                // Remove from game
                const idx = gameState.enemies.indexOf(this);
                if (idx > -1) {
                    gameState.enemies.splice(idx, 1);
                    gameState.score += 100;
                    gameState.enemiesKilled++;
                }
            }
            return;
        }

        if (this.state === "HIT") {
            this.hitStun--;
            if (this.hitStun <= 0) this.setState("IDLE");
            super.update(p);
            return;
        }

        // AI Logic
        const player = gameState.player;
        if (!player || player.state === "DEAD") {
            this.setState("IDLE");
            super.update(p);
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Facing
        if (dx !== 0) this.facing = dx > 0 ? 1 : -1;

        if (dist < this.detectionRange) {
            // Decide Action
            if (dist < this.attackRange && Math.abs(dy) < 20) {
                // Attack range
                if (this.attackTimer <= 0) {
                    this.setState("ATTACK");
                    this.attackTimer = this.attackCooldownMax;
                    
                    // Attack Execution (delayed for animation)
                    setTimeout(() => {
                        if (this.state === "ATTACK" && !this.dead) {
                             if (checkAttackHit(this, { offsetX: 30, offsetY: 30, width: 40, height: 40 }, player)) {
                                 player.takeDamage(this.damage, this.x);
                             }
                        }
                    }, 300); // Hit frame
                }
            } else {
                // Chase
                this.setState("RUN");
                this.vx = (dx / dist) * (this.speed * 0.5);
                this.vy = (dy / dist) * (this.speed * 0.5);
            }
        } else {
            this.setState("IDLE");
            this.vx = 0;
            this.vy = 0;
        }
        
        if (this.attackTimer > 0) this.attackTimer--;

        // Attack state handling
        if (this.state === "ATTACK") {
            this.vx = 0;
            this.vy = 0;
            if (this.stateTimer > 40) this.setState("IDLE");
        }

        super.update(p);
    }

    render(p) {
        const sx = this.x - gameState.cameraX;
        const sy = this.y - this.z - gameState.cameraY;

        p.push();
        p.translate(sx, this.y - gameState.cameraY);
        this.drawShadow(p);
        p.pop();

        p.push();
        p.translate(sx, sy);
        
        // Death Animation: Lie down horizontally
        if (this.state === "DEAD") {
            p.rotate(p.PI / 2);
        }

        p.scale(this.facing * this.scale, this.scale);

        // Flash red on hit
        if (this.state === "HIT") p.fill(255, 100, 100);
        else if (this.type === "BOSS") p.fill(COLORS.bossTunic);
        else p.fill(COLORS.enemyTunic);

        p.stroke(0);

        // Legs
        let legOffset = 0;
        if (this.state === "RUN") legOffset = Math.sin(this.animFrame) * 8;
        p.rect(-8 + legOffset, -20, 6, 20);
        p.rect(2 - legOffset, -20, 6, 20);

        // Body
        p.rect(-15, -50, 30, 35, 5);
        if (this.type === "BOSS") {
            p.fill(COLORS.bossHighlight); // Boss marks
            p.triangle(-5, -45, 5, -45, 0, -35);
        }

        // Head
        p.fill(COLORS.enemySkin);
        p.rect(-12, -70 + this.bobbing, 24, 22, 5);
        
        // Eyes
        p.fill(0);
        p.circle(-5, -62 + this.bobbing, 3);
        p.circle(5, -62 + this.bobbing, 3);
        
        // Angry eyebrows
        p.strokeWeight(2);
        p.line(-8, -66 + this.bobbing, -2, -64 + this.bobbing);
        p.line(8, -66 + this.bobbing, 2, -64 + this.bobbing);
        p.strokeWeight(1);

        // Horns for Boss
        if (this.type === "BOSS") {
            p.fill(200);
            p.triangle(-12, -65, -20, -75, -10, -70);
            p.triangle(12, -65, 20, -75, 10, -70);
        }

        // Weapon
        if (this.state === "ATTACK") {
            p.push();
            p.translate(15, -35);
            p.rotate(p.sin(this.stateTimer * 0.2) * 2); // Swing
            p.fill(100);
            p.rect(0, -30, 10, 30); // Club/Axe
            p.pop();
        } else {
            p.fill(100);
            p.rect(10, -45 + this.bobbing, 5, 25);
        }

        p.pop();
        
        // Health Bar above enemy
        if (this.health < this.maxHealth && this.state !== "DEAD") {
            p.push();
            p.translate(sx, sy - 80);
            p.noStroke();
            p.fill(COLORS.healthBarBg);
            p.rect(-15, 0, 30, 5);
            p.fill(COLORS.healthBarFill);
            p.rect(-15, 0, 30 * (this.health / this.maxHealth), 5);
            p.pop();
        }
    }
}