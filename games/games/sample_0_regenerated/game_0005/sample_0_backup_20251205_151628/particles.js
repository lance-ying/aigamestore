/**
 * particles.js
 * Visual effects system.
 */

import { gameState, COLORS } from './globals.js';
import { randomRange } from './utils.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.02;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 4 + 2;
        this.color = this.getColorByType(type);
    }
    
    getColorByType(type) {
        switch(type) {
            case 'DUST': return [150, 150, 150];
            case 'GOLD_SPARKLE': return [244, 162, 97];
            case 'BLOOD': return [200, 50, 50];
            case 'DEBRIS': return [80, 80, 90];
            default: return [255, 255, 255];
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Gravity for some particles
        if (this.type !== 'GOLD_SPARKLE') {
            this.vy += 0.2;
        }
        
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.noStroke();
        const c = this.color;
        p.fill(c[0], c[1], c[2], this.life * 255);
        p.rect(this.x, this.y, this.size, this.size);
        p.pop();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.isDead()) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(part => part.render(p));
}