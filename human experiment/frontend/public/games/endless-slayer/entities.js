/**
 * Game entities including Player classes, Enemy classes, and Items.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GRAVITY, FRICTION, CLASSES, ENTITY_TYPES } from './globals.js';
import { isKeyPressed } from './input.js';
import { createExplosion, createFloatingText, Particle } from './particles.js';
import { rectIntersect } from './utils.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.grounded = false;
        this.facing = 1; // 1 Right, -1 Left
        this.color = [255, 255, 255];
        this.type = "entity";
    }

    update(p) {
        // Physics
        this.vy += GRAVITY;
        this.vx *= FRICTION;

        this.x += this.vx;
        this.y += this.vy;

        // Ground Collision
        if (this.y + this.height / 2 >= GROUND_Y) {
            this.y = GROUND_Y - this.height / 2;
            this.vy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }

        // Screen Bounds (Horizontal)
        if (this.x < 0) {
            this.x = 0;
            this.vx *= -0.5;
        } else if (this.x > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH;
            this.vx *= -0.5;
        }
    }

    render(p) {
        p.fill(this.color);
        p.push();
        p.translate(this.x, this.y);
        p.scale(this.facing, 1);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        p.pop();
    }
    
    getBounds() {
        return {
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            w: this.width,
            h: this.height
        };
    }
}

// ---------------- PLAYER CLASS ----------------
export class Player extends Entity {
    constructor(x, y, classType) {
        super(x, y, 30, 40);
        this.classType = classType;
        this.type = ENTITY_TYPES.PLAYER;
        
        // Stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.speed = 1.0; // Acceleration
        this.maxSpeed = 5;
        this.jumpForce = -12;
        
        // Combat
        this.attackCooldown = 0;
        this.attackMaxCooldown = 30;
        this.isAttacking = false;
        this.attackFrame = 0;
        this.invincibleTimer = 0;
        
        // Class specifics initialization
        this.initClassStats();
    }
    
    initClassStats() {
        switch(this.classType) {
            case CLASSES.KNIGHT:
                this.color = [50, 100, 200];
                this.maxHp = 150;
                this.hp = this.maxHp;
                this.width = 32;
                this.height = 42;
                this.speed = 0.8;
                this.attackMaxCooldown = 25;
                break;
            case CLASSES.WIZARD:
                this.color = [150, 50, 200];
                this.maxHp = 80;
                this.hp = this.maxHp;
                this.width = 28;
                this.height = 38;
                this.speed = 0.9;
                this.attackMaxCooldown = 20;
                break;
            case CLASSES.KNAVE:
                this.color = [50, 150, 50];
                this.maxHp = 100;
                this.hp = this.maxHp;
                this.width = 30;
                this.height = 36;
                this.speed = 1.2;
                this.maxSpeed = 7;
                this.attackMaxCooldown = 40; // Dash cooldown
                break;
        }
    }

    update(p) {
        // Controls
        // Left (37) / Right (39)
        if (isKeyPressed(37)) {
            this.vx -= this.speed;
            this.facing = -1;
        }
        if (isKeyPressed(39)) {
            this.vx += this.speed;
            this.facing = 1;
        }
        // Limit speed
        this.vx = Math.max(Math.min(this.vx, this.maxSpeed), -this.maxSpeed);

        // Jump (32)
        if (isKeyPressed(32) && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
            createExplosion(this.x, this.y + this.height/2, 3, 'dust');
        }

        // Attack (90 - Z)
        if (isKeyPressed(90) && this.attackCooldown <= 0) {
            this.performAttack(p);
        }
        
        // Update Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        
        // Dash mechanics for Knave
        if (this.classType === CLASSES.KNAVE && this.isAttacking) {
            this.vx = this.facing * 15; // Dash speed
            this.vy = 0; // Gravity defy during dash
            this.attackFrame--;
            if (this.attackFrame <= 0) {
                this.isAttacking = false;
                this.vx *= 0.2; // Slow down after dash
            }
            createExplosion(this.x, this.y, 1, 'dust');
        } else if (this.isAttacking) {
            // Knight sword animation duration
            this.attackFrame--;
            if (this.attackFrame <= 0) this.isAttacking = false;
        }

        // Physics Update
        super.update(p);
        
        // Log info
        if(p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                screen_x: this.x,
                screen_y: this.y,
                game_x: this.x,
                game_y: this.y,
                hp: this.hp,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        // Check Death
        if (this.hp <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, 20, 'blood');
        }
    }

    performAttack(p) {
        this.attackCooldown = this.attackMaxCooldown;
        this.isAttacking = true;
        
        switch(this.classType) {
            case CLASSES.KNIGHT:
                // Melee Swing
                this.attackFrame = 10;
                // Spawn hitbox object handled in collision system or here?
                // Visual effect here, logic in collision
                break;
            case CLASSES.WIZARD:
                // Shoot projectile
                this.isAttacking = false; // Wizard doesn't have an "active state" lock like dash
                const proj = new Projectile(this.x, this.y, this.facing, 'magic_missile');
                gameState.projectiles.push(proj);
                gameState.entities.push(proj);
                break;
            case CLASSES.KNAVE:
                // Dash
                this.attackFrame = 10; 
                this.invincibleTimer = 15; // Invincible during dash
                break;
        }
    }
    
    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;
        this.hp -= amount;
        this.invincibleTimer = 40;
        this.vy = -5;
        this.vx = -this.facing * 5; // Knockback
        gameState.cameraShake = 5;
        createFloatingText(this.x, this.y - 20, `-${amount}`, [255, 50, 50]);
        createExplosion(this.x, this.y, 5, 'blood');
    }
    
    gainXp(amount) {
        gameState.xp += amount;
        if (gameState.xp >= gameState.xpToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        gameState.level++;
        gameState.xp -= gameState.xpToNextLevel;
        gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5);
        
        this.maxHp += 20;
        this.hp = this.maxHp;
        
        // Visuals
        createFloatingText(this.x, this.y - 40, "LEVEL UP!", [255, 215, 0]);
        for(let i=0; i<20; i++) {
            gameState.particles.push(new Particle(this.x, this.y, 'magic'));
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.scale(this.facing, 1);
        
        // Flashing if invincible
        if (this.invincibleTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.fill(255);
        } else {
            p.fill(this.color);
        }
        
        // Body
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        
        // Class Specific Rendering
        if (this.classType === CLASSES.KNIGHT) {
            // Helmet Visor
            p.fill(0);
            p.rect(5, -10, 10, 4);
            // Sword
            if (this.isAttacking) {
                p.fill(200);
                p.push();
                p.rotate(p.PI / 4 + (10 - this.attackFrame) * 0.2);
                p.rect(25, 0, 40, 6);
                p.pop();
            } else {
                p.fill(150);
                p.rect(10, 5, 4, 20); // Sheathed/Held
            }
        } else if (this.classType === CLASSES.WIZARD) {
            // Hat
            p.fill(100, 30, 150);
            p.triangle(-15, -20, 15, -20, 0, -45);
            // Staff
            p.fill(100, 50, 0);
            p.rect(15, 0, 4, 40);
            p.fill(0, 255, 255);
            p.circle(15, -20, 6);
        } else if (this.classType === CLASSES.KNAVE) {
            // Bandana
            p.fill(30, 30, 30);
            p.rect(0, -12, 32, 6);
            // Daggers
            p.fill(200);
            if (this.isAttacking) {
                // Dash blur
                p.fill(255, 255, 255, 100);
                p.rect(-20, 0, 30, 36);
            }
            p.rect(15, 5, 12, 4);
        }
        
        p.pop();
    }
}

// ---------------- ENEMY CLASS ----------------
export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.enemyType = type; // 'SLIME', 'BAT', 'SKELETON', 'BOSS'
        this.type = ENTITY_TYPES.ENEMY;
        
        // Stats
        this.hp = 20;
        this.damage = 10;
        this.xpValue = 10;
        this.aiState = 'CHASE';
        this.attackTimer = 0;
        
        this.initTypeStats();
        gameState.entities.push(this);
        gameState.enemies.push(this);
    }
    
    initTypeStats() {
        switch(this.enemyType) {
            case 'SLIME':
                this.hp = 30 + (gameState.level * 5);
                this.width = 30; this.height = 20;
                this.color = [50, 200, 50];
                this.speed = 1.5;
                this.xpValue = 15;
                break;
            case 'BAT':
                this.hp = 15 + (gameState.level * 2);
                this.width = 20; this.height = 15;
                this.color = [100, 100, 100];
                this.speed = 2.5;
                this.xpValue = 20;
                this.y = Math.random() * 200 + 50; // Fly high
                break;
            case 'SKELETON':
                this.hp = 45 + (gameState.level * 8);
                this.width = 25; this.height = 45;
                this.color = [220, 220, 220];
                this.speed = 2.0;
                this.xpValue = 35;
                break;
            case 'BOSS':
                this.hp = 500 + (gameState.level * 50);
                this.width = 80; this.height = 80;
                this.color = [200, 50, 50];
                this.speed = 1.0;
                this.damage = 30;
                this.xpValue = 500;
                break;
        }
    }
    
    update(p) {
        if (this.dead) return;
        
        const player = gameState.player;
        if (!player) return;
        
        const distToPlayer = Math.abs(player.x - this.x);
        
        // AI Logic
        if (this.enemyType === 'BAT') {
            // Flying behavior
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Swoop oscillation
            this.y += Math.sin(p.frameCount * 0.1) * 2;
            
            // Flip
            this.facing = this.vx > 0 ? 1 : -1;
            
        } else if (this.enemyType === 'BOSS') {
            // Boss Logic
            // Move slowly towards player
            if (player.x > this.x) {
                this.vx = this.speed;
                this.facing = 1;
            } else {
                this.vx = -this.speed;
                this.facing = -1;
            }
            this.x += this.vx;
            
            // Jump randomly
            if (p.random() < 0.01 && this.grounded) {
                this.vy = -10;
                this.grounded = false;
            }
            
            // Shoot fireball
            if (p.frameCount % 120 === 0) {
                const proj = new Projectile(this.x, this.y, this.facing, 'fireball');
                gameState.projectiles.push(proj);
                gameState.entities.push(proj);
            }
            
            // Apply Physics
            this.vy += GRAVITY;
            this.y += this.vy;
            
            // Ground collision manually for boss to be safe
            if (this.y + this.height/2 > GROUND_Y) {
                this.y = GROUND_Y - this.height/2;
                this.vy = 0;
                this.grounded = true;
            }
            
        } else {
            // Ground Enemy Logic (Slime, Skeleton)
            if (player.x > this.x + 10) {
                this.vx = this.speed;
                this.facing = 1;
            } else if (player.x < this.x - 10) {
                this.vx = -this.speed;
                this.facing = -1;
            } else {
                this.vx = 0;
            }
            
            // Jump logic for Skeleton
            if (this.enemyType === 'SKELETON') {
                if (this.grounded && p.random() < 0.02) {
                    this.vy = -10;
                    this.grounded = false;
                }
            }
            
            // Slime hop
            if (this.enemyType === 'SLIME') {
                if (this.grounded && p.frameCount % 60 === 0) {
                    this.vy = -5;
                    this.grounded = false;
                }
            }
            
            super.update(p);
        }
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        createFloatingText(this.x, this.y - 20, `${amount}`, [255, 255, 255]);
        createExplosion(this.x, this.y, 3, 'blood');
        
        if (this.hp <= 0) {
            this.die();
        } else {
            // Knockback
            this.vx = -this.facing * 5;
            this.vy = -3;
        }
    }
    
    die() {
        this.dead = true;
        createExplosion(this.x, this.y, 10, 'dust');
        if (gameState.player) gameState.player.gainXp(this.xpValue);
        gameState.score += this.xpValue;
        
        // Drop loot chance
        if (Math.random() < 0.2) {
            new Loot(this.x, this.y, 'potion');
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.scale(this.facing, 1);
        p.fill(this.color);
        p.noStroke();
        
        if (this.enemyType === 'SLIME') {
            // Draw Slime
            p.arc(0, 10, 30, 30, p.PI, 0); // Top dome
            p.rect(0, 5, 30, 10); // Base
            // Eyes
            p.fill(0);
            p.circle(5, 0, 4);
            p.circle(12, 0, 4);
        } else if (this.enemyType === 'BAT') {
            // Draw Bat
            p.fill(50);
            p.circle(0, 0, 15);
            p.triangle(5, 0, 25, -10, 10, 5); // Right wing
            p.triangle(-5, 0, -25, -10, -10, 5); // Left wing
            p.fill(255, 0, 0);
            p.circle(-3, -2, 2);
            p.circle(3, -2, 2);
        } else if (this.enemyType === 'BOSS') {
            // Draw Boss Dragon
            p.rectMode(p.CENTER);
            p.rect(0, 0, 80, 80);
            p.fill(255, 200, 0); // Belly
            p.rect(0, 10, 40, 60);
            p.fill(0); // Eyes
            p.rect(10, -20, 10, 10);
            p.rect(-10, -20, 10, 10);
            p.fill(255); // Teeth
            p.triangle(-20, 20, -10, 30, -15, 20);
            p.triangle(20, 20, 10, 30, 15, 20);
        } else {
            // Default Rectangle
            p.rectMode(p.CENTER);
            p.rect(0, 0, this.width, this.height);
            // Angry Eyes
            p.fill(255, 0, 0);
            p.circle(5, -10, 4);
            p.circle(12, -10, 4);
        }
        
        // Health Bar
        if (this.hp < this.getMaxHp()) {
            p.fill(0);
            p.rect(0, -this.height/2 - 10, 30, 5);
            p.fill(255, 0, 0);
            const w = p.map(this.hp, 0, this.getMaxHp(), 0, 30);
            p.rectMode(p.CORNER);
            p.rect(-15, -this.height/2 - 12.5, Math.max(0, w), 5);
        }
        
        p.pop();
    }
    
    getMaxHp() {
        // Recalculate based on level to get max hp for bar
        switch(this.enemyType) {
            case 'SLIME': return 30 + (gameState.level * 5);
            case 'BAT': return 15 + (gameState.level * 2);
            case 'SKELETON': return 45 + (gameState.level * 8);
            case 'BOSS': return 500 + (gameState.level * 50);
            default: return 20;
        }
    }
}

// ---------------- PROJECTILE CLASS ----------------
export class Projectile extends Entity {
    constructor(x, y, dir, type) {
        super(x, y, 10, 10);
        this.type = ENTITY_TYPES.PROJECTILE;
        this.projType = type; // 'magic_missile', 'fireball'
        this.vx = dir * 8;
        this.vy = 0;
        this.life = 100;
        this.damage = 20;
        this.source = type === 'magic_missile' ? 'player' : 'enemy';
        
        if (type === 'fireball') {
            this.width = 20;
            this.height = 20;
            this.damage = 30;
            this.vx = dir * 5;
        }
    }
    
    update(p) {
        this.x += this.vx;
        this.life--;
        
        if (this.life <= 0) this.dead = true;
        
        // Trail
        if (p.frameCount % 2 === 0) {
            gameState.particles.push(new Particle(this.x, this.y, this.projType === 'fireball' ? 'blood' : 'magic'));
        }
        
        // Screen bounds killing
        if (this.x < -50 || this.x > CANVAS_WIDTH + 50) this.dead = true;
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        if (this.projType === 'magic_missile') {
            p.fill(0, 255, 255);
            p.circle(0, 0, 10);
        } else {
            p.fill(255, 100, 0);
            p.circle(0, 0, 20);
            p.fill(255, 255, 0);
            p.circle(0, 0, 10);
        }
        p.pop();
    }
}

// ---------------- LOOT CLASS ----------------
export class Loot extends Entity {
    constructor(x, y, type) {
        super(x, y, 15, 15);
        this.type = ENTITY_TYPES.LOOT;
        this.lootType = type; // 'potion'
        this.vy = -3; // Pop up
        
        gameState.loot.push(this);
        gameState.entities.push(this);
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y + Math.sin(p.frameCount * 0.1) * 5); // Bobbing
        if (this.lootType === 'potion') {
            p.fill(200);
            p.rect(0, -5, 6, 8); // Neck
            p.fill(255, 0, 0);
            p.circle(0, 5, 12); // Bottle
            p.fill(255, 255, 255, 150);
            p.circle(2, 2, 4); // Highlight
        }
        p.pop();
    }
}