import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MOVE_SPEED, JUMP_FORCE, FRICTION } from './globals.js';
import { checkAABB } from './physics.js';
import { createExplosion, createSparkle } from './particles.js';

class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }
    
    update(p) {}
    render(p, camX, camY) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 40, 'player');
        this.speed = MOVE_SPEED;
        this.jumpForce = JUMP_FORCE;
        this.onGround = false;
        this.facingRight = true;
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerableTimer = 0;
        this.ammo = 5;
        this.score = 0;
        
        // Animation
        this.animTimer = 0;
    }
    
    update(p) {
        // Input handling is done in game.js to update vx
        
        // Friction
        if (this.onGround) {
            this.vx *= FRICTION;
        } else {
            this.vx *= 0.95; // Air resistance
        }
        
        // Facing direction
        if (this.vx > 0.1) this.facingRight = true;
        if (this.vx < -0.1) this.facingRight = false;
        
        // Invulnerability
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        
        // Animation update
        this.animTimer++;
    }
    
    jump() {
        if (this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            return true;
        }
        return false;
    }
    
    shoot() {
        if (this.ammo > 0) {
            this.ammo--;
            const dir = this.facingRight ? 1 : -1;
            const px = this.x + this.width/2 + (dir * 20);
            const py = this.y + 15;
            gameState.entities.push(new Projectile(px, py, dir));
            return true;
        }
        return false;
    }
    
    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return;
        
        this.health -= amount;
        this.invulnerableTimer = 60; // 1 second invulnerability
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        createExplosion(this.x, this.y, 20, [0, 255, 0]);
    }
    
    render(p, camX, camY) {
        // Flicker if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) return;
        
        let screenX = this.x - camX;
        let screenY = this.y - camY;
        
        p.push();
        p.translate(screenX + this.width/2, screenY + this.height/2);
        if (!this.facingRight) p.scale(-1, 1);
        
        // Body (Green Suit)
        p.noStroke();
        p.fill(0, 150, 0); // Green
        p.rect(-10, -10, 20, 30, 5);
        
        // Head
        p.fill(255, 200, 180); // Skin
        p.circle(0, -15, 25);
        
        // Beard (Orange)
        p.fill(255, 100, 0);
        p.arc(0, -15, 26, 26, 0, p.PI);
        
        // Hat (Green Top Hat)
        p.fill(0, 180, 0);
        p.rect(-15, -35, 30, 20); // Top
        p.rect(-20, -15, 40, 5); // Brim
        p.fill(0); // Band
        p.rect(-15, -20, 30, 5);
        p.fill(255, 215, 0); // Buckle
        p.rect(-5, -20, 10, 5);
        
        // Legs (animation)
        p.fill(0, 100, 0); // Dark Green
        if (Math.abs(this.vx) > 0.5) {
            let legOffset = Math.sin(this.animTimer * 0.4) * 5;
            p.rect(-8, 15, 6, 10 + legOffset);
            p.rect(2, 15, 6, 10 - legOffset);
        } else {
            p.rect(-8, 15, 6, 10);
            p.rect(2, 15, 6, 10);
        }
        
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        // Types: 'snail', 'bee'
        let w = type === 'snail' ? 30 : 25;
        let h = type === 'snail' ? 20 : 25;
        super(x, y, w, h, 'enemy');
        this.enemyType = type;
        this.direction = -1;
        this.speed = type === 'snail' ? 1.5 : 2.5;
        this.patrolCenter = x;
        this.patrolRadius = 100;
        this.animOffset = Math.random() * 100;
    }
    
    update(p) {
        if (this.enemyType === 'snail') {
            // Patrol logic
            this.vx = this.direction * this.speed;
            this.x += this.vx;
            
            // Turn around at patrol limits or if blocked (simple implementation)
            if (this.x < this.patrolCenter - this.patrolRadius) this.direction = 1;
            if (this.x > this.patrolCenter + this.patrolRadius) this.direction = -1;
            
            // Apply gravity
            this.vy += 0.5;
            // Simple ground collision for enemies (assume flat ground or simple platforms)
            // In a real engine, they'd use the same physics, but here we keep it simple or rely on map checking if passed.
            // For this implementation, we will manually collide with level blocks in game.js loop or give them simple floor logic
        } else if (this.enemyType === 'bee') {
            // Bob up and down and move towards player slightly if close
            this.x += this.direction * this.speed;
             if (this.x < this.patrolCenter - this.patrolRadius) this.direction = 1;
            if (this.x > this.patrolCenter + this.patrolRadius) this.direction = -1;
            
            this.y += Math.sin((p.frameCount + this.animOffset) * 0.1) * 1.5;
        }
    }
    
    die() {
        this.markedForDeletion = true;
        createExplosion(this.x + this.width/2, this.y + this.height/2, 10, [150, 50, 50]);
        gameState.score += 50;
    }
    
    render(p, camX, camY) {
        let screenX = this.x - camX;
        let screenY = this.y - camY;
        
        p.push();
        p.translate(screenX + this.width/2, screenY + this.height/2);
        
        if (this.enemyType === 'snail') {
            // Shell
            p.fill(150, 0, 150);
            p.arc(0, 0, 25, 25, p.PI, 0);
            // Body
            p.fill(200, 200, 200);
            p.ellipse(5 * this.direction, 5, 30, 10);
            // Eyes
            p.fill(255);
            p.circle(10 * this.direction, -5, 5);
            p.fill(0);
            p.circle(12 * this.direction, -5, 2);
        } else if (this.enemyType === 'bee') {
            if (this.direction > 0) p.scale(-1, 1);
            // Body
            p.fill(255, 200, 0);
            p.ellipse(0, 0, 25, 20);
            // Stripes
            p.fill(0);
            p.rect(-5, -8, 4, 16);
            p.rect(5, -8, 4, 16);
            // Wings
            p.fill(255, 255, 255, 150);
            let wingFlap = Math.sin(p.frameCount * 0.5) * 10;
            p.ellipse(-5, -15 + wingFlap/2, 15, 10);
            p.ellipse(5, -15 + wingFlap/2, 15, 10);
        }
        
        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y, dir) {
        super(x, y, 10, 10, 'projectile');
        this.vx = dir * 8;
        this.vy = -2; // Slight arc
        this.lifeTime = 120;
    }
    
    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.25; // Gravity
        
        this.lifeTime--;
        if (this.lifeTime <= 0) this.markedForDeletion = true;
    }
    
    render(p, camX, camY) {
        let screenX = this.x - camX;
        let screenY = this.y - camY;
        
        p.push();
        p.translate(screenX, screenY);
        p.rotate(p.frameCount * 0.2);
        p.fill(101, 67, 33); // Brown (Pinecone)
        p.ellipse(0, 0, 10, 12);
        p.pop();
    }
}

