import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size * this.life);
    }
}

export function createExplosion(x, y, count, color) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, Math.random()*5+2, color));
    }
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let p = gameState.particles[i];
        p.update();
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(part => part.render(p));
}