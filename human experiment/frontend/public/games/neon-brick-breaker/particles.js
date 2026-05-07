/**
 * Particle system for visual effects
 */
import { gameState, COLORS } from './globals.js';
import { randomRange } from './utils.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = randomRange(-3, 3);
        this.vy = randomRange(-3, 3);
        this.life = 1.0;
        this.decay = randomRange(0.02, 0.05);
        this.size = randomRange(2, 5);
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    render(p) {
        p.push();
        p.noStroke();
        // convert hex to rgba if needed, but p5 handles transparency in fill
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