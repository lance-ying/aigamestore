/**
 * entities.js
 * Contains Player, Enemy, Chest, Teleporter, and Projectile classes.
 */
import { gameState, GRAVITY, COLORS, PLAYER_WIDTH, PLAYER_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolvePlatformCollision, distSq, checkCollision } from './utils.js';
import { spawnParticles, spawnFloatingText } from './particles.js';
import { getRandomItem } from './items.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.dead = false;
        this.facing = 1; // 1 Right, -1 Left
        this.color = [255, 255, 255];
        this.maxHealth = 100;
        this.health = 100;
    }

    update() {
        // Apply Gravity
        this.vy += GRAVITY;
        
        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounds Check (World)
        if (this.x < 0) this.x = 0;
        if (this.x > gameState.worldWidth - this.width) this.x = gameState.worldWidth - this.width;
        
        // Physics
        this.onGround = resolvePlatformCollision(this);
        if (this.onGround) {
            // Friction
            this.vx *= 0.8; 
        } else {
            // Air Resistance
            this.vx *= 0.95;
        }
        
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'BLOOD', 3);
        spawnFloatingText(this.x + this.width/2, this.y, Math.round(amount), [255, 50, 50]);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.dead = true;
    }
    
    render(p, cameraX, cameraY) {
        // Basic rect render
        p.fill(this.color);
        p.noStroke();
        p.rect(this.x - cameraX, this.y - cameraY, this.width, this.height);
    }
}

// ---------------------- PLAYER ----------------------

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
        this.type = 'PLAYER';
        this.color = COLORS.player;
        
        // Stats
        this.maxHealth = 100;
        this.health = 100;
        
        // Modifiable stats (by items)
        this.stats = {
            moveSpeed: 4.0,
            jumpForce: -11,
            attackSpeed: 1.0, // Multiplier
            damage: 10,
            critChance: 0.05,
            maxJumps: 1,
            procChainLightning: false,
            explosiveRounds: false
        };
        
        // State
        this.jumpsLeft = 0;
        this.shootCooldown = 0;
        this.dodgeCooldown = 0;
        this.isDodging = false;
        this.invulnerable = 0; // Frames
    }
    
    update(input) {
        // Handle Cooldowns
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.dodgeCooldown > 0) this.dodgeCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Input Handling
        if (!this.isDodging) {
            if (input.keys.left) {
                this.vx -= this.stats.moveSpeed * 0.2;
                if (this.vx < -this.stats.moveSpeed) this.vx = -this.stats.moveSpeed;
                this.facing = -1;
            }
            if (input.keys.right) {
                this.vx += this.stats.moveSpeed * 0.2;
                if (this.vx > this.stats.moveSpeed) this.vx = this.stats.moveSpeed;
                this.facing = 1;
            }
            
            // Jump
            if (input.keys.jumpPressed) {
                if (this.onGround) {
                    this.vy = this.stats.jumpForce;
                    this.jumpsLeft = this.stats.maxJumps - 1;
                } else if (this.jumpsLeft > 0) {
                    this.vy = this.stats.jumpForce;
                    this.jumpsLeft--;
                    spawnParticles(this.x + this.width/2, this.y + this.height, 'HEAL', 3); // Dust effect
                }
            }
            
            // Shoot
            if (input.keys.shoot && this.shootCooldown <= 0) {
                this.fire();
            }
            
            // Dodge
            if (input.keys.dodge && this.dodgeCooldown <= 0) {
                this.performDodge();
            }
        } else {
            // While dodging
            this.vx = this.facing * this.stats.moveSpeed * 1.5;
            this.invulnerable = 2; // Keep invuln while dodging
            if (this.dodgeCooldown < 45) { // Dodge duration approx 15 frames (60 - 45)
                this.isDodging = false;
                this.vx *= 0.5;
            }
        }
        
        super.update();
        
        // Reset jumps on ground
        if (this.onGround && this.vy >= 0) {
            this.jumpsLeft = this.stats.maxJumps;
        }
    }
    
    fire() {
        this.shootCooldown = Math.max(5, 20 / this.stats.attackSpeed);
        
        // Create projectile
        const projSpeed = 15;
        const pX = this.facing === 1 ? this.x + this.width : this.x;
        const pY = this.y + this.height / 3;
        
        const isCrit = Math.random() < this.stats.critChance;
        const damage = this.stats.damage * (isCrit ? 2.0 : 1.0);
        
        const proj = new Projectile(pX, pY, this.facing * projSpeed, 0, damage, true, isCrit);
        gameState.projectiles.push(proj);
        
        // Recoil
        // this.vx -= this.facing * 1;
    }
    
    performDodge() {
        this.isDodging = true;
        this.dodgeCooldown = 60; // 1 second cooldown
        this.vy = -2; // Small hop
        spawnFloatingText(this.x, this.y - 10, "DODGE", [100, 200, 255]);
    }
    
    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        super.takeDamage(amount);
        this.invulnerable = 30; // 0.5s i-frames
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        spawnFloatingText(this.x, this.y - 10, "+" + amount, [50, 255, 50]);
    }
    
    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    render(p, cameraX, cameraY) {
        // Draw character
        p.push();
        p.translate(this.x + this.width/2 - cameraX, this.y + this.height/2 - cameraY);
        p.scale(this.facing, 1);
        
        if (this.invulnerable > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) {
            // Flash when damaged
            p.tint(255, 100);
        }
        
        // Body
        p.fill(this.color);
        p.rect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Visor
        p.fill(COLORS.player_secondary);
        p.rect(2, -10, 6, 4);
        
        // Weapon
        p.fill(50);
        p.rect(0, 0, 15, 6);
        
        p.pop();
        
        // Dodge indicator
        if (this.dodgeCooldown <= 0) {
            p.stroke(0, 255, 255);
            p.noFill();
            // p.circle(this.x + this.width/2 - cameraX, this.y - 5 - cameraY, 5);
        }
    }
}

