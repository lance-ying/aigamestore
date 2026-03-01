/**
 * particles.js
 * Visual effects system.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        
        // Defaults
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05;
        this.size = 5;
        this.color = [255, 255, 255];
        
        this.initType();
    }
    
    initType() {
        switch(this.type) {
            case 'EXPLOSION':
                this.color = [255, 100, 50];
                this.size = Math.random() * 8 + 4;
                this.decay = 0.08;
                break;
            case 'SMOKE':
                this.color = [150, 150, 150];
                this.vy = -1 - Math.random();
                this.decay = 0.02;
                this.size = 4;
                break;
            case 'SPARK':
                this.color = [255, 255, 100];
                this.vx *= 2;
                this.vy *= 2;
                this.decay = 0.1;
                this.size = 2;
                break;
            case 'GLITCH':
                this.color = [0, 0, 0];
                this.size = Math.random() * 6 + 2;
                this.decay = 0.05;
                break;
            case 'JUMP_DUST':
                this.color = [200, 200, 200];
                this.vy = 0;
                this.vx = (Math.random() - 0.5) * 2;
                this.decay = 0.1;
                this.size = 4;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Physics per type
        if (this.type === 'EXPLOSION' || this.type === 'SPARK') {
            this.vy += 0.2; // Gravity
        }
        
        this.life -= this.decay;
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    render(p) {
        if (!this.active) return;
        
        const alpha = this.life * 255;
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === 'GLITCH') {
            // Draw random rects for glitch effect
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size);
        }
    }
}

/**
 * Helper to spawn bursts of particles
 */
export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

/**
 * Creates floating text for damage numbers
 */
export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || [255, 255, 255];
        this.vy = -2;
        this.life = 1.0;
        this.active = true;
    }
    
    update() {
        this.y += this.vy;
        this.vy *= 0.9;
        this.life -= 0.02;
        if (this.life <= 0) this.active = false;
    }
    
    render(p) {
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.text, this.x, this.y);
    }
}