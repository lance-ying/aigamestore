// entities.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { createExplosion, AfterImage } from './particles.js';
import { dist, rectIntersect } from './utils.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 36;
        this.vx = 0;
        this.vy = 0;
        this.speed = 4;
        
        // Stats
        this.maxHealth = 5;
        this.health = 5;
        this.medkits = 2;
        this.modules = 0;
        this.totalModules = 3;
        
        // State
        this.facing = 1; // 1 Right, -1 Left
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashTime = 0;
        this.dashVector = {x:0, y:0};
        
        this.isAttacking = false;
        this.attackTime = 0;
        this.attackCooldown = 0;
        
        this.invincibleTime = 0;
    }

    update(p, input) {
        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibleTime > 0) this.invincibleTime--;
        
        // Dash Logic
        if (this.isDashing) {
            this.x += this.dashVector.x * 12; // Dash speed
            this.y += this.dashVector.y * 12;
            this.dashTime--;
            
            // Create afterimage
            if (this.dashTime % 2 === 0) {
                gameState.particles.push(new AfterImage(this.x, this.y, this.width, this.height, this.facing, COLORS.PLAYER));
            }
            
            if (this.dashTime <= 0) {
                this.isDashing = false;
                this.vx = 0;
                this.vy = 0;
            }
            return; // Skip normal movement while dashing
        }

        // Attack Logic
        if (this.isAttacking) {
            this.attackTime--;
            if (this.attackTime <= 0) {
                this.isAttacking = false;
            }
            // Check Hitbox
            if (this.attackTime === 10) { // Active frame
                this.checkAttackHit(p);
            }
        }

        // Movement Input
        let dx = 0;
        let dy = 0;
        if (input.keys[p.LEFT_ARROW]) dx = -1;
        if (input.keys[p.RIGHT_ARROW]) dx = 1;
        if (input.keys[p.UP_ARROW]) dy = -1;
        if (input.keys[p.DOWN_ARROW]) dy = 1;

        // Normalise diagonal
        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx*dx + dy*dy);
            dx /= length;
            dy /= length;
            
            this.vx = dx * this.speed;
            this.vy = dy * this.speed;
            
            if (dx !== 0) this.facing = Math.sign(dx);
        } else {
            this.vx *= gameState.friction;
            this.vy *= gameState.friction;
        }

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // Dash Input
        if (input.keys[32] && this.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) { // Space
            this.startDash(dx, dy);
        }

        // Attack Input
        if (input.keys[90] && this.attackCooldown <= 0 && !this.isAttacking) { // Z
            this.startAttack();
        }
        
        // Heal Input
        if (input.keys[16] && this.medkits > 0 && this.health < this.maxHealth) { // Shift
             if (p.frameCount % 10 === 0) { // Simple debounce/cooldown for key press handled by logic
                 // Check if key was just pressed logic is in input, but for continuous key, we need a flag
                 // Assuming single press logic in Input handler or here:
             }
        }

        // Bound to world
        this.x = p.constrain(this.x, this.width/2, WORLD_WIDTH - this.width/2);
        this.y = p.constrain(this.y, this.height/2, WORLD_HEIGHT - this.height/2);
    }

    startDash(dx, dy) {
        this.isDashing = true;
        this.dashTime = 10; // Frames
        this.dashCooldown = 40;
        this.dashVector = {x: dx, y: dy};
        createExplosion(this.x, this.y, 5, 'DUST');
    }

    startAttack() {
        this.isAttacking = true;
        this.attackTime = 15;
        this.attackCooldown = 25;
        // SFX visual
    }

    checkAttackHit(p) {
        // Define Hitbox relative to facing
        const reach = 50;
        const hitX = this.x + (this.facing * 20);
        const hitY = this.y;
        
        gameState.enemies.forEach(enemy => {
            const d = dist(hitX, hitY, enemy.x, enemy.y);
            if (d < reach) {
                enemy.takeDamage(1, p);
                createExplosion(enemy.x, enemy.y, 5, 'SPARK');
            }
        });
    }

    takeDamage(amount) {
        if (this.invincibleTime > 0 || this.isDashing) return;
        
        this.health -= amount;
        this.invincibleTime = 60;
        gameState.cameraShake = 10;
        createExplosion(this.x, this.y, 8, 'BLOOD');
        
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    heal() {
        if (this.medkits > 0 && this.health < this.maxHealth) {
            this.medkits--;
            this.health = Math.min(this.health + 2, this.maxHealth); // Heals 2 HP
            createExplosion(this.x, this.y, 10, 'SPARK'); // Heal effect
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Flash if invincible
        if (this.invincibleTime > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
             // don't draw
        } else {
            if (this.facing < 0) p.scale(-1, 1);

            // Draw Cape
            p.fill(COLORS.PLAYER_CAPE);
            p.noStroke();
            p.beginShape();
            p.vertex(-5, -10);
            p.vertex(-12, 15);
            p.vertex(0, 15);
            p.endShape(p.CLOSE);

            // Draw Body
            p.fill(COLORS.PLAYER);
            p.rectMode(p.CENTER);
            p.rect(0, 0, this.width, this.height, 4);

            // Draw Eyes (visor)
            p.fill(255);
            p.rect(4, -5, 10, 4);
            
            // Draw Sword Slash
            if (this.isAttacking) {
                p.noFill();
                p.stroke(COLORS.SWORD_ARC);
                p.strokeWeight(3);
                // Arc animation based on attackTime
                let startAngle = -p.PI / 3;
                let endAngle = p.PI / 3;
                let progress = 1 - (this.attackTime / 15);
                p.arc(10, 0, 60, 60, startAngle + (progress * p.PI/2), endAngle + (progress * p.PI/2));
            }
        }
        p.pop();
    }
}

export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'MELEE' or 'RANGED'
        this.hp = type === 'MELEE' ? 3 : 2;
        this.width = 24;
        this.height = 24;
        this.state = 'IDLE';
        this.timer = 0;
        this.detectRange = 250;
        this.attackRange = type === 'MELEE' ? 40 : 200;
        this.speed = type === 'MELEE' ? 2.5 : 1.5;
        this.facing = 1;
    }

    update(p) {
        if (!gameState.player) return;

        const d = dist(this.x, this.y, gameState.player.x, gameState.player.y);
        
        // Simple AI
        switch(this.state) {
            case 'IDLE':
                if (d < this.detectRange) this.state = 'CHASE';
                break;
            case 'CHASE':
                if (d > this.detectRange * 1.5) {
                    this.state = 'IDLE';
                } else if (d < this.attackRange) {
                    this.state = 'ATTACK';
                    this.timer = 30; // Windup
                } else {
                    // Move towards player
                    const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed;
                    this.facing = Math.sign(Math.cos(angle)) || 1;
                }
                break;
            case 'ATTACK':
                this.timer--;
                if (this.timer === 0) {
                    this.performAttack(p);
                    this.state = 'COOLDOWN';
                    this.timer = 60;
                }
                break;
            case 'COOLDOWN':
                this.timer--;
                if (this.timer <= 0) this.state = 'CHASE';
                break;
        }
    }

    performAttack(p) {
        if (this.type === 'MELEE') {
            // Dash attack
            const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
            this.x += Math.cos(angle) * 40; // Lunge
            this.y += Math.sin(angle) * 40;
            
            if (dist(this.x, this.y, gameState.player.x, gameState.player.y) < 40) {
                gameState.player.takeDamage(1);
            }
        } else {
            // Shoot
            gameState.projectiles.push(new Projectile(this.x, this.y, gameState.player.x, gameState.player.y, true));
        }
    }

    takeDamage(amount, p) {
        this.hp -= amount;
        createExplosion(this.x, this.y, 5, 'GLITCH');
        if (this.hp <= 0) {
            // Drop medkit chance
            if (p.random() < 0.3) {
                gameState.collectibles.push(new Collectible(this.x, this.y, 'MEDKIT'));
            }
            // Remove self
            const idx = gameState.enemies.indexOf(this);
            if (idx > -1) gameState.enemies.splice(idx, 1);
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        if (this.facing < 0) p.scale(-1, 1);
        
        p.fill(this.type === 'MELEE' ? COLORS.ENEMY_MELEE : COLORS.ENEMY_RANGED);
        p.noStroke();
        
        // Draw sprite (Diamond shape for drifter style enemies)
        p.beginShape();
        p.vertex(0, -15);
        p.vertex(12, 0);
        p.vertex(0, 15);
        p.vertex(-12, 0);
        p.endShape(p.CLOSE);
        
        // Eye
        p.fill(0);
        p.rectMode(p.CENTER);
        p.rect(5, 0, 4, 4);

        // Windup flash
        if (this.state === 'ATTACK') {
            p.fill(255, 255, 255, 150);
            p.circle(0, 0, 10);
        }

        p.pop();
    }
}

