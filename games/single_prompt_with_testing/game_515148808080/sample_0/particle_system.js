/**
 * particle_system.js
 * Handles visual effects.
 */

import { gameState, COLORS } from './globals.js';
import { randomChoice, randomInt } from './math_utils.js';

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.02 + Math.random() * 0.03;
        
        switch (type) {
            case 'EXPLOSION':
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.size = randomInt(null, 4, 8); // null p passed because we use Math here for speed, or pass p later
                this.color = randomChoice({random: () => Math.random()}, COLORS.PARTICLE);
                this.gravity = 0.2;
                break;
            case 'DUST':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -Math.random() * 2;
                this.size = randomInt(null, 2, 5);
                this.color = '#cccccc';
                this.gravity = 0;
                break;
            case 'COIN':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.size = 3;
                this.color = COLORS.COIN;
                this.gravity = 0.1;
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        // Add alpha to hex
        let c = p.color(this.color);
        c.setAlpha(this.life * 255);
        p.fill(c);
        p.rect(this.x, this.y, this.size, this.size);
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function updateAndRenderParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let part = gameState.particles[i];
        part.update();
        part.render(p);
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}