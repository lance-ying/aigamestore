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
        this.markedForDeletion = false;
        
        // Default properties
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = 5;
        this.color = [255, 255, 255];
        
        // Customization based on type
        this.initType(type);
    }
    
    initType(type) {
        switch(type) {
            case 'dust':
                this.color = COLORS.TILE_DIRT;
                this.vy = Math.random() * -1; // float up slightly
                this.decay = 0.03;
                this.size = Math.random() * 6 + 2;
                break;
            case 'jump':
                this.color = [200, 200, 200];
                this.vy = 0.5; // settle down
                this.vx = (Math.random() - 0.5) * 3;
                this.decay = 0.05;
                break;
            case 'blood':
                this.color = [255, 50, 50];
                this.vy = Math.random() * -3;
                this.vx = (Math.random() - 0.5) * 4;
                this.gravity = 0.2;
                this.decay = 0.02;
                break;
            case 'spark':
                this.color = [255, 255, 100];
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.decay = 0.1;
                this.size = 3;
                break;
            case 'gem_shine':
                this.color = [200, 255, 255];
                this.vx = 0;
                this.vy = -1;
                this.decay = 0.05;
                this.size = 2;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'blood') {
            this.vy += this.gravity;
        }
        
        this.life -= this.decay;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size * this.life);
    }
}

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || [255, 255, 255];
        this.vy = -1;
        this.life = 1.0;
        this.decay = 0.015;
    }
    
    update() {
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(p) {
        if (this.life <= 0) return;
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.textAlign(p.CENTER);
        p.textSize(14);
        p.text(this.text, this.x, this.y);
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function spawnFloatingText(x, y, text, color) {
    gameState.floatingTexts.push(new FloatingText(x, y, text, color));
}