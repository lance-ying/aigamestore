/**
 * Game entities including Player, Enemies, Collectibles, and Platforms.
 */

import { gameState, GRAVITY, PALETTE, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { checkAABB, applyPhysics, worldToScreen, isOnScreen } from './physics.js';
import { KEYS, isKeyDown } from './input.js';
import { createExplosion } from './particles.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.markedForDeletion = false;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    update(p) { /* Override */ }
    render(p) { /* Override */ }
}

// ------------------------------------------------------------------
// PLAYER CLASS
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60);
        this.speed = 5;
        this.jumpForce = -12;
        this.friction = 0.8;
        this.grounded = false;
        this.doubleJumpAvailable = true;
        this.health = 100;
        this.maxHealth = 100;
        this.invincible = false;
        this.invincibleTimer = 0;
        
        // State Machine
        this.state = "IDLE"; // IDLE, RUN, JUMP, ATTACK, DASH, HURT
        this.facing = 1; // 1 Right, -1 Left
        this.animTimer = 0;
        
        // Attack logic
        this.attackBox = { x: 0, y: 0, width: 40, height: 40, active: false };
        this.attackCooldown = 0;
    }

    update(p) {
        // 1. Input Handling
        this.handleInput(p);

        // 2. Physics
        this.ay += GRAVITY;
        applyPhysics(this);
        
        // 3. Collision with Platforms
        this.grounded = false;
        for (let platform of gameState.platforms) {
            // Only check if falling down and above platform
            if (this.vy >= 0 && 
                this.y + this.height <= platform.y + platform.height && // was above or inside
                this.x + this.width > platform.x && 
                this.x < platform.x + platform.width) {
                
                // Predicted next position check
                if (this.y + this.height + this.vy >= platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    this.doubleJumpAvailable = true;
                }
            }
        }
        
        // 4. Update State/Timers
        this.updateStatus();
        
        // 5. Attack Logic
        if (this.attackBox.active) {
            this.updateAttack();
        }

        // 6. Log Info
        if (p.frameCount % 10 === 0 && p.logs) {
            p.logs.player_info.push({
                x: this.x, y: this.y, 
                state: this.state, 
                health: this.health,
                framecount: p.frameCount
            });
        }
        
        // 7. Death Check
        if (this.y > CANVAS_HEIGHT + 200 || this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    handleInput(p) {
        // Movement is automatic in some runners, but we allow control here
        if (isKeyDown(KEYS.RIGHT)) {
            this.vx += 1;
            this.facing = 1;
            if (this.grounded) this.state = "RUN";
        } else if (isKeyDown(KEYS.LEFT)) {
            this.vx -= 1;
            this.facing = -1;
            if (this.grounded) this.state = "RUN";
        } else {
            if (this.grounded && this.state !== "ATTACK") this.state = "IDLE";
        }
        
        // Clamp speed
        const maxSpeed = this.state === "DASH" ? 10 : this.speed;
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        // State corrections
        if (!this.grounded && this.state !== "ATTACK" && this.state !== "DASH") {
            this.state = "JUMP";
        }
    }

    jump() {
        if (this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
            createExplosion(this.x + this.width/2, this.y + this.height, 5, 'dust');
        } else if (this.doubleJumpAvailable) {
            this.vy = this.jumpForce * 0.9;
            this.doubleJumpAvailable = false;
            createExplosion(this.x + this.width/2, this.y + this.height, 5, 'sparkle');
        }
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.state = "ATTACK";
            this.attackBox.active = true;
            this.attackCooldown = 20; // frames
            // Attack animation timer
            setTimeout(() => {
                this.state = "IDLE";
                this.attackBox.active = false;
            }, 300); // 300ms attack duration
        }
    }

    dash() {
        if (this.attackCooldown <= 0) {
            this.state = "DASH";
            this.vx = this.facing * 15; // Burst of speed
            this.invincible = true;
            this.invincibleTimer = 20;
            this.attackCooldown = 40;
            createExplosion(this.x, this.y + this.height/2, 10, 'dust');
        }
    }
    
    updateStatus() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
        this.animTimer += 0.2;
    }
    
    updateAttack() {
        // Position attack box relative to player
        this.attackBox.x = this.facing === 1 ? this.x + this.width : this.x - this.attackBox.width;
        this.attackBox.y = this.y + 10;
        
        // Check collisions with enemies
        gameState.enemies.forEach(enemy => {
            if (checkAABB(this.attackBox, enemy)) {
                enemy.takeDamage(10);
                createExplosion(enemy.x, enemy.y, 5, 'crumb');
            }
        });
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 60; // 1 sec invincibility
        this.vy = -5; // Knockback
        this.vx = -5 * this.facing;
        this.state = "HURT";
        createExplosion(this.x + this.width/2, this.y + this.height/2, 15, 'crumb');
    }

    render(p) {
        const pos = worldToScreen(this.x, this.y);
        
        p.push();
        p.translate(pos.x + this.width/2, pos.y + this.height/2);
        
        // Flicker if invincible
        if (this.invincible && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.pop();
            return;
        }

        // Scale based on facing
        p.scale(this.facing, 1);
        
        // Draw Cookie Body
        p.noStroke();
        p.fill(PALETTE.COOKIE_BODY);
        // Head
        p.circle(0, -this.height/3, 30);
        // Torso
        p.rectMode(p.CENTER);
        p.rect(0, 5, 25, 35, 8);
        
        // Legs (Animated)
        let legOffset = 0;
        if (this.state === "RUN") legOffset = Math.sin(this.animTimer) * 10;
        p.stroke(PALETTE.COOKIE_BODY);
        p.strokeWeight(8);
        p.line(-5, 20, -10 + legOffset, 35);
        p.line(5, 20, 10 - legOffset, 35);
        
        // Arms (Animated)
        let armAngle = 0;
        if (this.state === "ATTACK") armAngle = -Math.PI/2;
        else if (this.state === "RUN") armAngle = Math.cos(this.animTimer) * 0.5;
        
        p.push();
        p.translate(8, -5);
        p.rotate(armAngle);
        p.line(0, 0, 0, 15);
        
        // Candy Cane Weapon
        if (this.state === "ATTACK") {
            p.push();
            p.stroke(255, 0, 0);
            p.strokeWeight(4);
            p.translate(0, 15);
            p.rotate(-Math.PI/4);
            p.noFill();
            p.arc(10, 0, 20, 20, p.PI, 0); // Hook
            p.line(0, 0, 0, 30); // Stick
            p.pop();
        }
        p.pop(); // End Arm
        
        // Face
        p.noStroke();
        p.fill(255);
        p.circle(-6, -38, 6); // Eye L
        p.circle(6, -38, 6);  // Eye R
        p.fill(0);
        p.circle(-6, -38, 2); // Pupil
        p.circle(6, -38, 2);
        
        // Mouth
        p.noFill();
        p.stroke(255);
        p.strokeWeight(2);
        p.arc(0, -32, 10, 8, 0, p.PI);

        // Buttons
        p.fill(255);
        p.noStroke();
        p.circle(0, -5, 5);
        p.circle(0, 8, 5);

        // Debug Attack Box
        // if (this.attackBox.active) {
        //     p.fill(255, 0, 0, 100);
        //     p.rect(this.width/2 + this.attackBox.width/2, 0, this.attackBox.width, this.attackBox.height);
        // }

        p.pop();
    }
}

