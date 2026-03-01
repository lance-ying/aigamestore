/**
 * particles.js
 * Particle system for visual effects (explosions, text, dust).
 */

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0;
        this.decay = 0.05;
        this.color = [255, 255, 255];
        this.size = 5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size * this.life);
    }
}

export class ExplosionParticle extends Particle {
    constructor(x, y, color = [255, 100, 50]) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.decay = 0.03 + Math.random() * 0.02;
        this.color = color;
        this.size = 10 + Math.random() * 10;
    }
}

export class DamageNumber extends Particle {
    constructor(x, y, value, color = [255, 50, 50]) {
        super(x, y);
        this.value = value;
        this.color = color;
        this.vx = 0;
        this.vy = -1; // Float up
        this.decay = 0.02;
        this.size = 20; // Text size
    }

    render(p) {
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(this.size);
        p.text(this.value, this.x, this.y);
    }
}

export class ParticleSystem {
    constructor() {
        // Managed via gameState.particles
    }

    static spawnExplosion(x, y, count = 10, color) {
        for (let i = 0; i < count; i++) {
            gameState.particles.push(new ExplosionParticle(x, y, color));
        }
    }

    static spawnDamageText(x, y, value) {
        gameState.particles.push(new DamageNumber(x, y, value));
    }

    static spawnBumpEffect(x, y) {
        gameState.particles.push(new DamageNumber(x, y, "BUMP!", [200, 200, 200]));
    }
}