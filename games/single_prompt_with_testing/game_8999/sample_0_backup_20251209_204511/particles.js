/**
 * particles.js
 * Visual effects system.
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
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.noStroke();
        // p.color expects values, if this.color is array spread it
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.rect(this.x, this.y, this.size, this.size);
        p.pop();
    }
}

export class ParticleSystem {
    constructor() {
        // Particles are stored in gameState.particles
    }

    static spawnBlockBreak(x, y, blockColor) {
        for (let i = 0; i < 8; i++) {
            gameState.particles.push(new Particle(x + 15, y + 15, blockColor, 5, 4));
        }
    }

    static updateAndRender(p) {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            part.render(p);
            if (part.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }
}