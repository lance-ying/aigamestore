import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { dist, clamp } from './utils.js';
import { Weapon } from './weapons.js';
import { createExplosion } from './particles.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 16;
        
        // Stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.xp = 0;
        this.maxXp = 10;
        this.level = 1;
        this.speed = 4;
        
        this.stats = {
            damageMult: 1,
            moveSpeedMult: 1,
            pickupRange: 60
        };

        // Combat
        this.weapons = [];
        this.addWeapon('PISTOL'); // Starter weapon
        
        this.stamina = 100;
        this.dashCooldown = 0;
        this.ultCooldown = 0;
        this.isDashing = false;

        // Visual
        this.color = [210, 180, 140]; // Potato color
    }

    addWeapon(type) {
        if (this.weapons.length < 6) {
            this.weapons.push(new Weapon(type, this));
        }
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.maxXp = Math.floor(this.maxXp * 1.5);
        this.hp = this.maxHp; // Heal on level up
        
        // Random upgrade
        const r = Math.random();
        if (r < 0.33) {
            this.addWeapon('SMG');
            gameState.floatingTexts.push({x: this.x, y: this.y - 20, text: "NEW WEAPON: SMG!", color: [200, 200, 255], life: 60, vy: -1, update: function(){this.y+=this.vy; this.life--;}, render: function(p){p.fill(this.color); p.text(this.text, this.x, this.y);}});
        } else if (r < 0.66) {
            this.stats.damageMult += 0.2;
            gameState.floatingTexts.push({x: this.x, y: this.y - 20, text: "DAMAGE UP!", color: [255, 50, 50], life: 60, vy: -1, update: function(){this.y+=this.vy; this.life--;}, render: function(p){p.fill(this.color); p.text(this.text, this.x, this.y);}});
        } else {
            this.addWeapon('SHOTGUN');
            gameState.floatingTexts.push({x: this.x, y: this.y - 20, text: "NEW WEAPON: SHOTGUN!", color: [255, 100, 100], life: 60, vy: -1, update: function(){this.y+=this.vy; this.life--;}, render: function(p){p.fill(this.color); p.text(this.text, this.x, this.y);}});
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.maxXp) {
            this.levelUp();
        }
    }

    takeDamage(amount) {
        if (this.isDashing) return; // Invincible during dash
        this.hp -= amount;
        gameState.shakeTimer = 10;
        gameState.shakeMagnitude = 5;
        if (this.hp <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, [210, 180, 140], 50);
        }
    }

    update() {
        // Physics integration
        this.x += this.vx;
        this.y += this.vy;
        
        // Wall collision
        this.x = clamp(this.x, this.radius, CANVAS_WIDTH - this.radius);
        this.y = clamp(this.y, this.radius, CANVAS_HEIGHT - this.radius);

        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.ultCooldown > 0) this.ultCooldown--;
        
        // Stamina regen
        if (this.stamina < 100) this.stamina += 0.5;

        // Weapons
        this.weapons.forEach(w => w.update());

        // Dash state
        if (this.isDashing) {
            this.vx *= 0.9;
            this.vy *= 0.9;
            if (Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1) {
                this.isDashing = false;
            }
        } else {
             // Friction
            this.vx *= gameState.friction;
            this.vy *= gameState.friction;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Draw weapons below
        // Actually weapons need to be drawn in a specific order, but simple is fine
        
        // Draw Body
        p.fill(this.color);
        p.stroke(100, 80, 50);
        p.strokeWeight(2);
        p.ellipse(0, 0, this.radius * 2, this.radius * 2.2); // Potato shape
        
        // Draw Face
        p.fill(0);
        p.noStroke();
        
        // Eyes
        p.ellipse(-6, -4, 4, 6);
        p.ellipse(6, -4, 4, 6);
        
        // Mouth
        p.noFill();
        p.stroke(0);
        p.strokeWeight(1);
        if (this.hp < 30) {
            p.arc(0, 6, 10, 5, p.PI, 0); // Sad
        } else {
            p.arc(0, 6, 10, 5, 0, p.PI); // Happy/Determined
        }
        
        // Bandana if level high
        if (this.level > 3) {
            p.fill(255, 0, 0);
            p.noStroke();
            p.rectMode(p.CENTER);
            p.rect(0, -10, 34, 6);
        }

        p.pop();

        // Render Weapons
        this.weapons.forEach((w, i) => w.render(p, i, this.weapons.length));
    }
}

