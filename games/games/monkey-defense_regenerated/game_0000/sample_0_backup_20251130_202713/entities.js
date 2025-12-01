import { gameState, BLOON_TYPES, TOWER_TYPES, LEVEL_PATH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getEnemyInRange } from './physics.js';
import { createParticleExplosion } from './particles.js';

export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }
}

export class Bloon extends Entity {
    constructor(typeKey, pathIndex = 0, distanceOffset = 0) {
        // Find spawn pos based on path
        const start = LEVEL_PATH[0];
        super(start.x, start.y);
        
        this.typeKey = typeKey;
        this.applyTypeStats();
        
        // Path following
        this.pathIndex = pathIndex;
        this.distanceTraveled = distanceOffset;
        
        // If spawned from parent, place correctly
        if (pathIndex > 0 || distanceOffset > 0) {
            this.updatePositionAlongPath();
        }
        
        gameState.enemies.push(this);
    }
    
    applyTypeStats() {
        const stats = BLOON_TYPES[this.typeKey];
        this.health = stats.health;
        this.speed = stats.speed;
        this.color = stats.color;
        this.radius = stats.radius;
        this.value = stats.value;
        this.childType = stats.child;
    }
    
    update() {
        if (!this.active) return;
        
        // Move along path
        const currentTarget = LEVEL_PATH[this.pathIndex + 1];
        if (!currentTarget) {
            this.reachEnd();
            return;
        }
        
        const dx = currentTarget.x - this.x;
        const dy = currentTarget.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= this.speed) {
            // Reached node
            this.x = currentTarget.x;
            this.y = currentTarget.y;
            this.distanceTraveled += dist;
            this.pathIndex++;
            if (this.pathIndex >= LEVEL_PATH.length - 1) {
                this.reachEnd();
            }
        } else {
            // Move towards node
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.distanceTraveled += this.speed;
        }
    }
    
    updatePositionAlongPath() {
        // Complex logic to place bloon exactly at distanceTraveled
        // Simplified for children: just spawn at parent x,y
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.pop();
        }
    }
    
    pop() {
        this.active = false;
        gameState.money += this.value;
        gameState.score += this.value * 10;
        
        createParticleExplosion(this.x, this.y, this.color);
        
        // Spawn children
        if (this.childType) {
            // Usually 1 layer pop spawns 1 child of lower tier in Bloons (except special ones)
            // But lets spawn 1 child to keep it simple, or multiple for gameplay ramp
            const child = new Bloon(this.childType, this.pathIndex, this.distanceTraveled);
            child.x = this.x;
            child.y = this.y;
        }
        
        this.remove();
    }
    
    reachEnd() {
        this.active = false;
        gameState.lives -= Math.max(1, this.health); // Lose lives based on remaining layers roughly
        if (gameState.lives <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
        this.remove();
    }
    
    remove() {
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
    }
    
    render(p) {
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(1);
        p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2.2); // Oval shape for balloon
        
        // Shine
        p.noStroke();
        p.fill(255, 255, 255, 100);
        p.ellipse(this.x - this.radius/3, this.y - this.radius/3, this.radius/2, this.radius/1.5);
    }
}

export class Tower extends Entity {
    constructor(x, y, typeKey) {
        super(x, y);
        this.typeKey = typeKey;
        this.applyStats();
        this.cooldownTimer = 0;
        this.angle = 0;
        this.radius = 15; // Physical size
        this.level = 1;
        
        gameState.towers.push(this);
    }
    
    applyStats() {
        const stats = TOWER_TYPES[this.typeKey];
        this.range = stats.range;
        this.maxCooldown = stats.cooldown;
        this.damage = stats.damage;
        this.projSpeed = stats.projectileSpeed;
        this.projType = stats.projectileType;
        this.color = stats.color;
    }
    
