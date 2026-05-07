import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        // Extract RGB and apply alpha
        const c = this.color;
        // Assuming p5 color object or array. Let's use array for simplicity [r,g,b]
        p.fill(c[0], c[1], c[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
    }
}

export function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        } else {
            // Rendering is handled in renderGameWorld to avoid double rendering
        }
    }
}