/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.age = 0;
        this.dead = false;
        
        // Default properties, overridden by type
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.lifeMax = 30;
        this.size = 5;
        this.color = [255, 255, 255];
        this.alpha = 255;
        this.drag = 0.95;
        this.gravity = 0;
        
        this.initType(type);
    }
    
    initType(type) {
        switch(type) {
            case 'DUST':
                this.color = [200, 200, 200];
                this.lifeMax = 20 + Math.random() * 20;
                this.size = 3 + Math.random() * 4;
                this.vy = -0.5 - Math.random(); // Float up
                this.drag = 0.9;
                break;
            case 'COIN_SPARKLE':
                this.color = [255, 255, 0];
                this.lifeMax = 30;
                this.size = 2 + Math.random() * 3;
                this.vx = (Math.random() - 0.5) * 5;
                this.vy = (Math.random() - 0.5) * 5;
                this.drag = 0.85;
                break;
            case 'BLOOD':
                this.color = [200, 20, 20];
                this.lifeMax = 120; // Stay longer
                this.size = 2 + Math.random() * 3;
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.gravity = 0.2;
                this.drag = 0.9;
                break;
            case 'DEBRIS':
                this.color = [100, 90, 80];
                this.lifeMax = 40;
                this.size = 4 + Math.random() * 4;
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.gravity = 0.3;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity;
        
        this.age++;
        
        // Update alpha based on age
        this.alpha = 255 * (1 - (this.age / this.lifeMax));
        
        if (this.age >= this.lifeMax) {
            this.dead = true;
        }
    }
    
    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        
        if (this.type === 'COIN_SPARKLE') {
            p.rect(this.x, this.y, this.size, this.size); // Pixels
        } else {
            p.circle(this.x, this.y, this.size);
        }
        
        p.pop();
    }
}

export function createExplosion(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}