export class Projectile {
    constructor(x, y, targetX, targetY, isHostile) {
        this.x = x;
        this.y = y;
        this.isHostile = isHostile;
        this.radius = 6;
        this.speed = 6;
        this.damage = 1;
        
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.life = 100;
    }

    render(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        p.push();
        p.fill(COLORS.PROJECTILE);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        p.pop();
    }
}

export class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'MODULE', 'MEDKIT'
        this.w = 16;
        this.h = 16;
        this.bobOffset = 0;
    }

    update(p) {
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 3;
        
        const player = gameState.player;
        if (player && dist(this.x, this.y, player.x, player.y) < 20) {
            if (this.type === 'MODULE') {
                player.modules++;
                // Win Condition
                if (player.modules >= player.totalModules) {
                     // Normally opens gate, but for this scope, let's say collecting all wins
                     gameState.gamePhase = "GAME_OVER_WIN";
                }
            } else if (this.type === 'MEDKIT') {
                player.medkits = Math.min(player.medkits + 1, 3);
            }
            
            // Log collection
            if(p.logs) p.logs.game_info.push({ event: 'collected', type: this.type, time: p.millis() });

            // Remove
            const idx = gameState.collectibles.indexOf(this);
            if (idx > -1) gameState.collectibles.splice(idx, 1);
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y + this.bobOffset);
        
        if (this.type === 'MODULE') {
            p.fill(COLORS.MODULE);
            p.triangle(0, -10, 8, 5, -8, 5);
        } else {
            p.fill(COLORS.MEDKIT);
            p.rectMode(p.CENTER);
            p.rect(0, 0, 12, 12);
            p.fill(255);
            p.rect(0, 0, 4, 10);
            p.rect(0, 0, 10, 4);
        }
        
        // Glow
        p.noFill();
        p.stroke(this.type === 'MODULE' ? COLORS.MODULE : COLORS.MEDKIT);
        p.strokeWeight(1);
        p.circle(0, 0, 25 + Math.sin(p.frameCount * 0.2) * 2);
        
        p.pop();
    }
}

export class Wall {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    
    render(p) {
        p.fill(COLORS.WALL);
        p.noStroke();
        p.rect(this.x, this.y, this.w, this.h);
        
        // Detail
        p.stroke(0);
        p.strokeWeight(2);
        p.line(this.x, this.y, this.x + this.w, this.y);
        p.line(this.x, this.y + this.h, this.x + this.w, this.y + this.h);
    }
}