/**
 * entities.js
 * Contains all game entity classes: Player, Enemy (and subclasses), Items.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GROUND_Y } from './globals.js';
import { applyPhysics, resolveAttack } from './physics.js';
import { drawSprite, checkAABB, randomRange, randomInt } from './utils.js';
import { createExplosion, createBlood, spawnFloatingText } from './particles.js';

// --- Base Entity ---
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.dead = false;
        this.useGravity = true;
        this.flashTime = 0; // For hit effect
    }

    update() {
        applyPhysics(this);
        if (this.flashTime > 0) this.flashTime--;
    }

    render(p) {
        // Override in subclasses
        p.fill(255);
        p.rect(this.x, this.y, this.width, this.height);
    }

    takeDamage(amount) {
        // Override
    }
}

// --- Player Class ---
export class Player extends Entity {
    constructor() {
        super(CANVAS_WIDTH / 2, 200, 24, 32);
        this.hp = 100;
        this.maxHp = 100;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.level = 1;
        this.damage = 25;
        this.speed = 4;
        this.jumpForce = -14;
        
        // Combat state
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackDuration = 10;
        this.attackHitbox = { x: 0, y: 0, width: 40, height: 32 };
        
        // Dash state
        this.isDashing = false;
        this.dashCooldown = 0;
        this.invulnerableTime = 0;

        // Visuals (Simple Sprite Map for Hero)
        // 1=Skin, 2=Armor, 3=Helm
        this.spriteMap = [
            [0,3,3,3,0],
            [0,3,3,3,0],
            [0,1,1,1,0],
            [2,2,2,2,2],
            [2,2,2,2,2],
            [1,2,2,2,1],
            [0,2,0,2,0],
            [0,2,0,2,0]
        ];
    }

    update(p) {
        // Input Handling
        this.handleInput(p);
        
        super.update();

        // Attack Logic
        if (this.isAttacking) {
            this.attackTimer--;
            
            // Define Attack Hitbox
            this.attackHitbox.x = this.facing === 1 ? this.x + this.width : this.x - this.attackHitbox.width;
            this.attackHitbox.y = this.y;
            
            // Check collisions with enemies
            if (this.attackTimer > 0) {
                gameState.entities.forEach(entity => {
                    if (entity instanceof Enemy && !entity.dead && checkAABB(this.attackHitbox, entity)) {
                        // Apply damage only once per swing logic handled by cooldown usually, 
                        // but here we check if we already hit? 
                        // Simplified: Knockback prevents multi-hit in 1 frame usually, 
                        // but let's add an invulnerability frame to enemy or check list.
                        if (entity.invulnerableTime <= 0) {
                            resolveAttack(this, entity);
                            createExplosion(entity.x + entity.width/2, entity.y + entity.height/2, 5, COLORS.hero.skin);
                        }
                    }
                });
            }

            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invulnerableTime > 0) this.invulnerableTime--;

        // Level Up Logic
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    handleInput(p) {
        if (gameState.controlMode === 'HUMAN' || gameState.controlMode.startsWith('TEST')) {
            // Movement
            if (gameState.keys[p.LEFT_ARROW] || gameState.keys[65]) { // Left or A
                if (!this.isDashing) {
                    this.vx = -this.speed;
                    this.facing = -1;
                }
            } else if (gameState.keys[p.RIGHT_ARROW] || gameState.keys[68]) { // Right or D
                if (!this.isDashing) {
                    this.vx = this.speed;
                    this.facing = 1;
                }
            } else {
                if (!this.isDashing && this.onGround) this.vx = 0;
            }

            // Jump
            if ((gameState.keys[32] || gameState.keys[38] || gameState.keys[87]) && this.onGround) { // Space/Up/W
                this.vy = this.jumpForce;
                this.onGround = false;
            }

            // Attack (Z or J)
            if ((gameState.keys[90] || gameState.keys[74]) && this.attackCooldown <= 0) {
                this.attack();
            }

            // Dash (Shift or K)
            if ((gameState.keys[16] || gameState.keys[75]) && this.dashCooldown <= 0 && (Math.abs(this.vx) > 0.1)) {
                this.dash();
            }
        }
    }

    attack() {
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 20;
        // Lunge forward slightly
        if (this.onGround) this.vx = this.facing * 2;
    }

    dash() {
        this.isDashing = true;
        this.dashCooldown = 60;
        this.vx = this.facing * 12;
        this.vy = -2; // Little hop
        this.invulnerableTime = 15;
        
        // Dash particle effect
        createExplosion(this.x + this.width/2, this.y + this.height/2, 10, [200, 200, 255]);
        
        setTimeout(() => { this.isDashing = false; }, 200);
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);
        
        // Stats up
        this.maxHp += 20;
        this.hp = this.maxHp; // Full heal
        this.damage += 5;
        
        spawnFloatingText(this.x, this.y - 20, "LEVEL UP!", COLORS.crit, 24);
        createExplosion(this.x, this.y, 30, [255, 255, 0]);
        
        // Log
        console.log(`Level Up! Level: ${this.level}, HP: ${this.maxHp}, Dmg: ${this.damage}`);
    }

    takeDamage(amount) {
        if (this.invulnerableTime > 0 || this.dead) return;

        this.hp -= amount;
        this.flashTime = 10;
        this.invulnerableTime = 30; // Mercy invincibility
        
        spawnFloatingText(this.x, this.y, `-${amount}`, COLORS.items.potion);
        createBlood(this.x + this.width/2, this.y + this.height/2, 5);
        gameState.cameraShake = 5;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        createBlood(this.x, this.y, 50);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        // Flash white if damaged
        if (this.flashTime > 0) {
            p.fill(255);
            p.rect(this.x, this.y, this.width, this.height);
        } else {
            // Draw Sprite
            const palette = {
                1: COLORS.hero.skin,
                2: COLORS.hero.armor,
                3: [100, 100, 120] // Helm
            };
            drawSprite(p, this.spriteMap, this.x + this.width/2, this.y + this.height/2, 4, palette, this.facing);
            
            // Draw Weapon if attacking
            if (this.isAttacking) {
                p.fill(220);
                p.push();
                p.translate(this.x + this.width/2, this.y + this.height/2);
                p.scale(this.facing, 1);
                // Swipe animation
                const angle = p.map(this.attackTimer, this.attackDuration, 0, -p.PI/4, p.PI/2);
                p.rotate(angle);
                p.rect(10, -5, 30, 10); // Sword blade
                p.fill(100);
                p.rect(0, -5, 10, 10); // Handle
                p.pop();
            }
        }
        
        // Draw Dash trail
        if (this.isDashing) {
            p.fill(255, 100);
            p.rect(this.x - this.vx*2, this.y, this.width, this.height);
        }
        
        p.pop();
    }
}

// --- Enemy Classes ---

export class Enemy extends Entity {
    constructor(x, y, width, height, type) {
        super(x, y, width, height);
        this.type = type;
        this.hp = 30;
        this.maxHp = 30;
        this.damage = 10;
        this.xpValue = 10;
        this.speed = 1.5;
        this.invulnerableTime = 0;
    }

    update() {
        if (this.dead) return;
        super.update();

        if (this.invulnerableTime > 0) this.invulnerableTime--;

        // Simple AI: Move towards player
        const player = gameState.player;
        if (player && !player.dead) {
            const dist = player.x - this.x;
            
            // Movement
            if (Math.abs(dist) > 5) { // Don't jitter
                this.facing = dist > 0 ? 1 : -1;
                this.vx = this.facing * this.speed;
            } else {
                this.vx = 0;
            }

            // Collision with Player
            if (checkAABB(this, player)) {
                resolveAttack(this, player);
            }
        }
    }

    takeDamage(amount) {
        if (this.dead || this.invulnerableTime > 0) return;
        
        this.hp -= amount;
        this.flashTime = 5;
        this.invulnerableTime = 5;
        this.vx = -this.facing * 5; // Knockback
        this.vy = -3;

        spawnFloatingText(this.x, this.y - 10, `${amount}`, COLORS.damage);
        
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        createExplosion(this.x + this.width/2, this.y + this.height/2, 10, COLORS.enemy[this.type] || [100, 100, 100]);
        
        // Drop Loot
        if (Math.random() < 0.5) {
            gameState.entities.push(new Loot(this.x, this.y, 'coin'));
        } else if (Math.random() < 0.1) {
            gameState.entities.push(new Loot(this.x, this.y, 'potion'));
        }

        // Add Score and Kill Count
        gameState.score += this.xpValue * 10;
        gameState.killCount++;
    }
    
    render(p) {
        if (this.dead) return;
        
        p.push();
        if (this.flashTime > 0) {
            p.fill(255);
            p.rect(this.x, this.y, this.width, this.height);
        } else {
            // Draw logic in subclasses, fallback here
            p.fill(COLORS.enemy[this.type] || [100,0,0]);
            p.rect(this.x, this.y, this.width, this.height);
        }
        
        // Health Bar
        const hpPct = this.hp / this.maxHp;
        if (hpPct < 1) {
            p.fill(50, 0, 0);
            p.rect(this.x, this.y - 8, this.width, 4);
            p.fill(255, 0, 0);
            p.rect(this.x, this.y - 8, this.width * hpPct, 4);
        }
        p.pop();
    }
}

export class Slime extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 20, 'slime');
        this.hp = 30 + (gameState.level * 5);
        this.maxHp = this.hp;
        this.damage = 10 + gameState.level;
        this.speed = 1 + (Math.random() * 1);
        this.jumpTimer = randomInt(0, 100);
    }
    
    update() {
        super.update();
        // Jump occasionally
        this.jumpTimer++;
        if (this.jumpTimer > 120 && this.onGround) {
            this.vy = -8;
            this.jumpTimer = 0;
        }
    }

    render(p) {
        if (this.dead) return;
        if (this.flashTime > 0) {
            p.fill(255);
            p.rect(this.x, this.y, this.width, this.height);
            return;
        }
        
        // Slime Visual
        p.fill(COLORS.enemy.slime);
        // Squash and stretch
        let h = this.height;
        let w = this.width;
        if (!this.onGround) { h += 5; w -= 5; }
        else { h = Math.abs(Math.sin(p.frameCount * 0.1)) * 2 + this.height; }
        
        p.rect(this.x + (this.width-w)/2, this.y + (this.height-h), w, h, 5, 5, 0, 0);
        
        // Eyes
        p.fill(255);
        p.circle(this.x + 8, this.y + 5, 6);
        p.circle(this.x + this.width - 8, this.y + 5, 6);
        p.fill(0);
        p.circle(this.x + 8, this.y + 5, 2);
        p.circle(this.x + this.width - 8, this.y + 5, 2);
    }
}

export class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 20, 'bat');
        this.hp = 20 + (gameState.level * 2);
        this.speed = 2.5;
        this.useGravity = false;
        this.startY = y;
        this.offset = randomRange(0, 100);
    }
    
    update() {
        if (this.dead) return;
        // Sine wave movement
        this.y = this.startY + Math.sin((gameState.frameCount + this.offset) * 0.05) * 50;
        
        // Move X
        const player = gameState.player;
        if (player) {
            const dx = player.x - this.x;
            this.vx = (dx > 0 ? 1 : -1) * this.speed;
        }
        
        this.x += this.vx;
        
        // Bounds check
        if (this.y + this.height > GROUND_Y) this.y = GROUND_Y - this.height;
        
        if (player && checkAABB(this, player)) {
            resolveAttack(this, player);
        }
        
        if (this.flashTime > 0) this.flashTime--;
        if (this.invulnerableTime > 0) this.invulnerableTime--;
    }
    
    render(p) {
        if (this.dead) return;
        if (this.flashTime > 0) {
            p.fill(255);
            p.rect(this.x, this.y, this.width, this.height);
            return;
        }
        
        p.fill(COLORS.enemy.bat);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Wings (Flapping)
        p.fill(150, 40, 40);
        let wingY = Math.sin(p.frameCount * 0.5) * 10;
        p.triangle(this.x, this.y + 5, this.x - 15, this.y - 5 + wingY, this.x, this.y + 15);
        p.triangle(this.x + this.width, this.y + 5, this.x + this.width + 15, this.y - 5 + wingY, this.x + this.width, this.y + 15);
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 60, 80, 'boss');
        this.hp = 300 + (gameState.level * 20);
        this.maxHp = this.hp;
        this.damage = 30;
        this.speed = 1.0;
        this.xpValue = 100;
        this.attackCooldown = 0;
    }

    update() {
        super.update();
        
        // Boss Logic: Charge attack
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        const player = gameState.player;
        if (player && this.attackCooldown <= 0 && Math.abs(player.x - this.x) < 200) {
            // Smash
            if (Math.abs(player.x - this.x) < 60) {
                this.attackCooldown = 60;
                // AoE hit
                if (player.onGround && Math.abs(player.x - this.x) < 80) {
                     player.takeDamage(this.damage);
                     player.vy = -10; // Launch
                }
                gameState.cameraShake = 10;
            } else {
                // Charge speed boost
                this.vx = (player.x > this.x ? 1 : -1) * 4;
            }
        }
    }
    
    render(p) {
        if (this.dead) return;
        if (this.flashTime > 0) {
            p.fill(255);
            p.rect(this.x, this.y, this.width, this.height);
            return;
        }
        
        p.fill(COLORS.enemy.boss);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Horns
        p.fill(255);
        p.triangle(this.x, this.y, this.x - 10, this.y - 20, this.x + 20, this.y);
        p.triangle(this.x + this.width, this.y, this.x + this.width + 10, this.y - 20, this.x + this.width - 20, this.y);
        
        // Eyes
        p.fill(255, 0, 0);
        p.circle(this.x + 15, this.y + 20, 10);
        p.circle(this.x + this.width - 15, this.y + 20, 10);
    }
}

// --- Loot Class ---
export class Loot extends Entity {
    constructor(x, y, type) {
        super(x, y, 16, 16);
        this.type = type; // 'coin', 'potion'
        this.useGravity = true;
        this.vy = -5; // Pop up
        this.life = 600; // Disappear after 10s
        
        if (type === 'coin') {
            this.color = COLORS.items.coin;
            this.val = 10; // XP
        } else {
            this.color = COLORS.items.potion;
            this.val = 25; // Health
        }
    }
    
    update() {
        applyPhysics(this);
        this.life--;
        
        // Bobbing
        if (this.onGround) {
            this.vx *= 0.8;
        }
        
        // Collect
        if (checkAABB(this, gameState.player)) {
            this.collect();
        }
    }
    
    collect() {
        this.dead = true;
        
        if (this.type === 'coin') {
            gameState.player.xp += this.val;
            gameState.score += this.val;
            spawnFloatingText(this.x, this.y, `+${this.val} XP`, COLORS.crit, 14);
        } else {
            gameState.player.hp = Math.min(gameState.player.hp + this.val, gameState.player.maxHp);
            spawnFloatingText(this.x, this.y, `+${this.val} HP`, COLORS.heal, 14);
        }
        
        // Sound effect visual
        createExplosion(this.x + 8, this.y + 8, 5, this.color);
    }
    
    render(p) {
        if (this.dead) return;
        // Blink if disappearing
        if (this.life < 120 && Math.floor(this.life / 10) % 2 === 0) return;
        
        p.fill(this.color);
        if (this.type === 'coin') {
            p.circle(this.x + 8, this.y + 8, 12);
            p.fill(255, 200, 50);
            p.circle(this.x + 8, this.y + 8, 8);
        } else {
            // Potion bottle
            p.rect(this.x + 4, this.y + 6, 8, 10);
            p.rect(this.x + 6, this.y, 4, 6);
        }
    }
}