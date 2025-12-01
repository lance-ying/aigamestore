import { gameState, GRAVITY, TERMINAL_VELOCITY, FRICTION, AIR_RESISTANCE, COLORS, CANVAS_HEIGHT, CANVAS_WIDTH, logGameInfo } from './globals.js';
import { resolvePlatformCollisions, checkAttackHitbox, checkAABB } from './physics.js';
import { isKeyDown, K } from './input.js';
import { spawnParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.markedForDeletion = false;
        this.health = 10;
        this.maxHealth = 10;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.color = [255, 255, 255];
    }
    
    update() {
        // Apply Physics
        this.vy += GRAVITY;
        this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
        
        // Apply Friction
        if (this.onGround) {
            this.vx *= FRICTION;
        } else {
            this.vx *= AIR_RESISTANCE;
        }
        
        // Resolve Collisions with Geometry
        resolvePlatformCollisions(this, gameState.platforms);
        
        // Position Update
        this.x += this.vx;
        this.y += this.vy;
        
        // Death Plane
        if (this.y > gameState.groundY) {
            this.die();
        }

        // Invincibility Tick
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        
        if (this.invincible && Math.floor(gameState.frameCount / 4) % 2 === 0) {
             p.fill(255, 255, 255, 100); // Flash white
        } else {
            p.fill(this.color);
        }
        
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        
        // Health Bar (for enemies)
        if (this.health < this.maxHealth && this.health > 0 && !(this instanceof Player)) {
            p.scale(this.facing, 1); // unflip
            p.fill(100, 0, 0);
            p.rect(0, -this.height/2 - 5, this.width, 4);
            p.fill(0, 255, 0);
            p.rect(-this.width/2 + (this.width * (this.health/this.maxHealth))/2, -this.height/2 - 5, this.width * (this.health/this.maxHealth), 4);
        }
        
        p.pop();
    }
    
    takeDamage(amount) {
        if (this.invincible) return;
        
        this.health -= amount;
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'BLOOD', 5);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.markedForDeletion = true;
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 35);
        this.color = COLORS.PLAYER;
        this.speed = 0.5;
        this.jumpForce = -10; // Initial impulse
        this.jumpHoldForce = -0.4; // Force applied while holding space
        this.isJumping = false;
        this.jumpTime = 0;
        this.maxJumpTime = 15;
        
        this.maxHealth = 100;
        this.health = 100;
        
        this.state = "IDLE"; // IDLE, RUN, JUMP, FALL, ATTACK, ROLL
        
        this.attackCooldown = 0;
        this.rollCooldown = 0;
        this.attackDuration = 0;
        this.rollDuration = 0;
        
        this.cells = 0; // Currency/Score
    }
    
    update(p) {
        // Input Handling
        let inputX = 0;
        let tryingJump = false;
        let tryingAttack = false;
        let tryingRoll = false;

        // Auto or Human Control
        if (gameState.controlMode === "HUMAN") {
            if (isKeyDown(K.LEFT)) inputX = -1;
            if (isKeyDown(K.RIGHT)) inputX = 1;
            if (isKeyDown(K.SPACE)) tryingJump = true; // Handled by event mostly, but for hold check
        } else {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) inputX = -1;
                if (action.right) inputX = 1;
                if (action.jump) this.tryJump();
                if (action.attack) this.attack();
                if (action.roll) this.roll();
                if (action.jumpHold) tryingJump = true;
            }
        }
        
        // State Logic
        if (this.state !== "ROLL") {
            // Movement
            if (inputX !== 0) {
                this.vx += inputX * this.speed;
                this.facing = inputX;
            }
            
            // Jump Holding (Variable Jump Height)
            if (this.isJumping && tryingJump && this.jumpTime < this.maxJumpTime) {
                this.vy += this.jumpHoldForce;
                this.jumpTime++;
            }
        } else {
            // Rolling physics
            this.vx = this.facing * 8; // Burst speed
            this.vy = 0; // Stay horizontal
            this.rollDuration--;
            if (this.rollDuration <= 0) {
                this.state = "IDLE";
                this.invincible = false;
                this.rollCooldown = 30;
                this.width = 20; // Restore Hitbox
                this.height = 35;
                this.y -= 10; // Pop up
            }
        }
        
        // Attacking
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.rollCooldown > 0) this.rollCooldown--;
        
        if (this.state === "ATTACK") {
            this.attackDuration--;
            if (this.attackDuration <= 0) {
                this.state = "IDLE";
            }
            // Generate hitbox frame
            if (this.attackDuration === 15) { // Hit frame
                 const reach = 40;
                 const hitRect = {
                     x: this.facing === 1 ? this.x + this.width : this.x - reach,
                     y: this.y,
                     width: reach,
                     height: this.height
                 };
                 // Check enemies
                 const hits = checkAttackHitbox(this, hitRect, gameState.enemies);
                 hits.forEach(e => {
                     e.takeDamage(25);
                     e.knockback(this.facing * 5, -3);
                 });
                 spawnParticles(hitRect.x + reach/2, hitRect.y + this.height/2, 'FLAME', 3);
            }
        }

        // Apply physics
        super.update();
        
        // Update State String for Anim
        if (this.state !== "ATTACK" && this.state !== "ROLL") {
            if (!this.onGround) {
                this.state = this.vy > 0 ? "FALL" : "JUMP";
            } else {
                this.state = Math.abs(this.vx) > 0.5 ? "RUN" : "IDLE";
            }
        }
        
        // Spawn head flame particles
        if (p.frameCount % 5 === 0) {
            spawnParticles(this.x + this.width/2 + (this.facing * 2), this.y, 'FLAME', 1);
        }
        
        // Collectibles check
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            let c = gameState.collectibles[i];
            // Magnet distance
            let d = p.dist(this.x, this.y, c.x, c.y);
            if (d < 100) {
                c.x += (this.x - c.x) * 0.1;
                c.y += (this.y - c.y) * 0.1;
            }
            if (checkAABB(this, {x: c.x - c.radius, y: c.y - c.radius, width: c.radius*2, height: c.radius*2})) {
                c.collect();
            }
        }
        
        // Exit Door Check
        if (gameState.exitDoor && checkAABB(this, gameState.exitDoor)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
        
        // Log player status
        logGameInfo(p, 'player', {
            x: this.x, y: this.y, hp: this.health, state: this.state
        });
    }
    
    tryJump() {
        if (this.onGround && this.state !== "ROLL" && this.state !== "ATTACK") {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.isJumping = true;
            this.jumpTime = 0;
            spawnParticles(this.x + this.width/2, this.y + this.height, 'JUMP_DUST', 5);
        }
    }
    
    endJump() {
        this.isJumping = false;
    }
    
    attack() {
        if (this.attackCooldown <= 0 && this.state !== "ROLL") {
            this.state = "ATTACK";
            this.attackDuration = 20; // frames
            this.attackCooldown = 30;
            this.vx = 0; // Stop movement for attack commitment
        }
    }
    
    roll() {
        if (this.rollCooldown <= 0 && this.onGround && this.state !== "ATTACK") {
            this.state = "ROLL";
            this.rollDuration = 20;
            this.invincible = true;
            this.invincibleTimer = 20;
            // Squish hitbox
            this.height = 20; 
            this.y += 15; 
        }
    }
    
    render(p) {
        // Custom Render for Player
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);

        // Visual Effects
        if (this.invincible) p.stroke(255, 255, 200);
        
        // Body Color
        p.fill(this.color);
        if (this.state === "ROLL") p.fill(100, 50, 150); // Darker when rolling
        
        p.noStroke();
        p.rectMode(p.CENTER);
        
        // Draw Body
        let drawW = this.width;
        let drawH = this.state === "ROLL" ? 20 : 35;
        p.rect(0, 0, drawW, drawH, 4);
        
        // Draw Scarf/Head
        p.fill(COLORS.PLAYER_HEAD);
        if (this.state !== "ROLL") {
            p.circle(0, -drawH/2, 10); // Head
        }
        
        // Weapon Swing Visual
        if (this.state === "ATTACK" && this.attackDuration > 10 && this.attackDuration < 18) {
            p.fill(255, 255, 200, 200);
            p.arc(15, 0, 40, 60, -p.PI/2, p.PI/2, p.PIE);
        }
        
        p.pop();
    }
    
    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        super.die();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 25, 40);
        this.type = type; // ZOMBIE, ARCHER
        this.health = type === 'ZOMBIE' ? 30 : 20;
        this.maxHealth = this.health;
        this.detectRange = 300;
        this.attackRange = type === 'ZOMBIE' ? 40 : 250;
        this.attackCooldown = 0;
        this.attackTimer = 100;
        this.color = type === 'ZOMBIE' ? COLORS.ENEMY_ZOMBIE : COLORS.ENEMY_ARCHER;
    }
    
    update(p) {
        super.update();
        
        if (!gameState.player) return;
        
        let dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
        let dx = gameState.player.x - this.x;
        
        // Simple AI
        if (dist < this.detectRange) {
            this.facing = dx > 0 ? 1 : -1;
            
            if (this.type === 'ZOMBIE') {
                if (dist > this.attackRange) {
                    this.vx += this.facing * 0.2; // Chase
                } else {
                    this.vx *= 0.5; // Slow to attack
                    if (this.attackCooldown <= 0) {
                        this.attack();
                    }
                }
            } else if (this.type === 'ARCHER') {
                if (this.attackCooldown <= 0 && dist < this.attackRange && Math.abs(gameState.player.y - this.y) < 50) {
                    this.attack();
                }
            }
        }
        
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // Collision with Player (Body damage)
        if (this.type === 'ZOMBIE' && checkAABB(this, gameState.player) && !gameState.player.invincible) {
            gameState.player.takeDamage(5);
            gameState.player.vx = this.facing * 10; // Knockback
        }
    }
    
    attack() {
        this.attackCooldown = 120; // 2 seconds
        if (this.type === 'ZOMBIE') {
            // Melee Hit
            // Delay attack slightly for telegraph
             setTimeout(() => {
                 if (!this.markedForDeletion && gameState.player && !gameState.player.invincible) {
                     let dist = Math.abs(gameState.player.x - this.x);
                     if (dist < this.attackRange + 20) {
                         gameState.player.takeDamage(10);
                     }
                 }
             }, 500);
        } else if (this.type === 'ARCHER') {
            // Shoot Arrow
            gameState.projectiles.push(new Projectile(this.x + (this.facing * 20), this.y, this.facing));
        }
    }
    
    knockback(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.onGround = false;
    }
    
    die() {
        super.die();
        // Drop Cells
        for(let i=0; i<3; i++) {
            gameState.collectibles.push(new Collectible(this.x, this.y, 'CELL'));
        }
        gameState.score += 50;
    }
}

