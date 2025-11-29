import { gameState, CONSTANTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { isKeyDown, isKeyPressed } from './input.js';
import { ParticleSystem } from './particles.js';

class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
    }

    render(p) {
        // Override
    }
}

export class Brawler extends Entity {
    constructor(x, y, isPlayer = false) {
        super(x, y, 15);
        this.isPlayer = isPlayer;
        this.health = isPlayer ? CONSTANTS.PLAYER_HEALTH : CONSTANTS.ENEMY_HEALTH;
        this.maxHealth = this.health;
        this.speed = isPlayer ? CONSTANTS.PLAYER_SPEED : CONSTANTS.ENEMY_SPEED;
        this.facingAngle = 0;
        this.superCharge = 0;
        this.isDead = false;
        
        // Cooldowns
        this.attackCooldown = 0;
        this.dashCooldown = 0;
    }

    takeDamage(amount, p) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die(p);
        }
    }

    die(p) {
        this.isDead = true;
        // Spawn particles
        gameState.particles.push(new ParticleSystem(this.x, this.y, [255, 0, 0], 20));
        
        if (this.isPlayer) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        } else {
            // Remove from enemies array handled in logic or marked dead
            const idx = gameState.enemies.indexOf(this);
            if (idx > -1) gameState.enemies.splice(idx, 1);
            gameState.score += 100;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Health bar
        p.noStroke();
        p.fill(50);
        p.rect(-20, -30, 40, 6);
        p.fill(this.isPlayer ? [0, 255, 0] : [255, 0, 0]);
        p.rect(-20, -30, 40 * (this.health / this.maxHealth), 6);

        p.rotate(this.facingAngle);

        // Body
        p.stroke(0);
        p.strokeWeight(2);
        p.fill(this.isPlayer ? [50, 150, 255] : [255, 100, 100]);
        p.circle(0, 0, this.radius * 2);

        // Weapon/Hands
        p.fill(this.isPlayer ? [20, 100, 200] : [200, 50, 50]);
        p.rect(10, -5, 15, 10); // Gun barrel

        p.pop();
    }
}

export class Player extends Brawler {
    constructor(x, y) {
        super(x, y, true);
        this.gems = 0;
    }

    update(p) {
        // Input Handling
        let dx = 0;
        let dy = 0;

        // Automated Input Injection or Human Input
        let input = { left: false, right: false, up: false, down: false, shoot: false, super: false, dash: false };
        
        if (gameState.controlMode === "HUMAN") {
            if (isKeyDown(37)) input.left = true;
            if (isKeyDown(39)) input.right = true;
            if (isKeyDown(38)) input.up = true;
            if (isKeyDown(40)) input.down = true;
            if (isKeyPressed(32)) input.shoot = true;
            if (isKeyPressed(90)) input.super = true; // Z
            if (isKeyPressed(16)) input.dash = true; // Shift
        } else {
            // Automated Testing Interface
            const action = window.get_automated_testing_action(gameState);
            if (action) {
                if (action.keyCode === 37) input.left = true;
                if (action.keyCode === 39) input.right = true;
                if (action.keyCode === 38) input.up = true;
                if (action.keyCode === 40) input.down = true;
                if (action.keyCode === 32) input.shoot = true;
                if (action.keyCode === 90) input.super = true;
            }
        }

        if (input.left) dx = -1;
        if (input.right) dx = 1;
        if (input.up) dy = -1;
        if (input.down) dy = 1;

        // Normalize
        if (dx !== 0 || dy !== 0) {
            let len = Math.sqrt(dx*dx + dy*dy);
            dx /= len;
            dy /= len;
            this.facingAngle = Math.atan2(dy, dx);
        }

        // Dash logic
        let currentSpeed = this.speed;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (input.dash && this.dashCooldown === 0) {
            currentSpeed *= 4; // Burst speed
            this.dashCooldown = 60; // 1 second cooldown
            // Dash particle
            gameState.particles.push(new ParticleSystem(this.x, this.y, [200, 255, 255], 3));
        }

        this.x += dx * currentSpeed;
        this.y += dy * currentSpeed;

        // Shooting
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (input.shoot && this.attackCooldown === 0) {
            this.shoot();
            this.attackCooldown = 20; // Fire rate
        }

        // Super
        if (input.super && this.superCharge >= CONSTANTS.MAX_SUPER_CHARGE) {
            this.activateSuper(p);
        }

        // Log Player Info
        if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                screen_x: this.x,
                screen_y: this.y,
                game_x: this.x,
                game_y: this.y,
                health: this.health,
                gems: this.gems,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    shoot() {
        let vx = Math.cos(this.facingAngle) * CONSTANTS.PROJECTILE_SPEED;
        let vy = Math.sin(this.facingAngle) * CONSTANTS.PROJECTILE_SPEED;
        gameState.projectiles.push(new Projectile(this.x, this.y, vx, vy, 'player'));
    }

    activateSuper(p) {
        // Super: Shoot 8 projectiles in a circle
        for (let i = 0; i < 8; i++) {
            let angle = i * (Math.PI * 2 / 8);
            let vx = Math.cos(angle) * CONSTANTS.PROJECTILE_SPEED;
            let vy = Math.sin(angle) * CONSTANTS.PROJECTILE_SPEED;
            let proj = new Projectile(this.x, this.y, vx, vy, 'player');
            proj.r = 8; // Bigger projectiles
            proj.damage = 40;
            gameState.projectiles.push(proj);
        }
        this.superCharge = 0;
        gameState.particles.push(new ParticleSystem(this.x, this.y, [255, 255, 0], 30));
    }

    addSuperCharge() {
        this.superCharge = Math.min(this.superCharge + CONSTANTS.SUPER_CHARGE_PER_HIT, CONSTANTS.MAX_SUPER_CHARGE);
    }

    collectGem(p) {
        this.gems++;
        gameState.gemsCollected = this.gems;
        gameState.particles.push(new ParticleSystem(this.x, this.y, [255, 0, 255], 10));
        
        // Win Condition Logic
        if (this.gems >= gameState.winningGemCount && !gameState.isCountdownActive) {
            gameState.isCountdownActive = true;
            gameState.countdownTimer = gameState.countdownDuration;
        }
    }
}

export class Enemy extends Brawler {
    constructor(x, y) {
        super(x, y, false);
        this.target = null;
        this.state = "CHASE"; // CHASE, ATTACK, FLEE
    }

