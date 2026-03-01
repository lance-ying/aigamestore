/**
 * Particle System for visual effects.
 */

import { gameState, GRAVITY, COLORS } from './globals.js';
import { worldToScreen, applyCamera } from './iso_math.js';

export class Particle {
    constructor(x, y, z, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = color;
        
        // Random velocities
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vz = Math.sin(angle) * speed;
        this.vy = Math.random() * 5 + 5; // Initial upward burst
        
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;
        this.size = Math.random() * 5 + 3;
    }

    update() {
        this.x += this.vx;
        this.z += this.vz;
        this.y += this.vy;
        this.vy -= GRAVITY * 0.5; // lighter gravity for particles

        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;

        const screenPos = worldToScreen(this.x, this.y, this.z);
        const finalPos = applyCamera(screenPos.x, screenPos.y);

        p.noStroke();
        // Use color with alpha
        const r = this.color[0];
        const g = this.color[1];
        const b = this.color[2];
        p.fill(r, g, b, this.life * 255);
        
        p.circle(finalPos.x, finalPos.y, this.size * this.life);
    }
}

export function createExplosion(x, y, z, color) {
    for (let i = 0; i < 20; i++) {
        gameState.particles.push(new Particle(x, y, z, color));
    }
}

export function createSparkle(x, y, z, color) {
    for (let i = 0; i < 10; i++) {
        gameState.particles.push(new Particle(x, y, z, color));
    }
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.update();
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(part => part.render(p));
}