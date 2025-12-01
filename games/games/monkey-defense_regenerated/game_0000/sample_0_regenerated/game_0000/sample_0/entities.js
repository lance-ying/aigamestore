import { gameState, BLOON_TYPES, PATH_POINTS, TOWER_TYPES } from './globals.js';
import { checkCircleCollision } from './physics.js';

/* --- PARTICLES --- */
export class Particle {
    constructor(x, y, color, speed = 2) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.05;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.noStroke();
        p.fill(p.color(this.color));
        // Add transparency
        const c = p.color(this.color);
        c.setAlpha(this.life * 255);
        p.fill(c);
        p.circle(this.x, this.y, 4);
        p.pop();
    }
}

export function createExplosion(x, y, color, count = 5) {
    for(let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

/* --- BLOONS --- */
export class Bloon {
    constructor(typeKey) {
        this.typeKey = typeKey;
        this.setProps(BLOON_TYPES[typeKey]);
        
        // Path following logic
        this.pathIndex = 0;
        this.x = PATH_POINTS[0].x;
        this.y = PATH_POINTS[0].y;
        this.distanceTraveled = 0;
        this.frozen = 0; // Freeze status
    }

    setProps(typeData) {
        this.radius = typeData.radius;
        this.speed = typeData.speed;
        this.health = typeData.health;
        this.color = typeData.color;
        this.value = typeData.value;
        this.childType = typeData.child;
    }

    update(p) {
        if (this.pathIndex >= PATH_POINTS.length - 1) return;

        const target = PATH_POINTS[this.pathIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < this.speed) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
            this.distanceTraveled += dist;
        } else {
            const moveX = (dx / dist) * this.speed;
            const moveY = (dy / dist) * this.speed;
            this.x += moveX;
            this.y += moveY;
            this.distanceTraveled += this.speed;
        }
    }

    takeDamage(amount) {
        // Only 1 damage logic for simple bloons usually, but supports multi-layer pop
        // Pop effect
        createExplosion(this.x, this.y, this.color);
        
        // Logic: if child exists, degrade to child.
        // For simplicity: One hit pops the layer.
        // If amount > 1 (Sniper), we might skip layers, but let's keep it simple:
        // 1 hit = 1 layer down.
        
        gameState.money += 1;
        gameState.score += 10;
        
        if (this.childType) {
            // Downgrade
            this.typeKey = this.childType;
            this.setProps(BLOON_TYPES[this.childType]);
            // Keep position
        } else {
            // Completely popped
            this.dead = true;
        }
    }

    render(p) {
        p.push();
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(1);
        p.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 1.8);
        // String
        p.noFill();
        p.stroke(200);
        p.line(this.x, this.y + this.radius * 0.9, this.x, this.y + this.radius * 2.5);
        p.pop();
    }
}

/* --- PROJECTILES --- */
export class Projectile {
    constructor(x, y, target, damage, speed, type) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.target = target; // Can be null if untargeted
        this.type = type; // 'DART', 'TACK', 'SNIPER_TRAIL'
        
        // Calculate velocity once if DART/TACK
        if (target && type === 'DART') {
            const dx = target.x - x;
            const dy = target.y - y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            this.vx = (dx/dist) * speed;
            this.vy = (dy/dist) * speed;
        } else if (type === 'TACK') {
             // target is actually angle vector {x, y} here
             this.vx = target.x * speed;
             this.vy = target.y * speed;
        }
        
        this.life = 60; // Frames to live
        this.dead = false;
    }

    update() {
        if (this.type === 'SNIPER_TRAIL') {
            this.life -= 5; // Fades fast
            if (this.life <= 0) this.dead = true;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        if (this.life <= 0 || 
            this.x < 0 || this.x > 600 || 
            this.y < 0 || this.y > 400) {
            this.dead = true;
        }
    }

    render(p) {
        if (this.dead) return;

        p.push();
        if (this.type === 'SNIPER_TRAIL') {
            p.stroke(255, 255, 0, this.life * 4); // Fade out
            p.strokeWeight(2);
            p.line(this.x, this.y, this.target.x, this.target.y);
        } else {
            p.fill(0);
            p.noStroke();
            p.circle(this.x, this.y, 4);
        }
        p.pop();
    }
}