// ---------------------- ENEMIES ----------------------

export class Enemy extends Entity {
    constructor(x, y, type) {
        let width = 30, height = 30;
        let color = COLORS.enemy_basic;
        let health = 40;
        let damage = 10;
        let value = 15;
        
        // Scaling
        const coeff = gameState.difficultyCoeff;
        
        if (type === 'WISP') {
            color = COLORS.enemy_flying;
            health = 25 * coeff;
            damage = 8 * coeff;
            value = 10;
        } else if (type === 'GOLEM') {
            width = 50; height = 60;
            color = [100, 100, 100];
            health = 200 * coeff;
            damage = 25 * coeff;
            value = 50;
        } else if (type === 'BOSS') {
            width = 80; height = 80;
            color = COLORS.enemy_boss;
            health = 1500 * coeff;
            damage = 30 * coeff;
            value = 500;
        } else {
            // Basic Lemurian
            health = 40 * coeff;
            damage = 12 * coeff;
        }
        
        super(x, y, width, height);
        this.enemyType = type || 'LEMURIAN';
        this.color = color;
        this.maxHealth = health;
        this.health = health;
        this.damage = damage;
        this.value = value;
        this.attackCooldown = 0;
        this.state = 'CHASE'; // CHASE, ATTACK, IDLE
    }
    
    update() {
        const player = gameState.player;
        if (!player) return;
        
        const dist = Math.sqrt(distSq(this.x, this.y, player.x, player.y));
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        // AI Logic
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        if (this.enemyType === 'WISP') {
            // Flying Logic
            this.vy = 0; // Override gravity
            
            // Hover near player
            const targetY = player.y - 50;
            const targetX = player.x + (dx > 0 ? -150 : 150);
            
            this.x += (targetX - this.x) * 0.02;
            this.y += (targetY - this.y) * 0.02;
            
            // Shoot
            if (this.attackCooldown <= 0 && dist < 400) {
                // Shoot projectile at player
                const angle = Math.atan2(dy, dx);
                const speed = 8;
                gameState.projectiles.push(new Projectile(
                    this.x + this.width/2, 
                    this.y + this.height/2, 
                    Math.cos(angle) * speed, 
                    Math.sin(angle) * speed, 
                    this.damage, 
                    false
                ));
                this.attackCooldown = 120;
            }
            
        } else if (this.enemyType === 'GOLEM') {
            // Tank Logic
            super.update(); // Gravity
            
            if (dist > 300) {
                 this.vx = Math.sign(dx) * 1;
            } else {
                 this.vx = 0;
                 // Laser charge logic would go here, simplified to instant shot for now
                 if (this.attackCooldown <= 0) {
                    const angle = Math.atan2(dy, dx);
                    gameState.projectiles.push(new Projectile(
                        this.x + this.width/2,
                        this.y + 10,
                        Math.cos(angle) * 10,
                        Math.sin(angle) * 10,
                        this.damage,
                        false
                    ));
                    this.attackCooldown = 180;
                 }
            }
            
        } else {
            // Basic Ground Logic (Lemurian)
            super.update();
            
            // Move towards player
            if (dist < 500 && dist > 10) {
                this.vx = Math.sign(dx) * 2;
                this.facing = Math.sign(dx);
            }
            
            // Jump if stuck (simple check)
            if (this.onGround && this.vx === 0 && Math.abs(dx) > 20) {
                 this.vy = -8;
            }
            
            // Melee Attack
            if (dist < 40 && this.attackCooldown <= 0) {
                player.takeDamage(this.damage);
                this.attackCooldown = 60;
            }
        }
    }
    
    die() {
        super.die();
        // Give money
        gameState.player.money += Math.floor(this.value);
        gameState.player.score += Math.floor(this.value);
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'MONEY', 5);
        spawnFloatingText(this.x, this.y, "+$" + Math.floor(this.value), [255, 215, 0]);
        
