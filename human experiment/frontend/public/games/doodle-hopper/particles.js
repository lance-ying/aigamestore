/**
 * Particle system for visual effects
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'DUST', 'EXPLOSION', 'STAR', 'BREAK'
        this.life = 1.0;
        this.decay = 0.05;
        
        if (type === 'DUST') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 5 + 2;
            this.color = [200, 200, 200];
            this.decay = 0.08;
        } else if (type === 'EXPLOSION') {
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
            this.size = Math.random() * 8 + 4;
            this.color = [255, 100, 50];
            this.decay = 0.05;
        } else if (type === 'STAR') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4 - 2;
            this.size = Math.random() * 6 + 2;
            this.color = [255, 255, 0];
            this.decay = 0.03;
        } else if (type === 'BREAK') {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = Math.random() * 5; // Fall down
            this.size = Math.random() * 8 + 4;
            this.color = [139, 69, 19];
            this.decay = 0.02;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'BREAK') {
            this.vy += 0.2; // Gravity for debris
        }
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        if (this.type === 'STAR') {
            p.circle(this.x, this.y, this.size);
        } else {
            p.rect(this.x, this.y, this.size, this.size);
        }
    }
}

export function createParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}