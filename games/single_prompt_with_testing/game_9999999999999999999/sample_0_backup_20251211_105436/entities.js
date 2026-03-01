/**
 * entities.js
 * Contains all game entity classes: Player, Enemy, Projectile, Wall, Pickup, Door.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, PLAYER_FOCUS_SPEED, PLAYER_DASH_SPEED, PLAYER_DASH_DURATION, PLAYER_DASH_COOLDOWN, PLAYER_MAX_HEALTH, COLOR_PALETTE } from './globals.js';
import { checkCircleRect, checkCircleCollision, moveEntityWithCollisions } from './physics.js';
import { KEYS, isKeyDown, wasKeyPressed } from './input.js';
import { createExplosion, createDebris, FloatingText } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

/* ================== BASE ENTITY ================== */
class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.markedForDeletion = false;
    }

    update(p) {}
    render(p) {}
}

/* ================== WALL ================== */
export class Wall {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
    
    render(p) {
        p.push();
        p.fill(COLOR_PALETTE.wall);
        p.stroke(COLOR_PALETTE.wallHighlight);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Detail
        p.noStroke();
        p.fill(0, 0, 0, 50);
        p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        p.pop();
    }
}

/* ================== PROJECTILE ================== */
export class Projectile extends Entity {
    constructor(x, y, vx, vy, isEnemy, damage) {
        super(x, y, 4);
        this.vx = vx;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.damage = damage;
        this.color = isEnemy ? COLOR_PALETTE.projectileEnemy : COLOR_PALETTE.projectilePlayer;
    }

    update(p) {
        this.x += this.vx;
        this.y += this.vy;

        // Wall collision
        for (let wall of gameState.walls) {
            if (checkCircleRect(this, wall)) {
                this.markedForDeletion = true;
                createDebris(this.x, this.y, 3, this.color);
                return;
            }
        }

        // Screen bounds
        if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.markedForDeletion = true;
        }
    }

    render(p) {
        p.push();
        p.fill(this.color);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        // Trail
        p.fill(this.color[0], this.color[1], this.color[2], 100);
        p.circle(this.x - this.vx, this.y - this.vy, this.radius);
        p.pop();
    }
}