// ------------------------------------------------------------------
// ENEMY CLASS
// ------------------------------------------------------------------
export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 40, 40);
        this.type = type; // 'cake_hound', 'jelly_bat'
        this.health = 20;
        this.patrolStart = x;
        this.patrolDist = 100;
        this.dir = -1;
        this.speed = type === 'jelly_bat' ? 3 : 2;
        
        if (type === 'jelly_bat') {
            this.ay = 0; // Flying
            this.flyOffset = Math.random() * Math.PI;
        } else {
            this.ay = GRAVITY;
        }
    }

    update(p) {
        // Physics
        if (this.type !== 'jelly_bat') {
            this.ay = GRAVITY;
            this.vx = this.dir * this.speed;
        } else {
            this.vx = this.dir * this.speed;
            this.y += Math.sin(p.frameCount * 0.1 + this.flyOffset) * 2;
        }
        
        applyPhysics(this);
        
        // Platform collisions (Ground enemies only)
        if (this.type !== 'jelly_bat') {
            for (let platform of gameState.platforms) {
                if (this.vy >= 0 && 
                    this.y + this.height <= platform.y + platform.height &&
                    this.x + this.width > platform.x && 
                    this.x < platform.x + platform.width) {
                    
                    if (this.y + this.height + this.vy >= platform.y) {
                        this.y = platform.y - this.height;
                        this.vy = 0;
                    }
                }
            }
        }

        // AI Logic: Turn around
        if (Math.abs(this.x - this.patrolStart) > this.patrolDist) {
            this.dir *= -1;
        }
        
        // Player Collision (Damage)
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(10);
        }
        
        // Culling
        if (this.x < gameState.cameraX - 200) this.markedForDeletion = true;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            gameState.score += 100;
            createExplosion(this.x + this.width/2, this.y + this.height/2, 10, 'crumb');
        }
    }

    render(p) {
        if (!isOnScreen(this)) return;
        const pos = worldToScreen(this.x, this.y);
        
        p.push();
        p.translate(pos.x + this.width/2, pos.y + this.height/2);
        p.scale(this.dir, 1); // Face direction
        
        if (this.type === 'cake_hound') {
            // Body
            p.fill(PALETTE.ENEMY_CAKE);
            p.noStroke();
            p.rectMode(p.CENTER);
            p.rect(0, 0, 40, 30, 5);
            // Head
            p.circle(-15, -10, 20);
            // Ears
            p.fill(PALETTE.ENEMY_CREAM);
            p.triangle(-20, -20, -10, -20, -15, -30);
            // Legs
            p.stroke(PALETTE.ENEMY_CAKE);
            p.strokeWeight(5);
            const legSwing = Math.sin(p.frameCount * 0.2) * 5;
            p.line(-10, 15, -10 + legSwing, 25);
            p.line(10, 15, 10 - legSwing, 25);
        } else {
            // Bat
            p.fill(100, 0, 200);
            p.circle(0, 0, 30);
            // Wings
            p.fill(150, 50, 250);
            const wingFlap = Math.abs(Math.sin(p.frameCount * 0.5)) * 20;
            p.triangle(-10, 0, -30, -10 + wingFlap, -20, 10);
            p.triangle(10, 0, 30, -10 + wingFlap, 20, 10);
        }
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// COLLECTIBLE CLASS
// ------------------------------------------------------------------
export class Collectible extends Entity {
    constructor(x, y, type) {
        super(x, y, 20, 20);
        this.type = type; // 'jelly_red', 'jelly_yellow'
        this.value = type === 'jelly_red' ? 10 : 50;
        this.bobOffset = Math.random() * Math.PI;
        this.baseY = y;
        this.radius = 10;
    }

    update(p) {
        // Bobbing animation
        this.y = this.baseY + Math.sin(p.frameCount * 0.05 + this.bobOffset) * 5;
        
        // Collision with Player
        if (gameState.player && checkRectCircle(gameState.player, this)) {
            gameState.score += this.value;
            createExplosion(this.x, this.y, 5, 'sparkle');
            this.markedForDeletion = true;
        }
        
        if (this.x < gameState.cameraX - 200) this.markedForDeletion = true;
    }

    render(p) {
        if (!isOnScreen(this)) return;
        const pos = worldToScreen(this.x, this.y);
        
        p.push();
        p.translate(pos.x, pos.y);
        p.noStroke();
        if (this.type === 'jelly_red') p.fill(PALETTE.RED_JELLY);
        else p.fill(PALETTE.YELLOW_JELLY);
        
        p.circle(0, 0, this.radius * 2);
        
        // Shine
        p.fill(255, 255, 255, 100);
        p.circle(-3, -3, 5);
        p.pop();
    }
}

// ------------------------------------------------------------------
// PLATFORM CLASS
// ------------------------------------------------------------------
export class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }
    
    // Static entity, no update logic needed usually, unless moving platform
    
    render(p) {
        if (!isOnScreen(this)) return;
        const pos = worldToScreen(this.x, this.y);
        
        p.push();
        // Draw Icing top
        p.fill(PALETTE.GRASS); // Matcha icing
        p.noStroke();
        p.rect(pos.x, pos.y, this.width, 10, 5, 5, 0, 0);
        
        // Draw Cake body
        p.fill(PALETTE.GROUND_TOP);
        p.rect(pos.x, pos.y + 10, this.width, this.height - 10, 0, 0, 5, 5);
        
        // Layer details
        p.fill(PALETTE.GROUND_BOTTOM);
        p.rect(pos.x, pos.y + 25, this.width, 5);
        p.pop();
    }
}