/* --- TOWERS --- */
export class Tower {
    constructor(x, y, typeId) {
        this.x = x;
        this.y = y;
        this.typeId = typeId;
        this.upgradeLevel = 0;
        
        // Load props from definition
        const def = TOWER_TYPES.find(t => t.id === typeId);
        this.range = def.range;
        this.damage = def.damage;
        this.fireRate = def.fireRate;
        this.color = def.color;
        this.name = def.name;
        this.upgradeCost = def.upgradeCost;
        
        this.cooldown = 0;
        this.angle = 0;
    }

    upgrade() {
        this.upgradeLevel++;
        this.range *= 1.2;
        this.damage += 1;
        this.fireRate = Math.max(5, this.fireRate * 0.85);
        createExplosion(this.x, this.y, [255, 215, 0], 20); // Gold particles
    }

    update(p) {
        if (this.cooldown > 0) this.cooldown--;
        
        // Find target
        if (this.cooldown <= 0) {
            const target = this.findTarget();
            if (target) {
                this.shoot(target);
                this.cooldown = this.fireRate;
            }
        }
        
        // Visual rotation towards first bloon in range
        const lookTarget = this.findTarget();
        if (lookTarget) {
            const dx = lookTarget.x - this.x;
            const dy = lookTarget.y - this.y;
            this.angle = Math.atan2(dy, dx);
        }
    }

    findTarget() {
        // Strategy: First (furthest along path)
        let bestBloon = null;
        let maxDist = -1;

        for (const bloon of gameState.bloons) {
            const dist = Math.sqrt(Math.pow(this.x - bloon.x, 2) + Math.pow(this.y - bloon.y, 2));
            if (dist <= this.range) {
                if (bloon.distanceTraveled > maxDist) {
                    maxDist = bloon.distanceTraveled;
                    bestBloon = bloon;
                }
            }
        }
        return bestBloon;
    }

    shoot(target) {
        if (this.typeId === 'DART') {
            gameState.projectiles.push(new Projectile(this.x, this.y, target, this.damage, 8, 'DART'));
        } else if (this.typeId === 'TACK') {
            // Shoot 8 directions
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const dir = { x: Math.cos(angle), y: Math.sin(angle) };
                gameState.projectiles.push(new Projectile(this.x, this.y, dir, this.damage, 6, 'TACK'));
            }
        } else if (this.typeId === 'SNIPER') {
            // Instant hit
            target.takeDamage(this.damage);
            // Visual trail
            gameState.projectiles.push(new Projectile(this.x, this.y, {x: target.x, y: target.y}, 0, 0, 'SNIPER_TRAIL'));
        }
    }

    render(p, isSelected) {
        p.push();
        p.translate(this.x, this.y);
        
        // Draw Range if selected or hovered
        if (isSelected) {
            p.noFill();
            p.stroke(255, 255, 255, 100);
            p.strokeWeight(1);
            p.circle(0, 0, this.range * 2);
        }

        p.rotate(this.angle);

        // Base
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(2);
        p.circle(0, 0, 24);

        // Decoration based on type
        if (this.typeId === 'DART') {
            p.fill(200, 150, 100);
            p.rectMode(p.CENTER);
            p.rect(10, 0, 10, 5); // Arm
        } else if (this.typeId === 'TACK') {
            p.fill(100);
            p.circle(0, 0, 10);
            // Spikes
            for(let i=0; i<8; i++) {
                p.rotate(Math.PI/4);
                p.rect(12, 0, 4, 4);
            }
        } else if (this.typeId === 'SNIPER') {
            p.fill(50, 100, 50);
            p.rectMode(p.CENTER);
            p.rect(10, 0, 20, 4); // Gun barrel
            p.fill(0, 255, 0); // Hat
            p.circle(0, 0, 12);
        }
        
        // Level indicator
        if (this.upgradeLevel > 0) {
            p.fill(255, 215, 0);
            p.noStroke();
            p.circle(0, 0, 6 + this.upgradeLevel);
        }

        p.pop();
    }
}