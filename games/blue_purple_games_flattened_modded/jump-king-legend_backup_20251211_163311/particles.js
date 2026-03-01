/**
 * Particle system for visual effects.
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'DUST', 'SPARK', 'CHARGE'
        this.life = 1.0;
        this.decay = 0.05;
        this.size = 5;
        
        // Random velocities based on type
        if (type === 'DUST') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() * -1) - 0.5;
            this.color = [200, 200, 200];
            this.decay = 0.04;
        } else if (type === 'SPARK') {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.color = [255, 255, 0];
            this.decay = 0.08;
        } else if (type === 'CHARGE') {
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 1) * 2;
            this.color = [255, 100, 50];
            this.decay = 0.05;
        } else if (type === 'WIN') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.color = [Math.random()*255, Math.random()*255, Math.random()*255];
            this.decay = 0.02;
            this.size = 8;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'DUST') {
            this.size += 0.1;
        }
    }

    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.translate(this.x, this.y);
        if (this.type === 'SPARK') {
            p.rotate(p.frameCount * 0.2);
            p.rect(0, 0, this.size, this.size);
        } else {
            p.circle(0, 0, this.size);
        }
        p.pop();
    }
}

export function createParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function updateAndRenderParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let part = gameState.particles[i];
        part.update();
        part.render(p);
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}