    update(p) {
        if (!gameState.player || gameState.player.isDead) return;

        let distToPlayer = Math.hypot(gameState.player.x - this.x, gameState.player.y - this.y);

        // Simple AI
        let dx = gameState.player.x - this.x;
        let dy = gameState.player.y - this.y;
        let angle = Math.atan2(dy, dx);
        this.facingAngle = angle;

        if (distToPlayer < 150) {
            // Attack Range
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.attackCooldown === 0) {
                // Shoot at player
                let vx = Math.cos(angle) * CONSTANTS.PROJECTILE_SPEED;
                let vy = Math.sin(angle) * CONSTANTS.PROJECTILE_SPEED;
                gameState.projectiles.push(new Projectile(this.x, this.y, vx, vy, 'enemy'));
                this.attackCooldown = 60; // Slower than player
            }
        }

        if (distToPlayer > 100) {
            // Chase
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        } else if (distToPlayer < 50) {
            // Back away slightly
            this.x -= Math.cos(angle) * this.speed;
            this.y -= Math.sin(angle) * this.speed;
        }
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx, vy, source) {
        super(x, y, 5);
        this.vx = vx;
        this.vy = vy;
        this.source = source; // 'player' or 'enemy'
        this.damage = source === 'player' ? CONSTANTS.PLAYER_DAMAGE : CONSTANTS.ENEMY_DAMAGE;
        this.r = 4;
        this.life = 100; // frames
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) {
            // Remove self safely via filter in main loop or splice here if iterating backwards
            // We handle removal in game loop/physics
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(this.source === 'player' ? [0, 255, 255] : [255, 100, 0]);
        p.noStroke();
        p.circle(0, 0, this.r * 2);
        p.pop();
    }
}

export class Gem extends Entity {
    constructor(x, y) {
        super(x, y, 8);
        this.bobOffset = 0;
        this.r = 8;
    }

    render(p) {
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 3;
        p.push();
        p.translate(this.x, this.y + this.bobOffset);
        p.fill(200, 0, 255);
        p.stroke(255);
        p.strokeWeight(1);
        p.beginShape();
        // Simple hexagon gem shape
        for (let i = 0; i < 6; i++) {
            let angle = i * Math.PI / 3;
            p.vertex(Math.cos(angle) * this.r, Math.sin(angle) * this.r);
        }
        p.endShape(p.CLOSE);
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
        p.push();
        p.fill(100, 80, 60); // Wood/Crate color
        p.stroke(60, 40, 30);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.w, this.h);
        // Draw an X to look like a crate
        p.line(this.x, this.y, this.x + this.w, this.y + this.h);
        p.line(this.x + this.w, this.y, this.x, this.y + this.h);
        p.pop();
    }
}