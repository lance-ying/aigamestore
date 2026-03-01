/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState, COLOR_PALETTE } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0;
        this.decay = 0.05;
        this.type = type; // 'smoke', 'fire', 'spark', 'text'
        this.color = [255, 255, 255];
        this.size = Math.random() * 3 + 2;
        this.text = "";
        
        // Customize based on type
        if (type === 'smoke') {
            this.color = [100, 100, 100];
            this.decay = 0.02;
            this.vx *= 0.5;
            this.vy *= 0.5;
        } else if (type === 'fire') {
            this.color = [255, 100, 0];
            this.decay = 0.08;
            this.size = 5;
        } else if (type === 'spark') {
            this.color = [255, 255, 100];
            this.vx *= 4;
            this.vy *= 4;
            this.decay = 0.1;
            this.size = 2;
        } else if (type === 'blood') {
            this.color = [200, 0, 0];
            this.decay = 0.03;
            this.size = 3;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'smoke') {
            this.size += 0.1;
        }
    }
    
    render(p) {
        p.push();
        p.noStroke();
        const alpha = this.life * 255;
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === 'text') {
            p.textAlign(p.CENTER);
            p.textSize(12);
            p.text(this.text, this.x, this.y);
        } else {
            p.circle(this.x, this.y, this.size);
        }
        p.pop();
    }
}

export class FloatingText extends Particle {
    constructor(x, y, text, color) {
        super(x, y, 'text');
        this.text = text;
        this.color = color;
        this.vy = -1; // Float up
        this.vx = 0;
        this.decay = 0.02;
    }
}

export function createExplosion(x, y, count = 10, type = 'fire') {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function createDebris(x, y, count = 5, color) {
    for(let i=0; i<count; i++) {
        const p = new Particle(x, y, 'spark');
        p.color = color || [200, 200, 200];
        gameState.particles.push(p);
    }
}