    upgrade() {
        const stats = TOWER_TYPES[this.typeKey];
        if (gameState.money >= stats.upgradeCost) {
            gameState.money -= stats.upgradeCost;
            this.level++;
            // Buffs
            this.range *= 1.1;
            this.maxCooldown *= 0.85;
            this.damage += 0.5; // fractional damage accumulated? or just stronger
            return true;
        }
        return false;
    }
    
    update() {
        if (this.cooldownTimer > 0) this.cooldownTimer--;
        
        const target = getEnemyInRange(this);
        if (target) {
            // Aim
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            this.angle = Math.atan2(dy, dx);
            
            if (this.cooldownTimer <= 0) {
                this.shoot(target);
                this.cooldownTimer = this.maxCooldown;
            }
        }
    }
    
    shoot(target) {
        if (this.projType === "TACK_8") {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                new Projectile(this.x, this.y, Math.cos(angle), Math.sin(angle), this.projSpeed, this.damage);
            }
        } else if (this.projType === "INSTANT") {
            // Sniper logic: Instant hit
            // Draw a line effect (particle)
            // Damage immediately
            target.takeDamage(this.damage);
            createParticleExplosion(target.x, target.y, [255, 255, 200]); // Hit spark
            // Visual tracer
            gameState.particles.push(new Tracer(this.x, this.y, target.x, target.y));
        } else {
            // Standard projectile
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            new Projectile(this.x, this.y, dx/dist, dy/dist, this.projSpeed, this.damage);
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Base
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(1); // Reset stroke weight
        p.circle(0, 0, this.radius * 2);
        
        // Rank indicator
        if (this.level > 1) {
            p.fill(255, 215, 0); // Gold
            p.noStroke();
            p.circle(10, -10, 5 + this.level);
        }

        // Turret / Rotation
        p.rotate(this.angle);
        p.fill(p.red(this.color) - 40, p.green(this.color) - 40, p.blue(this.color) - 40);
        p.rectMode(p.CENTER);
        
        if (this.typeKey === "TACK") {
             p.circle(0, 0, this.radius * 1.5);
             // 4 little barrels
             for(let i=0; i<4; i++) {
                 p.rotate(p.PI/2);
                 p.rect(10, 0, 8, 6);
             }
        } else if (this.typeKey === "SNIPER") {
            p.rect(15, 0, 30, 6); // Long barrel
            p.rect(0, 0, 15, 15); // Body
        } else {
            // Dart Monkey
            p.rect(10, 0, 20, 10); // Arm/Gun
        }
        
        p.pop();
        
        // Selection highlight
        if (gameState.selectedTower === this) {
            p.noFill();
            p.stroke(255, 255, 0, 150);
            p.strokeWeight(2);
            p.circle(this.x, this.y, this.radius * 2 + 10);
            
            // Draw Range
            p.fill(255, 255, 255, 30);
            p.stroke(255, 255, 255, 100);
            p.strokeWeight(1);
            p.circle(this.x, this.y, this.range * 2);
        }
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx, vy, speed, damage) {
        super(x, y);
        this.vx = vx * speed;
        this.vy = vy * speed;
        this.radius = 4;
        this.damage = damage;
        this.lifetime = 100;
        
        gameState.projectiles.push(this);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        
        if (this.lifetime <= 0 || 
            this.x < 0 || this.x > CANVAS_WIDTH || 
            this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.destroy();
        }
    }
    
    destroy() {
        const idx = gameState.projectiles.indexOf(this);
        if (idx > -1) gameState.projectiles.splice(idx, 1);
    }
    
    render(p) {
        p.fill(0);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
    }
}

class Tracer {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.alpha = 255;
    }
    
    update() {
        this.alpha -= 15;
    }
    
    isDead() {
        return this.alpha <= 0;
    }
    
    render(p) {
        p.stroke(255, 255, 0, this.alpha);
        p.strokeWeight(2);
        p.line(this.x1, this.y1, this.x2, this.y2);
    }
}