export class Projectile extends Entity {
    constructor(x, y, direction) {
        super(x, y, 10, 4);
        this.vx = direction * 6;
        this.vy = 0;
        this.life = 100;
        this.color = [255, 255, 0];
        gameState.entities.push(this);
    }
    
    update() {
        this.x += this.vx;
        this.life--;
        if (this.life <= 0) this.markedForDeletion = true;
        
        // Hit Player
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(15);
            this.markedForDeletion = true;
        }
        
        // Hit Walls
        for (let plat of gameState.platforms) {
            if (checkAABB(this, plat)) this.markedForDeletion = true;
        }
    }
}

export class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // CELL, HEALTH
        this.radius = 5;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    render(p) {
        let yOff = Math.sin(p.frameCount * 0.1 + this.bobOffset) * 5;
        p.push();
        p.fill(this.type === 'CELL' ? COLORS.CELL : COLORS.HEALTH);
        p.noStroke();
        p.circle(this.x, this.y + yOff, this.radius * 2);
        p.pop();
    }
    
    collect() {
        if (this.type === 'CELL') {
            gameState.player.cells++;
            gameState.score += 10;
        } else if (this.type === 'HEALTH') {
            gameState.player.health = Math.min(gameState.player.health + 25, gameState.player.maxHealth);
        }
        
        // Remove self
        const idx = gameState.collectibles.indexOf(this);
        if (idx > -1) gameState.collectibles.splice(idx, 1);
        
        // Particle feedback
        spawnParticles(this.x, this.y, 'CELL', 5);
    }
}