/* ================== PLAYER ================== */
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 10); // Hitbox radius
        this.visualRadius = 15;
        this.health = PLAYER_MAX_HEALTH;
        this.maxHealth = PLAYER_MAX_HEALTH;
        
        // Movement state
        this.vx = 0;
        this.vy = 0;
        this.facingAngle = -Math.PI / 2; // Up
        
        // Dash state
        this.isDashing = false;
        this.dashFrame = 0;
        this.dashCooldownTimer = 0;
        
        // Weapon state
        this.weaponLevel = 1;
        this.fireCooldown = 0;
        this.baseFireRate = 15; // frames
        
        // Invincibility
        this.invincibleTimer = 0;
    }

    update(p) {
        // Cooldowns
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        // 1. Determine Input Actions
        let dx = 0;
        let dy = 0;
        let dashPressed = false;
        let shootPressed = false;
        let focusPressed = false;

        if (gameState.controlMode === "HUMAN") {
            if (isKeyDown(KEYS.LEFT)) dx -= 1;
            if (isKeyDown(KEYS.RIGHT)) dx += 1;
            if (isKeyDown(KEYS.UP)) dy -= 1;
            if (isKeyDown(KEYS.DOWN)) dy += 1;
            
            dashPressed = wasKeyPressed(KEYS.SPACE);
            shootPressed = isKeyDown(KEYS.Z);
            focusPressed = isKeyDown(KEYS.SHIFT);
        } else {
            // Automated testing input
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.moveX) dx = action.moveX;
                if (action.moveY) dy = action.moveY;
                dashPressed = action.dash;
                shootPressed = action.shoot;
            }
        }

        // Normalize movement vector
        if (dx !== 0 || dy !== 0) {
            const mag = Math.sqrt(dx * dx + dy * dy);
            dx /= mag;
            dy /= mag;
        }

        // 2. Dash Logic
        if (this.isDashing) {
            this.dashFrame++;
            // Continue moving in dash direction (locked velocity)
            moveEntityWithCollisions(this, this.vx, this.vy, gameState.walls);
            createDebris(this.x, this.y, 1, [100, 200, 255]); // Trail

            if (this.dashFrame >= PLAYER_DASH_DURATION) {
                this.isDashing = false;
                this.vx = 0;
                this.vy = 0;
            }
            return; // Skip normal movement/shooting while dashing
        }

        if (dashPressed && this.dashCooldownTimer === 0 && (dx !== 0 || dy !== 0)) {
            this.startDash(dx, dy);
            return;
        }

        // 3. Normal Movement
        const speed = focusPressed ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
        this.vx = dx * speed;
        this.vy = dy * speed;

        moveEntityWithCollisions(this, this.vx, this.vy, gameState.walls);

        // 4. Facing Logic
        // If focusing, don't change facing unless shooting or special logic? 
        // Actually, Shift usually Locks angle. If not pressing shift, angle updates to move dir.
        if (!focusPressed && (dx !== 0 || dy !== 0)) {
            this.facingAngle = Math.atan2(dy, dx);
        }

        // 5. Shooting
        if (shootPressed && this.fireCooldown === 0) {
            this.shoot();
        }
        
        // Log player state
        if (p.frameCount % 60 === 0 && p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                screen_x: this.x,
                screen_y: this.y,
                game_x: this.x,
                game_y: this.y,
                health: this.health,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    startDash(dx, dy) {
        this.isDashing = true;
        this.dashFrame = 0;
        this.dashCooldownTimer = PLAYER_DASH_COOLDOWN;
        this.vx = dx * PLAYER_DASH_SPEED;
        this.vy = dy * PLAYER_DASH_SPEED;
        createExplosion(this.x, this.y, 5, 'smoke');
    }

    shoot() {
        this.fireCooldown = Math.max(5, this.baseFireRate - (this.weaponLevel * 1));
        
        const speed = 10;
        const vx = Math.cos(this.facingAngle) * speed;
        const vy = Math.sin(this.facingAngle) * speed;
        
        const damage = 10 + (this.weaponLevel * 2);
        gameState.projectiles.push(new Projectile(this.x, this.y, vx, vy, false, damage));
        
        // Spread shot if upgraded
        if (this.weaponLevel >= 3) {
             const angle1 = this.facingAngle - 0.2;
             const angle2 = this.facingAngle + 0.2;
             gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle1)*speed, Math.sin(angle1)*speed, false, damage * 0.7));
             gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle2)*speed, Math.sin(angle2)*speed, false, damage * 0.7));
        }
    }

    takeDamage(amount) {
        if (this.isDashing || this.invincibleTimer > 0 || gameState.godMode) return;
        
        this.health -= amount;
        this.invincibleTimer = 60; // 1 second i-frames
        gameState.cameraShake = 5;
        
        gameState.particles.push(new FloatingText(this.x, this.y - 20, `-${amount}`, [255, 0, 0]));
        createExplosion(this.x, this.y, 5, 'spark');
        
        if (this.health <= 0) {
            this.health = 0;
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, 20, 'fire');
        }
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        gameState.particles.push(new FloatingText(this.x, this.y - 20, `+${amount}`, [0, 255, 0]));
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Flicker if invincible
        if (this.invincibleTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.pop();
            return;
        }

        // Draw Ship
        p.rotate(this.facingAngle);
        p.fill(this.isDashing ? COLOR_PALETTE.playerHit : COLOR_PALETTE.player);
        p.stroke(255);
        p.strokeWeight(2);
        
        // Triangle ship shape
        p.beginShape();
        p.vertex(10, 0);
        p.vertex(-8, -8);
        p.vertex(-4, 0);
        p.vertex(-8, 8);
        p.endShape(p.CLOSE);
        
        // Engine glow
        if (this.vx !== 0 || this.vy !== 0) {
            p.fill(255, 100, 0, 200);
            p.noStroke();
            p.circle(-10, 0, 6 + Math.sin(p.frameCount * 0.5) * 2);
        }
        
        p.pop();
        
        // Debug
        // p.noFill(); p.stroke(0, 255, 0); p.circle(this.x, this.y, this.radius * 2);
    }
}

