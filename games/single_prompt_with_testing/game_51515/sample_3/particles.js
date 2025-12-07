/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, color, size = 3) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.gravity = 0.1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }
    
    render(p) {
        p.noStroke();
        // Extract alpha if needed, or simple opacity
        // Assuming hex colors, we use global alpha
        p.push();
        const c = p.color(this.color);
        c.setAlpha(this.life * 255);
        p.fill(c);
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

export function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function createJumpDust(x, y) {
    for (let i = 0; i < 5; i++) {
        const p = new Particle(x, y, '#bdc3c7', 2);
        p.vy = -Math.random(); // Upward only
        p.vx = (Math.random() - 0.5) * 2;
        gameState.particles.push(p);
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        } else {
            part.render(p);
        }
    }
}