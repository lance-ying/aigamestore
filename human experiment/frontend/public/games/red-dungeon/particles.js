import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.color = color;
        this.alpha = 255;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 2 + Math.random() * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.alpha = this.life * 255;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function createParticleExplosion(p, x, y, color) {
    for (let i = 0; i < 20; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function createCoinSparkle(p, x, y) {
    for (let i = 0; i < 10; i++) {
        gameState.particles.push(new Particle(x, y, [255, 255, 100]));
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