export class Collectible extends Entity {
    constructor(x, y, subType) {
        super(x, y, 20, 20, 'collectible');
        this.subType = subType; // 'gold', 'clover', 'ammo'
        this.baseY = y;
    }
    
    update(p) {
        // Bobbing animation
        this.y = this.baseY + Math.sin(p.frameCount * 0.1) * 3;
    }
    
    collect() {
        this.markedForDeletion = true;
        if (this.subType === 'gold') {
            gameState.score += 10;
            createSparkle(this.x + 10, this.y + 10, [255, 215, 0]);
        } else if (this.subType === 'clover') {
            gameState.player.heal(1);
            createSparkle(this.x + 10, this.y + 10, [0, 255, 0]);
        }
    }
    
    render(p, camX, camY) {
        let screenX = this.x - camX;
        let screenY = this.y - camY;
        
        p.push();
        p.translate(screenX + 10, screenY + 10);
        
        if (this.subType === 'gold') {
            p.fill(255, 215, 0);
            p.stroke(200, 180, 0);
            p.strokeWeight(2);
            p.circle(0, 0, 16);
            p.fill(255, 255, 200);
            p.noStroke();
            p.circle(-3, -3, 5); // Shine
        } else if (this.subType === 'clover') {
            p.fill(0, 200, 0);
            p.noStroke();
            // Simple clover shape (3 circles)
            p.circle(0, -5, 8);
            p.circle(-5, 3, 8);
            p.circle(5, 3, 8);
            p.stroke(0, 150, 0);
            p.strokeWeight(2);
            p.line(0, 0, 0, 10);
        }
        
        p.pop();
    }
}

export class Block extends Entity {
    constructor(x, y, w, h, type = 'grass') {
        super(x, y, w, h, 'block');
        this.blockType = type; // 'grass', 'brick', 'lucky'
    }
    
    render(p, camX, camY) {
        let screenX = this.x - camX;
        let screenY = this.y - camY;
        
        // Simple culling
        if (screenX + this.width < 0 || screenX > CANVAS_WIDTH) return;
        
        p.push();
        p.noStroke();
        if (this.blockType === 'grass') {
            p.fill(139, 69, 19); // Dirt
            p.rect(screenX, screenY, this.width, this.height);
            p.fill(34, 139, 34); // Grass top
            p.rect(screenX, screenY, this.width, 10);
        } else if (this.blockType === 'brick') {
            p.fill(160, 82, 45);
            p.rect(screenX, screenY, this.width, this.height);
            p.stroke(100, 50, 30);
            p.strokeWeight(2);
            p.rect(screenX, screenY, this.width, this.height);
            p.line(screenX, screenY + this.height/2, screenX + this.width, screenY + this.height/2);
            p.line(screenX + this.width/2, screenY, screenX + this.width/2, screenY + this.height);
        } else if (this.blockType === 'lucky') {
            p.fill(255, 215, 0);
            p.rect(screenX, screenY, this.width, this.height);
            p.fill(0);
            p.textSize(20);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("?", screenX + this.width/2, screenY + this.height/2);
        }
        p.pop();
    }
}