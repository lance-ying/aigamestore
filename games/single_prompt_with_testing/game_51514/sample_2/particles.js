// particles.js - Visual effects system
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // "EXPLOSION", "SMOKE", "SPARKLE", "DEBRIS"
        this.age = 0;
        this.active = true;
        
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        
        // Customize based on type
        switch(type) {
            case "EXPLOSION":
                this.lifetime = 30 + Math.random() * 20;
                this.size = 10 + Math.random() * 20;
                this.color = [255, 100 + Math.random() * 100, 0];
                this.drag = 0.9;
                break;
            case "SMOKE":
                this.lifetime = 60;
                this.size = 5 + Math.random() * 10;
                this.color = [100, 100, 100];
                this.vy = -1 - Math.random(); // Float up
                this.drag = 0.95;
                break;
            case "SPARKLE":
                this.lifetime = 40;
                this.size = 2 + Math.random() * 3;
                this.color = [255, 255, 150];
                this.drag = 0.9;
                break;
            case "DEBRIS":
                this.lifetime = 50;
                this.size = 4 + Math.random() * 4;
                this.color = [100, 50, 20];
                this.vy = -5; // Pop up
                this.drag = 0.98;
                this.gravity = 0.4;
                break;
        }
    }

    update() {
        this.age++;
        if (this.age > this.lifetime) {
            this.active = false;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.gravity) this.vy += this.gravity;
        if (this.drag) {
            this.vx *= this.drag;
            this.vy *= this.drag;
        }

        // Shrink or fade
        this.alpha = 1 - (this.age / this.lifetime);
    }

    render(p) {
        p.noStroke();
        const c = p.color(...this.color);
        c.setAlpha(this.alpha * 255);
        p.fill(c);
        p.circle(this.x, this.y, this.size * this.alpha);
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, count = 20) {
        for(let i=0; i<count; i++) {
            gameState.particles.push(new Particle(x, y, "EXPLOSION"));
        }
        for(let i=0; i<count/2; i++) {
            gameState.particles.push(new Particle(x, y, "SMOKE"));
        }
    }

    createBlockDebris(x, y) {
        for(let i=0; i<10; i++) {
            gameState.particles.push(new Particle(x + Math.random()*20, y + Math.random()*20, "DEBRIS"));
        }
    }

    createSparkles(x, y) {
        gameState.particles.push(new Particle(x, y, "SPARKLE"));
    }
}

export const particleSystem = new ParticleSystem();