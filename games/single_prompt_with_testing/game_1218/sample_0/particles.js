/**
 * particles.js
 * Visual effects system.
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.type = type; // 'SMOKE', 'EXPLOSION', 'SPARK', 'SHELL'
        
        if (type === 'EXPLOSION') {
            this.size = 10 + Math.random() * 10;
            this.vx *= 2;
            this.vy *= 2;
            this.color = [255, 100 + Math.random() * 100, 0];
        } else if (type === 'SMOKE') {
            this.size = 5 + Math.random() * 8;
            this.vy = -1 - Math.random(); // Float up
            this.color = [50, 50, 50];
            this.decay = 0.01;
        } else if (type === 'SPARK') {
            this.size = 3;
            this.color = [255, 255, 100];
            this.decay = 0.1;
        } else if (type === 'SHELL') {
            this.size = 4;
            this.vy = -3;
            this.vx = (Math.random() - 0.5) * 2;
            this.color = [200, 180, 50];
            this.decay = 0.01;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'SHELL') {
            this.vy += 0.3; // Gravity
        } else {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.noStroke();
        
        const alpha = this.life * 255;
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === 'SHELL') {
            p.rectMode(p.CENTER);
            p.rect(0, 0, 3, 5);
        } else {
            p.circle(0, 0, this.size * this.life);
        }
        
        p.pop();
    }
}

export function createExplosion(x, y, count = 10) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, 'EXPLOSION'));
    }
}

export function createSmoke(x, y, count = 3) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, 'SMOKE'));
    }
}