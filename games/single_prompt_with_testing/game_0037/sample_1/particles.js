// particles.js - Visual effects
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // "DUST", "SPARKLE", "EXPLOSION"
        this.age = 0;
        this.lifetime = 30;
        
        if (type === "DUST") {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 1) * 2;
            this.size = Math.random() * 5 + 3;
            this.color = [200, 200, 200];
            this.drag = 0.95;
        } else if (type === "SPARKLE") {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.size = Math.random() * 4 + 2;
            this.color = [255, 255, 100];
            this.lifetime = 20;
            this.drag = 0.9;
        } else if (type === "EXPLOSION") {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.size = Math.random() * 10 + 5;
            this.color = [255, 100, 50];
            this.lifetime = 40;
            this.drag = 0.92;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.drag) {
            this.vx *= this.drag;
            this.vy *= this.drag;
        }
        
        this.age++;
    }

    isDead() {
        return this.age >= this.lifetime;
    }

    render(p) {
        const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === "SPARKLE") {
            // Draw star shape
            p.translate(this.x, this.y);
            p.rotate(this.age * 0.2);
            p.rectMode(p.CENTER);
            p.rect(0, 0, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size);
        }
        
        p.pop();
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}