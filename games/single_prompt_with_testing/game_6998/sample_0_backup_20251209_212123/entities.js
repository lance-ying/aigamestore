/**
 * entities.js
 * Contains all game entity classes.
 */
import { gameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRAVITY, FRICTION } from './globals.js';
import { resolvePlatformCollisions, applyPhysics, checkAABB } from './physics.js';
import { createExplosion } from './particles.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }
    
    update() {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.speed = 0.5;
        this.maxSpeed = 6;
        this.jumpForce = -13;
        this.onGround = false;
        this.facingRight = true;
        this.health = 3;
        this.invincibleTimer = 0;
        this.energy = 100; // For abilities
        this.score = 0;
        
        // Animation
        this.squashX = 1;
        this.squashY = 1;
    }

    update(p) {
        const acc = this.onGround ? this.speed : this.speed * 0.6; // Less control in air

        // Input Handling (controlled via gameState.keys which is populated by Input or Bot)
        if (gameState.keys[37]) { // Left
            this.vx -= acc;
            this.facingRight = false;
        }
        if (gameState.keys[39]) { // Right
            this.vx += acc;
            this.facingRight = true;
        }
        
        // Sprint
        const currentMax = gameState.keys[16] ? this.maxSpeed * 1.5 : this.maxSpeed;
        this.vx = Math.max(Math.min(this.vx, currentMax), -currentMax);

        // Jump
        if (gameState.keys[32] && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.squashX = 0.8;
            this.squashY = 1.2;
            createExplosion(this.x + this.width/2, this.y + this.height, 5, 'DUST');
        }

        // Ability: Ice Blast (Z key)
        if (gameState.keys[90]) {
            // Simple debounce using frame count or a specific timer could be added
            // For now, we rely on key press event in game.js to trigger the shoot function
            // This check here handles continuous actions if needed, but firing is usually discrete.
        }

        // Apply Physics
        applyPhysics(this, GRAVITY, FRICTION);
        
        // Collision Resolution
        resolvePlatformCollisions(this, gameState.platforms);
        
        // World Bounds (Fall Death)
        if (this.y > CANVAS_HEIGHT + 200) {
            this.takeDamage(3); // Instant death
        }

        // Animation Recovery
        this.squashX += (1 - this.squashX) * 0.1;
        this.squashY += (1 - this.squashY) * 0.1;
        
        // Invincibility
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        
        // Energy Regen
        if (this.energy < 100) this.energy += 0.2;
    }
    
    shoot() {
        if (this.energy >= 20) {
            this.energy -= 20;
            const px = this.facingRight ? this.x + this.width + 5 : this.x - 15;
            const py = this.y + this.height/2 - 5;
            const vel = this.facingRight ? 10 : -10;
            gameState.projectiles.push(new Projectile(px, py, vel, 0));
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;
        
        this.health -= amount;
        this.invincibleTimer = 60; // 1 second invincibility
        this.vy = -5; // Knockback hop
        this.vx = -this.vx;
        
        createExplosion(this.x + this.width/2, this.y + this.height/2, 10, 'SPARKLE');
        
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    render(p) {
        if (this.invincibleTimer > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) return; // Blink

        p.push();
        p.translate(this.x + this.width/2, this.y + this.height);
        p.scale(this.squashX, this.squashY);
        
        // Cat Body
        p.fill(COLORS.player);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(-this.width/2, -this.height, this.width, this.height, 5);
        
        // Ears
        p.fill(COLORS.player);
        p.triangle(-this.width/2 + 2, -this.height, -this.width/2 - 2, -this.height - 10, -this.width/2 + 10, -this.height);
        p.triangle(this.width/2 - 2, -this.height, this.width/2 + 2, -this.height - 10, this.width/2 - 10, -this.height);
        
        // Face
        p.fill(255);
        // Eyes
        const eyeOffset = this.facingRight ? 4 : -4;
        p.ellipse(-6 + eyeOffset, -this.height + 12, 8, 8);
        p.ellipse(6 + eyeOffset, -this.height + 12, 8, 8);
        p.fill(0);
        p.ellipse(-6 + eyeOffset, -this.height + 12, 3, 3);
        p.ellipse(6 + eyeOffset, -this.height + 12, 3, 3);
        
        p.pop();
    }
}

export class Platform extends Entity {
    constructor(x, y, w, h, type = 'NORMAL') {
        super(x, y, w, h);
        this.type = type; // NORMAL, BOUNCE, BREAKABLE
    }

    render(p) {
        p.strokeWeight(2);
        if (this.type === 'NORMAL') {
            p.fill(COLORS.ground);
            p.stroke(COLORS.groundTop);
            p.rect(this.x, this.y, this.width, this.height);
            // Top highlight
            p.stroke(100, 200, 255);
            p.line(this.x, this.y, this.x + this.width, this.y);
        } else if (this.type === 'BOUNCE') {
            p.fill(200, 50, 200);
            p.stroke(255, 100, 255);
            p.rect(this.x, this.y, this.width, this.height);
            // Bounce lines
            p.stroke(255);
            p.line(this.x, this.y + 5, this.x + this.width, this.y + 5);
        }
    }
}

export class Enemy extends Entity {
    constructor(x, y, type = 'PATROL') {
        super(x, y, 30, 30);
        this.type = type;
        this.speed = 2;
        this.patrolStart = x - 100;
        this.patrolEnd = x + 100;
        this.frozen = false;
        this.frozenTimer = 0;
        this.vx = this.speed;
    }

    update() {
        if (this.frozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
            }
            return;
        }

        // Patrol Logic
        this.x += this.vx;
        if (this.x > this.patrolEnd) {
            this.vx = -this.speed;
        } else if (this.x < this.patrolStart) {
            this.vx = this.speed;
        }

        // Interaction with Player
        const p = gameState.player;
        if (p && !p.invincibleTimer && checkAABB(this, p)) {
            // Goomba stomp check
            const hitFromAbove = p.vy > 0 && p.y + p.height < this.y + this.height / 2;
            
            if (hitFromAbove) {
                this.die();
                p.vy = -8; // Bounce player
                p.score += 50;
            } else {
                p.takeDamage(1);
            }
        }
    }
    
    freeze() {
        this.frozen = true;
        this.frozenTimer = 300; // 5 seconds
        createExplosion(this.x + this.width/2, this.y + this.height/2, 5, 'ICE');
    }

    die() {
        this.markedForDeletion = true;
        createExplosion(this.x + this.width/2, this.y + this.height/2, 15, 'EXPLOSION');
        gameState.score += 50;
    }

    render(p) {
        if (this.frozen) {
            p.fill(COLORS.enemyFrozen);
            p.stroke(255);
            p.rect(this.x, this.y, this.width, this.height);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.text("*", this.x + 15, this.y + 15);
        } else {
            p.fill(COLORS.enemy);
            p.stroke(200, 0, 0);
            
            // Spiky shape
            p.beginShape();
            p.vertex(this.x, this.y + this.height);
            p.vertex(this.x + this.width, this.y + this.height);
            p.vertex(this.x + this.width, this.y + 10);
            p.vertex(this.x + this.width/2, this.y); // Pointy top
            p.vertex(this.x, this.y + 10);
            p.endShape(p.CLOSE);
            
            // Angry eyes
            p.fill(255);
            p.ellipse(this.x + 10, this.y + 15, 8, 8);
            p.ellipse(this.x + 20, this.y + 15, 8, 8);
            p.fill(0);
            p.ellipse(this.x + 10 + (this.vx > 0 ? 2 : -2), this.y + 15, 3, 3);
            p.ellipse(this.x + 20 + (this.vx > 0 ? 2 : -2), this.y + 15, 3, 3);
        }
    }
}

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.bobOffset = 0;
    }

    update() {
        this.bobOffset = Math.sin(gameState.frameCount * 0.1) * 5;
        
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.player.score += 10;
            gameState.score += 10;
            this.markedForDeletion = true;
            createExplosion(this.x + 10, this.y + 10, 5, 'SPARKLE');
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + 10, this.y + 10 + this.bobOffset);
        p.rotate(gameState.frameCount * 0.05);
        p.fill(COLORS.collectible);
        p.stroke(255);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 14, 14);
        p.rectMode(p.CORNER);
        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 10, 10);
        this.vx = vx;
        this.vy = vy;
        this.life = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        if (this.life <= 0) this.markedForDeletion = true;
        
        // Trail
        if (gameState.frameCount % 3 === 0) {
            gameState.particles.push(new Particle(this.x, this.y, 'ICE'));
        }
        
        // Collision with enemies
        for (const enemy of gameState.enemies) {
            if (checkAABB(this, enemy)) {
                enemy.freeze();
                this.markedForDeletion = true;
                break;
            }
        }
        
        // Collision with walls (simple check)
        for (const plat of gameState.platforms) {
            if (checkAABB(this, plat)) {
                this.markedForDeletion = true;
                createExplosion(this.x, this.y, 5, 'ICE');
                break;
            }
        }
    }

    render(p) {
        p.fill(COLORS.projectile);
        p.noStroke();
        p.circle(this.x + 5, this.y + 5, 8);
    }
}

export class Portal extends Entity {
    constructor(x, y) {
        super(x, y, 60, 80);
    }
    
    update() {
        if (gameState.player && checkAABB(this, gameState.player)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    render(p) {
        p.fill(COLORS.portal);
        p.stroke(255);
        // Pulsing effect
        const pulse = Math.sin(gameState.frameCount * 0.1) * 5;
        p.ellipse(this.x + this.width/2, this.y + this.height/2, this.width + pulse, this.height + pulse);
        
        // Vortex swirl
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.rotate(gameState.frameCount * -0.05);
        p.noFill();
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(3);
        p.arc(0, 0, 40, 40, 0, p.PI);
        p.pop();
    }
}