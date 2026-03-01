/**
 * Game entities: Player, Enemies, Items.
 * Contains logic for movement, combat, and rendering.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { checkRectOverlap, checkCircleRect, constrainToWorld, lerp, getDistance, getAngle } from './physics.js';
import { spawnDamageText, createExplosion, SlashEffect, spawnHealText } from './particles.js';
import { DashSkill, SpinAttackSkill, FireballSkill } from './skills.js';

// --- Base Classes ---

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    render(p) {
        p.fill(255);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

class LivingEntity extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.stats = {
            maxHp: 100,
            hp: 100,
            attack: 10,
            defense: 0,
            speed: 3
        };
        this.facing = 1; // 1 Right, -1 Left
        this.invulnerable = 0;
        this.flashTime = 0;
        this.state = "IDLE"; // IDLE, RUN, ATTACK, HIT, DIE
    }

    takeDamage(amount, isCrit = false) {
        if (this.invulnerable > 0) return;

        const damage = Math.max(1, amount - this.stats.defense);
        this.stats.hp -= damage;
        this.flashTime = 10;
        
        spawnDamageText(this.x + this.width/2, this.y, damage, isCrit);
        createExplosion(this.x + this.width/2, this.y + this.height/2, 5, [200, 50, 50]);

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
        spawnHealText(this.x + this.width/2, this.y, amount);
    }

    die() {
        this.dead = true;
    }

    update() {
        super.update();
        if (this.flashTime > 0) this.flashTime--;
        if (this.invulnerable > 0) this.invulnerable--;
    }
}

// --- Player Class ---

export class Player extends LivingEntity {
    constructor(x, y) {
        super(x, y, 32, 48); // Taller than wide
        this.stats = {
            maxHp: 200,
            hp: 200,
            attack: 25,
            defense: 5,
            speed: 4
        };
        this.xp = 0;
        this.maxXp = 100;
        
        // Combat state
        this.attackCooldown = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        
        // Skills
        this.skills = {
            dash: new DashSkill(),
            spin: new SpinAttackSkill(),
            fireball: new FireballSkill()
        };
        
        // Animation
        this.animFrame = 0;
    }

    update(p) {
        // Handle input via gameState (decoupled)
        this.handleInput(p);
        
        // Physics
        super.update();
        
        // World bounds
        constrainToWorld(this);
        
        // Friction
        this.vx *= 0.8;
        this.vy *= 0.8;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;

        // Facing
        if (this.vx > 0) this.facing = 1;
        if (this.vx < 0) this.facing = -1;

        // Animation
        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            this.animFrame += 0.2;
        } else {
            this.animFrame = 0;
        }

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) this.comboCount = 0;
        }
        
        Object.values(this.skills).forEach(s => s.update());
        
        // Level Up Check
        if (this.xp >= this.maxXp) {
            this.levelUp();
        }
        
        // Interaction with items
        this.checkItemCollisions();
    }

    handleInput(p) {
        if (gameState.gamePhase !== "PLAYING") return;
        
        const inputs = gameState.inputs;
        
        // Movement
        if (inputs.left) this.vx -= 1;
        if (inputs.right) this.vx += 1;
        if (inputs.up) this.vy -= 1;
        if (inputs.down) this.vy += 1;
        
        // Normalize speed diagonal
        if ((inputs.left || inputs.right) && (inputs.up || inputs.down)) {
           // Basic normalization done by friction/acceleration logic roughly
           // Could use vectors, but this feels snappy enough for arcade
        }
        
        // Clamp speed
        const speed = this.stats.speed;
        this.vx = p.constrain(this.vx, -speed, speed);
        this.vy = p.constrain(this.vy, -speed, speed);
        
        // Attack
        if (inputs.attack && this.attackCooldown === 0) {
            this.performAttack(p);
        }
        
        // Skills
        if (inputs.dash) {
            this.skills.dash.use(this);
            gameState.inputs.dash = false; // consume input
        }
        
        if (inputs.skill) {
            // Check inputs for skill selection? For now just one active skill Z
            // Use Spin Attack
            this.skills.spin.use(this);
            gameState.inputs.skill = false;
        }
    }

    performAttack(p) {
        this.attackCooldown = 20; // Frames between hits
        this.comboTimer = 60; // 1 second to continue combo
        this.comboCount++;
        if (this.comboCount > 3) this.comboCount = 1;
        
        // Attack Hitbox
        const range = 50;
        const attackX = this.x + this.width/2 + (this.facing * 20);
        const attackY = this.y + this.height/2;
        
        // Visual Slash
        const effect = new SlashEffect(attackX, attackY, this.facing === 1 ? 0 : p.PI, range);
        gameState.particles.push(effect);
        
        // Check collisions with enemies
        let hit = false;
        gameState.enemies.forEach(enemy => {
            if (enemy.dead) return;
            
            // Simple distance check for melee
            const dist = getDistance(attackX, attackY, enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            
            if (dist < range) {
                const dmg = this.stats.attack + (this.comboCount * 5); // Combo bonus
                const isCrit = Math.random() < 0.2; // 20% crit chance
                enemy.takeDamage(isCrit ? dmg * 2 : dmg, isCrit);
                
                // Knockback
                enemy.vx += this.facing * 5;
                hit = true;
            }
        });
        
        if (hit) {
            // Screen shake slightly
            gameState.camera.shake = 2;
        }
    }

    levelUp() {
        this.stats.maxHp += 50;
        this.stats.hp = this.stats.maxHp;
        this.stats.attack += 5;
        this.stats.defense += 2;
        this.xp = this.xp - this.maxXp;
        this.maxXp = Math.floor(this.maxXp * 1.5);
        gameState.level++;
        
        spawnHealText(this.x + this.width/2, this.y, "LEVEL UP!");
        createExplosion(this.x + this.width/2, this.y, 20, [255, 255, 100]);
    }
    
    checkItemCollisions() {
        for (let i = gameState.items.length - 1; i >= 0; i--) {
            const item = gameState.items[i];
            if (checkRectOverlap(this, item)) {
                item.collect(this);
                gameState.items.splice(i, 1);
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.flashTime > 0 && Math.floor(p.millis() / 50) % 2 === 0) {
            p.fill(255, 0, 0);
        } else {
            p.fill(COLORS.text); // White skin roughly
        }
        
        // Flip if facing left
        p.scale(this.facing, 1);
        
        // Body (Zenonia style - big head, small body)
        // Body
        p.fill(50, 50, 150);
        p.rect(-10, 0, 20, 24);
        
        // Head
        p.fill(255, 220, 200); // Skin
        p.circle(0, -10, 30);
        
        // Hair (Spiky)
        p.fill(240, 240, 50); // Blonde/Gold
        p.triangle(-20, -15, -5, -35, 10, -15);
        p.triangle(-10, -15, 5, -40, 20, -15);
        p.triangle(0, -15, 15, -35, 25, -5);
        
        // Eyes
        p.fill(0);
        p.ellipse(5, -10, 4, 8);
        
        // Sword
        p.push();
        // Animate sword based on attack
        if (this.attackCooldown > 10) {
            p.rotate(p.PI / 4);
        }
        p.fill(200);
        p.rect(10, 5, 30, 6);
        p.fill(100);
        p.rect(10, 5, 8, 6); // Hilt
        p.pop();
        
        p.pop();
        
        // Draw stats if testing
        if (gameState.controlMode !== "HUMAN") {
            // Debug info
        }
    }
}

// --- Enemy Classes ---

export class Enemy extends LivingEntity {
    constructor(x, y, type) {
        super(x, y, 32, 32);
        this.type = type;
        this.detectionRange = 250;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.xpValue = 20;
    }

    update() {
        super.update();
        if (this.dead) return;
        
        const player = gameState.player;
        if (!player) return;

        const dist = getDistance(this.x, this.y, player.x, player.y);
        
        if (dist < this.detectionRange) {
            this.aiBehavior(player, dist);
        }
        
        // Wall collision/World bounds
        constrainToWorld(this);
        
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
    
    aiBehavior(player, dist) {
        // Basic chase
        if (dist > this.attackRange) {
            const angle = getAngle(this.x, this.y, player.x, player.y);
            this.vx = Math.cos(angle) * this.stats.speed;
            this.vy = Math.sin(angle) * this.stats.speed;
            
            // Facing
            this.facing = this.vx > 0 ? 1 : -1;
        } else {
            this.vx = 0;
            this.vy = 0;
            this.attack(player);
        }
    }
    
    attack(player) {
        if (this.attackCooldown <= 0) {
            player.takeDamage(this.stats.attack);
            this.attackCooldown = 60; // 1 second
            
            // Visual bump
            const angle = getAngle(this.x, this.y, player.x, player.y);
            this.vx = Math.cos(angle) * 5;
            this.vy = Math.sin(angle) * 5;
        }
    }

    die() {
        super.die();
        // Drop items
        if (Math.random() < 0.3) {
            gameState.items.push(new Loot(this.x, this.y, "POTION"));
        } else if (Math.random() < 0.1) {
             // Rare loot?
        }
        
        // Give XP
        if (gameState.player) {
            gameState.player.xp += this.xpValue;
            gameState.killCount++;
            gameState.score += this.xpValue * 10;
        }
    }
}

export class Slime extends Enemy {
    constructor(x, y) {
        super(x, y, "SLIME");
        this.stats.hp = 50;
        this.stats.attack = 8;
        this.stats.speed = 1.5;
        this.width = 24;
        this.height = 20;
        this.color = [50, 200, 50];
        this.jumpOffset = 0;
    }
    
    update() {
        super.update();
        this.jumpOffset = Math.abs(Math.sin(gameState.frameCount * 0.2)) * 5;
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height - this.jumpOffset);
        p.fill(this.flashTime > 0 ? [255, 255, 255] : this.color);
        p.stroke(30, 100, 30);
        // Slime shape
        p.beginShape();
        p.vertex(-12, 0);
        p.bezierVertex(-12, -15, 12, -15, 12, 0);
        p.vertex(12, 0);
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill(0);
        p.circle(-5, -5, 3);
        p.circle(5, -5, 3);
        p.pop();
    }
}

export class ShadowKnight extends Enemy {
    constructor(x, y) {
        super(x, y, "KNIGHT");
        this.stats.hp = 120;
        this.stats.attack = 15;
        this.stats.speed = 2.5;
        this.stats.defense = 5;
        this.xpValue = 50;
        this.width = 30;
        this.height = 40;
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        p.fill(this.flashTime > 0 ? [255, 0, 0] : [50, 50, 60]);
        // Armor
        p.rect(-10, -15, 20, 30);
        // Helmet
        p.fill(30);
        p.circle(0, -20, 24);
        // Red Eyes
        p.fill(255, 0, 0);
        p.rect(2, -22, 6, 2);
        p.pop();
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, "BOSS");
        this.stats.hp = 1000;
        this.stats.maxHp = 1000;
        this.stats.attack = 30;
        this.stats.speed = 1;
        this.width = 80;
        this.height = 80;
        this.xpValue = 5000;
        this.attackRange = 100;
    }
    
    aiBehavior(player, dist) {
        // Boss moves slower but relentless
        const angle = getAngle(this.x, this.y, player.x, player.y);
        this.vx = Math.cos(angle) * this.stats.speed;
        this.vy = Math.sin(angle) * this.stats.speed;
        
        if (dist < 150 && this.attackCooldown <= 0) {
            // Special Boss Attack (Shockwave)
            this.attackCooldown = 120;
            // Spawn projectiles in circle
            for (let i = 0; i < 8; i++) {
                const theta = (Math.PI * 2 / 8) * i;
                const px = this.x + this.width/2;
                const py = this.y + this.height/2;
                gameState.projectiles.push(new Projectile(px, py, px + Math.cos(theta)*100, py + Math.sin(theta)*100, 4, 15, "enemy"));
            }
        }
    }
    
    die() {
        super.die();
        gameState.gamePhase = "GAME_OVER_WIN";
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Aura
        p.noFill();
        p.stroke(100, 0, 100, 100);
        p.strokeWeight(2);
        p.circle(0, 0, 90 + Math.sin(gameState.frameCount * 0.1) * 10);
        
        p.fill(this.flashTime > 0 ? [255, 100, 100] : [20, 0, 40]);
        p.noStroke();
        p.rect(-40, -40, 80, 80);
        
        // Menacing face
        p.fill(255, 255, 0);
        p.triangle(-20, -10, -10, 0, -20, 0);
        p.triangle(20, -10, 10, 0, 20, 0);
        
        // HP Bar overhead
        p.fill(0);
        p.rect(-40, -60, 80, 10);
        p.fill(255, 0, 0);
        p.rect(-40, -60, 80 * (this.stats.hp / this.stats.maxHp), 10);
        
        p.pop();
    }
}

// --- Item / Projectile ---

export class Projectile extends Entity {
    constructor(x, y, targetX, targetY, speed, damage, owner) {
        super(x, y, 10, 10);
        this.damage = damage;
        this.owner = owner; // 'player' or 'enemy'
        this.lifetime = 120;
        
        const angle = getAngle(x, y, targetX, targetY);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = [255, 100, 100];
    }
    
    update() {
        super.update();
        this.lifetime--;
        if (this.lifetime <= 0) this.dead = true;
        
        // Collision
        if (this.owner === "player") {
            gameState.enemies.forEach(e => {
                if (checkCircleRect({x: this.x, y: this.y, radius: 5}, e)) {
                    e.takeDamage(this.damage);
                    this.dead = true;
                    createExplosion(this.x, this.y, 5, this.color);
                }
            });
        } else {
            if (gameState.player && checkCircleRect({x: this.x, y: this.y, radius: 5}, gameState.player)) {
                gameState.player.takeDamage(this.damage);
                this.dead = true;
                createExplosion(this.x, this.y, 5, this.color);
            }
        }
    }
    
    render(p) {
        p.fill(this.color);
        p.circle(this.x, this.y, 10);
    }
}

export class Loot extends Entity {
    constructor(x, y, type) {
        super(x, y, 16, 16);
        this.type = type; // 'POTION', 'GOLD'
        this.bobOffset = 0;
    }
    
    update() {
        this.bobOffset = Math.sin(gameState.frameCount * 0.1) * 3;
    }
    
    collect(player) {
        if (this.type === "POTION") {
            player.heal(50);
        }
        // Could add sound effect trigger here (if allowed)
    }
    
    render(p) {
        p.push();
        p.translate(this.x + 8, this.y + 8 + this.bobOffset);
        if (this.type === "POTION") {
            p.fill(255, 100, 100);
            p.rect(-4, -6, 8, 12);
            p.fill(255);
            p.rect(-2, -6, 4, 2); // Cap
        }
        p.pop();
    }
}