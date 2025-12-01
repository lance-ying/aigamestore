import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { dist } from './utils.js';

export class Projectile {
    constructor(x, y, targetX, targetY, stats) {
        this.x = x;
        this.y = y;
        this.radius = stats.size || 4;
        this.damage = stats.damage;
        this.speed = stats.speed || 8;
        this.color = stats.color || [255, 255, 0];
        this.penetration = stats.penetration || 1;
        this.life = 120; // Failsafe
        
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.hitList = []; // Track entities hit to prevent multi-hit on same frame/entity
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    render(p) {
        p.push();
        p.fill(this.color);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        p.pop();
    }
}

export class Weapon {
    constructor(type, owner) {
        this.owner = owner;
        this.type = type;
        this.cooldownTimer = 0;
        
        // Define stats based on type
        switch(type) {
            case 'SMG':
                this.cooldown = 10;
                this.damage = 10;
                this.range = 250;
                this.color = [200, 200, 255];
                this.projSpeed = 12;
                this.projSize = 3;
                this.penetration = 1;
                this.barrelLen = 20;
                break;
            case 'SHOTGUN':
                this.cooldown = 50;
                this.damage = 8;
                this.range = 150;
                this.color = [255, 100, 100];
                this.projSpeed = 10;
                this.projSize = 4;
                this.penetration = 2;
                this.count = 4; // Pellets
                this.barrelLen = 15;
                break;
            case 'SNIPER':
                this.cooldown = 80;
                this.damage = 50;
                this.range = 500;
                this.color = [50, 255, 50];
                this.projSpeed = 20;
                this.projSize = 6;
                this.penetration = 5;
                this.barrelLen = 35;
                break;
            default: // PISTOL
                this.cooldown = 30;
                this.damage = 15;
                this.range = 300;
                this.color = [255, 255, 0];
                this.projSpeed = 10;
                this.projSize = 5;
                this.penetration = 1;
                this.barrelLen = 15;
        }
    }

    update() {
        if (this.cooldownTimer > 0) this.cooldownTimer--;

        // Find nearest target
        let nearest = null;
        let minDst = this.range;

        gameState.enemies.forEach(enemy => {
            const d = dist(this.owner.x, this.owner.y, enemy.x, enemy.y);
            if (d < minDst) {
                minDst = d;
                nearest = enemy;
            }
        });

        if (nearest && this.cooldownTimer <= 0) {
            this.fire(nearest);
        }
    }

    fire(target) {
        this.cooldownTimer = this.cooldown;
        
        const stats = {
            damage: this.damage * (this.owner.stats ? this.owner.stats.damageMult : 1),
            speed: this.projSpeed,
            size: this.projSize,
            color: this.color,
            penetration: this.penetration
        };

        if (this.type === 'SHOTGUN') {
            for(let i=0; i<this.count; i++) {
                // Spread
                const spreadX = target.x + (Math.random() - 0.5) * 60;
                const spreadY = target.y + (Math.random() - 0.5) * 60;
                gameState.projectiles.push(new Projectile(this.owner.x, this.owner.y, spreadX, spreadY, stats));
            }
        } else {
            gameState.projectiles.push(new Projectile(this.owner.x, this.owner.y, target.x, target.y, stats));
        }
    }

    render(p, index, total) {
        // Orbit logic
        const orbitRadius = 35;
        const angleStep = (Math.PI * 2) / total;
        const angle = gameState.frameCount * 0.02 + (index * angleStep);
        
        const wx = this.owner.x + Math.cos(angle) * orbitRadius;
        const wy = this.owner.y + Math.sin(angle) * orbitRadius;

        p.push();
        p.translate(wx, wy);
        
        // Point towards nearest enemy or mouse or just rotate
        // Simple visual: rotate outwards
        p.rotate(angle);
        
        p.fill(100);
        p.stroke(0);
        p.rectMode(p.CORNER);
        p.rect(0, -4, this.barrelLen, 8); // Gun barrel
        p.pop();
    }
}