/* ================== ENEMY ================== */
export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 15);
        this.type = type || 'drone';
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 2;
        this.attackCooldown = 0;
        this.scoreValue = 100;
        
        // Setup stats based on type
        if (this.type === 'drone') {
            this.health = 30;
            this.speed = 0.8;
            this.color = COLOR_PALETTE.enemyWeak;
        } else if (this.type === 'tank') {
            this.health = 80;
            this.speed = 0.4;
            this.radius = 20;
            this.color = COLOR_PALETTE.enemy;
            this.scoreValue = 300;
        } else if (this.type === 'boss') {
            this.health = 500;
            this.speed = 0.5;
            this.radius = 30;
            this.color = COLOR_PALETTE.enemyElite;
            this.scoreValue = 5000;
        }
        
        this.state = 'CHASE'; // IDLE, CHASE, ATTACK
    }

    update(p) {
        if (!gameState.player) return;

        const distToPlayer = Math.hypot(gameState.player.x - this.x, gameState.player.y - this.y);
        
        // Collision with player
        if (checkCircleCollision(this, gameState.player)) {
            gameState.player.takeDamage(10);
            // Bounce back
            const angle = Math.atan2(this.y - gameState.player.y, this.x - gameState.player.x);
            this.x += Math.cos(angle) * 5;
            this.y += Math.sin(angle) * 5;
        }

        // AI Logic
        if (this.type === 'drone') {
            this.updateDrone(distToPlayer);
        } else if (this.type === 'tank') {
            this.updateTank(distToPlayer);
        } else if (this.type === 'boss') {
            this.updateBoss(p, distToPlayer);
        }

        // Collision with projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            let proj = gameState.projectiles[i];
            if (!proj.isEnemy && checkCircleCollision(this, proj)) {
                this.takeDamage(proj.damage);
                proj.markedForDeletion = true;
                createDebris(proj.x, proj.y, 2, proj.color);
            }
        }
    }

    updateDrone(dist) {
        if (dist > 300) return; // Dormant

        // Move towards player
        const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
        
        // Flocking / Separation (simple)
        let pushX = 0, pushY = 0;
        for (let other of gameState.enemies) {
            if (other === this) continue;
            const d = Math.hypot(other.x - this.x, other.y - this.y);
            if (d < this.radius * 2) {
                const pushAngle = Math.atan2(this.y - other.y, this.x - other.x);
                pushX += Math.cos(pushAngle);
                pushY += Math.sin(pushAngle);
            }
        }

        this.x += (Math.cos(angle) + pushX) * this.speed;
        this.y += (Math.sin(angle) + pushY) * this.speed;

        moveEntityWithCollisions(this, 0, 0, gameState.walls); // Just resolve overlaps

        // Shoot
        if (this.attackCooldown <= 0 && dist < 200) {
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle)*4, Math.sin(angle)*4, true, 10));
            this.attackCooldown = 120; // 2 seconds
        } else {
            this.attackCooldown--;
        }
    }

    updateTank(dist) {
        if (dist > 400) return;

        // Move slowly
        const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
        if (dist > 100) {
             this.x += Math.cos(angle) * this.speed;
             this.y += Math.sin(angle) * this.speed;
             moveEntityWithCollisions(this, 0, 0, gameState.walls);
        }

        // Shoot Burst
        if (this.attackCooldown <= 0 && dist < 300) {
            for(let i=0; i<3; i++) {
                setTimeout(() => {
                    if(!this.markedForDeletion && gameState.player) {
                        const aim = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
                        gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(aim)*5, Math.sin(aim)*5, true, 15));
                    }
                }, i * 200);
            }
            this.attackCooldown = 180;
        } else {
            this.attackCooldown--;
        }
    }

    updateBoss(p, dist) {
        // Boss Logic
        const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
        
        // Always move slowly to center or player
        this.x += Math.cos(angle) * this.speed * 0.5;
        this.y += Math.sin(angle) * this.speed * 0.5;
        
        // Phases based on health?
        if (this.attackCooldown <= 0) {
            // Radial Blast
            for(let i=0; i<8; i++) {
                const a = angle + (i * Math.PI / 4);
                gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*3, Math.sin(a)*3, true, 15));
            }
            this.attackCooldown = 100;
        } else {
            this.attackCooldown--;
        }
    }

    takeDamage(amount) {
        if (gameState.godMode && this.type !== 'boss') amount = 999;
        
        this.health -= amount;
        gameState.particles.push(new FloatingText(this.x, this.y - 15, `${amount}`, [255, 255, 255]));
        
        if (this.health <= 0) {
            this.markedForDeletion = true;
            createExplosion(this.x, this.y, 10, 'blood');
            gameState.score += this.scoreValue;
            
            // Drop loot chance
            if (Math.random() < 0.2) {
                gameState.pickups.push(new Pickup(this.x, this.y, 'health'));
            } else if (Math.random() < 0.05) {
                gameState.pickups.push(new Pickup(this.x, this.y, 'weapon'));
            }
            
            // Boss death win condition handled in game loop
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(this.color);
        p.stroke(255);
        p.strokeWeight(1);
        
        if (this.type === 'drone') {
            p.rectMode(p.CENTER);
            p.rotate(p.frameCount * 0.1);
            p.rect(0, 0, 20, 20);
        } else if (this.type === 'tank') {
            p.rectMode(p.CENTER);
            p.rect(0, 0, 30, 30);
            p.fill(0);
            p.circle(0, 0, 10);
        } else if (this.type === 'boss') {
            p.fill(COLOR_PALETTE.enemyElite);
            p.circle(0, 0, this.radius * 2);
            p.fill(0);
            p.textAlign(p.CENTER);
            p.text("BOSS", 0, 5);
        }
        
        // Health bar
        const hpPct = this.health / this.maxHealth;
        p.noStroke();
        p.fill(255, 0, 0);
        p.rect(-15, -this.radius - 10, 30, 4);
        p.fill(0, 255, 0);
        p.rect(-15, -this.radius - 10, 30 * hpPct, 4);
        
        p.pop();
    }
}