        // Win condition if boss dies
        if (this.enemyType === 'BOSS' && gameState.teleporterState === 'CHARGED') {
             gameState.gamePhase = 'GAME_OVER_WIN';
        }
    }
}

// ---------------------- PROJECTILE ----------------------

export class Projectile {
    constructor(x, y, vx, vy, damage, isPlayerOwned, isCrit = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.damage = damage;
        this.isPlayerOwned = isPlayerOwned;
        this.isCrit = isCrit;
        this.life = 100;
        this.dead = false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        if (this.life <= 0) this.dead = true;
        
        // Check collisions
        if (this.isPlayerOwned) {
            // Hit enemies
            for (const enemy of gameState.enemies) {
                if (checkCollision({x: this.x-2, y: this.y-2, width: 4, height: 4}, enemy)) {
                    enemy.takeDamage(this.damage);
                    this.dead = true;
                    spawnParticles(this.x, this.y, 'EXPLOSION', 2);
                    
                    // On hit effects
                    if (gameState.player.stats.procChainLightning) {
                        // Simple visualization of proc
                         spawnFloatingText(enemy.x, enemy.y - 20, "ZAP!", [255, 255, 0]);
                         enemy.takeDamage(this.damage * 0.5); // Bonus dmg
                    }
                    if (gameState.player.stats.explosiveRounds) {
                         spawnParticles(this.x, this.y, 'EXPLOSION', 5);
                         // Area damage logic omitted for brevity, adding bonus direct dmg
                         enemy.takeDamage(this.damage * 0.6);
                    }
                    
                    break;
                }
            }
        } else {
            // Hit player
            const p = gameState.player;
            if (checkCollision({x: this.x-2, y: this.y-2, width: 4, height: 4}, p)) {
                p.takeDamage(this.damage);
                this.dead = true;
                spawnParticles(this.x, this.y, 'BLOOD', 2);
            }
        }
    }
    
    render(p, cameraX, cameraY) {
        p.push();
        p.translate(this.x - cameraX, this.y - cameraY);
        p.fill(this.isCrit ? [255, 0, 0] : COLORS.projectile);
        p.noStroke();
        p.circle(0, 0, this.isCrit ? 8 : 5);
        p.pop();
    }
}

// ---------------------- INTERACTABLES ----------------------

export class Interactable {
    constructor(x, y, width, height, type, cost) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'CHEST', 'TELEPORTER'
        this.cost = cost;
        this.active = true;
        this.prompt = "$" + cost;
        if (type === 'TELEPORTER') this.prompt = "Activate";
    }
    
    interact(player) {
        if (!this.active) return;
        
        if (this.type === 'CHEST') {
            if (player.money >= this.cost) {
                player.money -= this.cost;
                this.active = false;
                this.open(player);
            } else {
                spawnFloatingText(this.x + this.width/2, this.y, "Not enough gold!", [200, 200, 200]);
            }
        } else if (this.type === 'TELEPORTER') {
            if (gameState.teleporterState === 'IDLE') {
                gameState.teleporterState = 'CHARGING';
                spawnFloatingText(this.x, this.y - 30, "EVENT STARTED", [255, 50, 50]);
                // Spawn boss logic handled in game loop
            }
        }
    }
    
    open(player) {
        const item = getRandomItem();
        spawnFloatingText(this.x, this.y - 20, item.name, item.color);
        spawnParticles(this.x + this.width/2, this.y, 'MONEY', 10);
        
        // Add item to player
        item.onAcquire(player);
        if (gameState.items[item.id]) gameState.items[item.id]++;
        else gameState.items[item.id] = 1;
    }
    
    render(p, cameraX, cameraY) {
        p.push();
        p.translate(this.x - cameraX, this.y - cameraY);
        
        if (this.type === 'CHEST') {
            p.fill(this.active ? COLORS.chest : [100, 80, 20]);
            p.rect(0, 0, this.width, this.height);
            p.fill(0);
            p.rect(2, 8, this.width - 4, 2); // Lock
        } else if (this.type === 'TELEPORTER') {
            p.fill(gameState.teleporterState === 'IDLE' ? COLORS.teleporter : COLORS.teleporter_active);
            // Draw arch shape
            p.rect(0, 0, 10, this.height);
            p.rect(this.width - 10, 0, 10, this.height);
            p.rect(0, -10, this.width, 10);
            
            // Particles inside if active
            if (gameState.teleporterState !== 'IDLE') {
                p.fill(255, 100, 100, 100);
                p.circle(this.width/2, this.height/2, Math.random() * 30 + 20);
            }
        }
        
        // Draw Prompt if player is close
        const player = gameState.player;
        if (player && this.active && distSq(player.x, player.y, this.x, this.y) < 6400) { // 80px radius
            p.fill(255);
            p.textAlign(p.CENTER);
            p.textSize(12);
            p.text(this.prompt, this.width/2, -20);
            p.text("↓", this.width/2, -5);
        }
        
        p.pop();
    }
}