/**
 * Particle system for visual effects.
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, speed, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.life = 30 + Math.random() * 20;
        this.maxLife = this.life;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.95;
    }
    
    render(p) {
        const alpha = (this.life / this.maxLife) * 255;
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function createHitParticle(x, y) {
    for (let i = 0; i < 5; i++) {
        gameState.particles.push(new Particle(x, y, [255, 255, 200], 5, 4));
    }
}

export function createDeathEffect(x, y) {
    for (let i = 0; i < 15; i++) {
        gameState.particles.push(new Particle(x, y, [200, 50, 50], 8, 6));
    }
}