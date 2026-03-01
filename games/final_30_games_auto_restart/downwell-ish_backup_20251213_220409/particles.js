import { gameState, PALETTE } from './globals.js';

export class Particle {
    constructor(x, y, color, type = "DEFAULT") {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
        
        if (type === "EXPLOSION") {
            this.size = Math.random() * 8 + 4;
            this.decay = 0.05;
        } else if (type === "SHELL") {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = -Math.random() * 4 - 2; // Upwards pop
            this.color = "#FFD700"; // Gold
            this.decay = 0.02;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === "SHELL") {
            this.vy += 0.3; // Gravity for shells
        } else {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
        
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        const c = p.color(this.color);
        c.setAlpha(this.life * 255);
        p.fill(c);
        p.noStroke();
        
        if (this.type === "SHELL") {
            p.rect(this.x, this.y, 3, 6);
        } else {
            p.square(this.x, this.y, this.size * this.life);
        }
        p.pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

export function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, "EXPLOSION"));
    }
}