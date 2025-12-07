/**
 * Particle system for visual effects
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, speed, size, lifetime) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
    }

    render(p) {
        let alpha = p.map(this.age, 0, this.lifetime, 255, 0);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y - gameState.cameraY, this.size);
    }

    isDead() {
        return this.age >= this.lifetime;
    }
}

export function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, 5, Math.random() * 4 + 2, 30));
    }
}

export function createSparkle(x, y) {
    gameState.particles.push(new Particle(x, y, [255, 255, 0], 2, 3, 20));
}