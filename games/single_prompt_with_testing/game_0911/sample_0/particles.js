import { gameState } from './globals.js';

class Particle {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05 + Math.random() * 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x - gameState.cameraX, this.y - gameState.cameraY, this.size * this.life);
    }
}

export function spawnParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, Math.random() * 4 + 2));
    }
}