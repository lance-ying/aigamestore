// particles.js
// Visual effects system

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.05;
        
        switch(type) {
            case 'jump_dust':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = Math.random() * 0.5;
                this.size = Math.random() * 5 + 3;
                this.color = [200, 200, 200];
                this.decay = 0.05;
                break;
            case 'coin_sparkle':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.size = Math.random() * 4 + 2;
                this.color = [255, 215, 0];
                this.decay = 0.03;
                break;
            case 'enemy_death':
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.size = Math.random() * 8 + 4;
                this.color = [255, 100, 100];
                this.decay = 0.04;
                break;
            default:
                this.vx = 0;
                this.vy = 0;
                this.size = 5;
                this.color = [255, 255, 255];
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'coin_sparkle') {
            this.vy += 0.1; // mild gravity
        }
    }
    
    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

export function createParticles(x, y, type, count) {
    for(let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}