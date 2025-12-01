import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.color = color;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size * this.life);
    }
}

export function createBurst(p, x, y, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        } else {
            part.render(p);
        }
    }
}