/* ================== PICKUP ================== */
export class Pickup extends Entity {
    constructor(x, y, type) {
        super(x, y, 8);
        this.type = type; // 'health', 'weapon'
        this.bobOffset = 0;
    }

    update(p) {
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 3;
        
        if (gameState.player && checkCircleCollision(this, gameState.player)) {
            if (this.type === 'health') {
                gameState.player.heal(25);
            } else if (this.type === 'weapon') {
                gameState.player.weaponLevel++;
                gameState.particles.push(new FloatingText(this.x, this.y, "WEAPON UP!", [255, 215, 0]));
            }
            this.markedForDeletion = true;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y + this.bobOffset);
        if (this.type === 'health') {
            p.fill(0, 255, 0);
            p.rectMode(p.CENTER);
            p.rect(0, 0, 8, 20);
            p.rect(0, 0, 20, 8);
        } else {
            p.fill(255, 215, 0);
            p.circle(0, 0, 15);
            p.fill(0);
            p.textAlign(p.CENTER);
            p.textSize(10);
            p.text("UP", 0, 4);
        }
        p.pop();
    }
}

/* ================== DOOR ================== */
export class Door extends Entity {
    constructor(x, y) {
        super(x, y, 20);
        this.isOpen = false;
    }

    update(p) {
        // Check if room is cleared to open
        if (!this.isOpen && gameState.enemies.length === 0) {
            this.isOpen = true;
            gameState.roomCleared = true;
            gameState.particles.push(new FloatingText(this.x, this.y - 20, "SECTOR SECURED", [0, 255, 0]));
        }

        if (this.isOpen && gameState.player && checkCircleCollision(this, gameState.player)) {
            // Next level
            gameState.gamePhase = "NEXT_LEVEL_TRANSITION";
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.noStroke();
        p.fill(this.isOpen ? COLOR_PALETTE.doorOpen : COLOR_PALETTE.doorLocked);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 40, 40);
        p.fill(0);
        p.textAlign(p.CENTER);
        p.textSize(10);
        p.text(this.isOpen ? "EXIT" : "LOCK", 0, 4);
        p.pop();
    }
}