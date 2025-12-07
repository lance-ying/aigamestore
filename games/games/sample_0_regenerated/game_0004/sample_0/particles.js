/**
 * Particle system for visual effects.
 * Handles explosion debris, muzzle flashes, and dust.
 */

import { gameState } from './globals.js';

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'SMOKE', 'SPARK', 'DEBRIS', 'TEXT'
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 5 + 2;
        this.color = [255, 255, 255];
        
        this.setupType();
    }
    
    setupType() {
        switch(this.type) {
            case 'SMOKE':
                this.color = [200, 200, 200];
                this.vx *= 0.5;
                this.vy = -Math.random() * 2; // Float up
                this.size = 10;
                break;
            case 'SPARK':
                this.color = [255, 200, 50];
                this.decay = 0.05;
                break;
            case 'DEBRIS':
                this.color = [255, 100, 100];
                this.vy = -Math.random() * 5; // Pop up
                break;
            case 'SHELL':
                this.color = [255, 255, 0];
                this.size = 4;
                this.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + 2);
                this.vy = -4;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Gravity for physical particles
        if (this.type === 'DEBRIS' || this.type === 'SHELL' || this.type === 'SPARK') {
            this.vy += 0.3;
        }
        
        this.life -= this.decay;
        
        // Interaction with floor (simple bounce)
        if (this.type === 'SHELL' && this.y > gameState.cameraY + 400) { 
            this.life = 0; // Kill if off screen
        }
    }
    
    render(p) {
        if (this.life <= 0) return;
        
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.translate(this.x, this.y);
        
        if (this.type === 'SHELL') {
            p.rect(0, 0, 3, 5);
        } else {
            p.circle(0, 0, this.size);
        }
        p.pop();
    }
}

export function createExplosion(x, y, count = 10, type = 'SPARK') {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        } else {
            part.render(p);
        }
    }
}