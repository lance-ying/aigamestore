/**
 * particles.js
 * Particle system for visual effects.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
        this.color = [255, 255, 255];
        
        // Customize based on type
        switch(type) {
            case 'EXPLOSION':
                this.color = [255, Math.random() * 100 + 100, 0];
                this.vx *= 2;
                this.vy *= 2;
                this.decay = 0.05;
                break;
            case 'BLOOD':
                this.color = [200, 0, 0];
                this.vy = Math.random() * -2 - 1; // Spurt up
                this.gravity = 0.2;
                break;
            case 'MONEY':
                this.color = [255, 215, 0];
                this.vy = -3;
                this.gravity = 0.1;
                this.decay = 0.01;
                this.size = 3;
                break;
            case 'HEAL':
                this.color = [100, 255, 100];
                this.vy = -1;
                this.gravity = 0;
                this.vx *= 0.2;
                break;
            case 'TELEPORT':
                this.color = [255, 100, 100];
                this.vy = -2;
                this.gravity = 0;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.gravity) this.vy += this.gravity;
        
        // Ground bounce for blood/money
        if (this.type === 'BLOOD' || this.type === 'MONEY') {
             // Simple ground check approximation
             if (this.y > gameState.worldHeight - 10) {
                 this.vy *= -0.5;
                 this.y = gameState.worldHeight - 10;
                 this.vx *= 0.8;
             }
        }
    }
    
    render(p, cameraX, cameraY) {
        if (this.life <= 0) return;
        
        p.noStroke();
        // Fade out alpha
        const alpha = this.life * 255;
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        p.rect(this.x - cameraX, this.y - cameraY, this.size, this.size);
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60; // frames
        this.vy = -1;
    }
    
    update() {
        this.y += this.vy;
        this.life--;
    }
    
    render(p, cameraX, cameraY) {
        p.fill(this.color);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(12);
        const alpha = Math.min(255, this.life * 10);
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.text(this.text, this.x - cameraX, this.y - cameraY);
    }
}

export function spawnFloatingText(x, y, text, color = [255, 255, 255]) {
    gameState.particles.push(new FloatingText(x, y, text, color));
}