export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        
        this.type = type || 'BASIC';
        
        switch(this.type) {
            case 'TANK':
                this.radius = 20;
                this.hp = 50 + (gameState.wave * 10);
                this.speed = 1;
                this.damage = 15;
                this.color = [50, 150, 50]; // Green
                this.xpValue = 5;
                break;
            case 'SWARM':
                this.radius = 10;
                this.hp = 15 + (gameState.wave * 5);
                this.speed = 2.5;
                this.damage = 5;
                this.color = [200, 50, 200]; // Purple
                this.xpValue = 1;
                break;
            case 'BOSS':
                this.radius = 40;
                this.hp = 500;
                this.speed = 1.2;
                this.damage = 30;
                this.color = [255, 0, 0]; // Red
                this.xpValue = 100;
                break;
            default: // BASIC
                this.radius = 14;
                this.hp = 30 + (gameState.wave * 5);
                this.speed = 1.5;
                this.damage = 10;
                this.color = [150, 150, 150]; // Gray
                this.xpValue = 2;
        }
        
        this.maxHp = this.hp;
        this.vx = 0;
        this.vy = 0;
        this.knockback = {x:0, y:0};
    }

    takeDamage(amount, kx, ky) {
        this.hp -= amount;
        this.knockback.x = kx * 4;
        this.knockback.y = ky * 4;
        
        // Flash white
        this.isFlashing = true;
        setTimeout(() => { this.isFlashing = false; }, 50);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        gameState.score += this.xpValue * 10;
        gameState.enemiesKilled++;
        
        // Drop Material
        gameState.collectibles.push(new Collectible(this.x, this.y, this.xpValue));
        
        createExplosion(this.x, this.y, this.color, 8);
        
        // Remove self
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
    }

    update() {
        if (!gameState.player) return;

        // Move towards player
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        
        if (d > 0) {
            this.vx = (dx / d) * this.speed;
            this.vy = (dy / d) * this.speed;
        }
        
        // Apply knockback
        this.x += this.vx + this.knockback.x;
        this.y += this.vy + this.knockback.y;
        
        this.knockback.x *= 0.8;
        this.knockback.y *= 0.8;
        
        // Simple separation boids-like
        gameState.enemies.forEach(other => {
            if (other === this) return;
            const distSq = (this.x - other.x)**2 + (this.y - other.y)**2;
            const minRad = (this.radius + other.radius);
            if (distSq < minRad * minRad) {
                const angle = Math.atan2(this.y - other.y, this.x - other.x);
                const force = 0.5;
                this.x += Math.cos(angle) * force;
                this.y += Math.sin(angle) * force;
            }
        });
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(this.isFlashing ? 255 : this.color);
        p.stroke(0);
        p.strokeWeight(1);
        
        if (this.type === 'BOSS') {
            p.rectMode(p.CENTER);
            p.rect(0, 0, this.radius * 2, this.radius * 2);
            // Boss HP bar
            p.fill(0);
            p.rect(0, -this.radius - 10, 60, 8);
            p.fill(255, 0, 0);
            p.rect(0, -this.radius - 10, 60 * (this.hp / this.maxHp), 6);
        } else {
            p.circle(0, 0, this.radius * 2);
        }
        
        // Alien eyes
        p.fill(0);
        p.circle(-5, -2, 4);
        p.circle(5, -2, 4);
        
        p.pop();
    }
}

export class Collectible {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 5;
        this.isCollected = false;
        this.moveSpeed = 0;
    }

    update() {
        if (!gameState.player) return;

        const d = dist(this.x, this.y, gameState.player.x, gameState.player.y);
        
        // Magnet effect
        if (d < gameState.player.stats.pickupRange || this.isCollected) {
            this.isCollected = true;
            this.moveSpeed += 0.5;
            
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            this.x += Math.cos(angle) * (6 + this.moveSpeed);
            this.y += Math.sin(angle) * (6 + this.moveSpeed);
            
            if (d < gameState.player.radius) {
                gameState.player.gainXp(this.value);
                // Remove
                const idx = gameState.collectibles.indexOf(this);
                if (idx > -1) gameState.collectibles.splice(idx, 1);
            }
        }
    }

    render(p) {
        p.fill(50, 255, 50);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
    }
}