// Particle System for Visual Effects

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05;
        this.type = type; // 'FIRE', 'SMOKE', 'HIT', 'JUMP'
        
        switch(type) {
            case 'FIRE':
                this.color = [255, Math.random() * 150, 0];
                this.size = Math.random() * 8 + 4;
                this.vy -= 1; // Float up
                this.decay = 0.05 + Math.random() * 0.05;
                break;
            case 'SMOKE':
                this.color = [100, 100, 100];
                this.size = Math.random() * 10 + 5;
                this.vy -= 0.5;
                this.decay = 0.02;
                break;
            case 'HIT':
                this.color = [255, 255, 200];
                this.size = Math.random() * 5 + 2;
                this.vx *= 3;
                this.vy *= 3;
                this.decay = 0.1;
                break;
            case 'JUMP':
                this.color = [200, 200, 200];
                this.size = Math.random() * 6 + 2;
                this.vy = 0;
                this.decay = 0.08;
                break;
            default:
                this.color = [255, 255, 255];
                this.size = 5;
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

    isDead() {
        return this.life <= 0;
    }
}

export function createExplosion(x, y, count = 10, type = 'FIRE') {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}