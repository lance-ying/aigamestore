// particles.js
// Visual effects

import { gameState } from './globals.js';
import { randomInt } from './utils.js';

export class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = randomInt({random: Math.random}, 2, 5);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
    }
    
    render(p, camera) {
        const alpha = (this.life / this.maxLife) * 255;
        p.push();
        p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), alpha);
        p.noStroke();
        p.circle(this.x - camera.x, this.y - camera.y, this.size);
        p.pop();
    }
}

export function createParticleExplosion(p, x, y, color) {
    for (let i = 0; i < 10; i++) {
        const vx = (Math.random() - 0.5) * 6;
        const vy = (Math.random() - 0.5) * 6;
        gameState.particles.push(new Particle(x, y, vx, vy, color, 30 + Math.random() * 20));
    }
}

export function createBloodSplatter(p, x, y) {
    createParticleExplosion(p, x, y, p.color(200, 0, 0));
}