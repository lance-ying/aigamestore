/**
 * particles.js
 * Particle system for visual effects.
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'DUST', 'EXPLOSION', 'SPARKLE', 'ICE'
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 5 + 3;
        
        switch(type) {
            case 'DUST':
                this.color = [200, 200, 200];
                this.vy = -Math.random() * 2;
                break;
            case 'EXPLOSION':
                this.color = [255, 100, 50];
                this.vx *= 2;
                this.vy *= 2;
                break;
            case 'SPARKLE':
                this.color = [255, 255, 100];
                this.decay = 0.05;
                break;
            case 'ICE':
                this.color = [100, 255, 255];
                this.vx *= 0.5;
                this.vy *= 0.5;
                break;
            default:
                this.color = [255, 255, 255];
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // Physics for some particles
        if (this.type === 'DUST' || this.type === 'EXPLOSION') {
            this.vy += 0.1; // Slight gravity
            this.vx *= 0.95;
        }
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        if (this.type === 'SPARKLE') {
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size * this.life);
        }
    }
}

export function createExplosion(x, y, count = 10, type = 'EXPLOSION') {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}