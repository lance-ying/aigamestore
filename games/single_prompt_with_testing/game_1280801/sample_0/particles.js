import { randomInt, colorToP5 } from './utils.js';
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 5 + 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.life -= this.decay;
    }

    draw(p) {
        if (this.life <= 0) return;
        p.noStroke();
        p.fill(colorToP5(p, this.color, this.life * 255));
        p.circle(this.x, this.y, this.size);
    }
}

export class Firework {
    constructor(x, y, color) {
        this.particles = [];
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(p) {
        this.particles.forEach(pt => pt.draw(p));
    }
    
    isDead() {
        return this.particles.length === 0;
    }
}

export function spawnPulseEffect(x, y, color) {
    // Simple visual effect function called from game logic
    gameState.particles.push(new Firework(x, y, color));
}

export function updateParticles() {
    gameState.particles.forEach(sys => sys.update());
    gameState.particles = gameState.particles.filter(sys => !sys.isDead());
}

export function renderParticles(p) {
    gameState.particles.forEach(sys => sys.draw(p));
}