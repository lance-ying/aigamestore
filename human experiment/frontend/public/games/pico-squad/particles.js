/**
 * Particle System
 * Visual effects for jumping, landing, key collection.
 */

import { COLORS } from './globals.js';
import { gameState } from './globals.js';

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        
        if (type === 'DUST') {
            this.color = [...COLORS.PARTICLE_DUST];
            this.size = Math.random() * 6 + 2;
            this.vy = -Math.random() * 2;
        } else if (type === 'SPARKLE') {
            this.color = [...COLORS.PARTICLE_SPARKLE];
            this.size = Math.random() * 4 + 2;
        } else if (type === 'CONFETTI') {
            this.color = [Math.random()*255, Math.random()*255, Math.random()*255];
            this.size = 5;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = -Math.random() * 8 - 2;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'DUST') {
            this.size *= 0.95;
        } else if (this.type === 'CONFETTI') {
            this.vy += 0.3; // Gravity
            this.vx *= 0.95;
        }
    }

    render(p) {
        p.push();
        p.noStroke();
        if (this.color.length === 4) {
            p.fill(this.color[0], this.color[1], this.color[2], this.color[3] * this.life);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], 255 * this.life);
        }
        
        if (this.type === 'CONFETTI') {
            p.translate(this.x, this.y);
            p.rotate(this.life * 10);
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

export function updateAndRenderParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        part.render(p);
        
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}