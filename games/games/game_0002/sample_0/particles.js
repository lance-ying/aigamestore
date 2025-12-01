import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
        
        if (type === 'DUST') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 5 + 2;
            this.color = [200, 200, 200];
        } else if (type === 'SPARKLE') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.size = Math.random() * 6 + 2;
            this.color = [255, 223, 0]; // Gold
        } else if (type === 'DEATH') {
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
            this.size = Math.random() * 8 + 3;
            this.color = [50, 200, 150]; // Leo color
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
    }
}

export function createExplosion(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function updateAndRenderParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        } else {
            // Determine if on screen
            if (part.x > gameState.cameraX && part.x < gameState.cameraX + p.width) {
                part.render(p);
            }
        }
    }
}