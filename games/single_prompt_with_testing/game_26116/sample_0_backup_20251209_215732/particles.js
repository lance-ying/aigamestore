/**
 * Particle System
 * 
 * Handles visual effects like dust, water splashes, glow, and item effects.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.02;
        this.type = type || 'DEFAULT';
        
        // Type specific config
        switch(this.type) {
            case 'DUST':
                this.color = [200, 200, 200];
                this.size = Math.random() * 4 + 2;
                this.decay = 0.05;
                this.vy = -0.5; // Float up
                break;
            case 'WATER':
                this.color = COLORS.WATER_SURFACE;
                this.size = Math.random() * 3 + 1;
                this.vy = -Math.random() * 2 - 1;
                this.decay = 0.03;
                break;
            case 'GLOW':
                this.color = COLORS.PARTICLE_GLOW;
                this.size = Math.random() * 2 + 1;
                this.vx *= 0.2;
                this.vy *= 0.2;
                this.decay = 0.005;
                break;
            case 'EXPLOSION':
                this.color = [255, 100, 50];
                this.vx *= 3;
                this.vy *= 3;
                this.size = Math.random() * 6 + 2;
                this.decay = 0.04;
                break;
            default:
                this.color = [255, 255, 255];
                this.size = 2;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;

        // Gravity for some particles
        if (this.type === 'WATER' || this.type === 'EXPLOSION') {
            this.vy += 0.1;
        }
    }

    render(p) {
        p.noStroke();
        // Calculate alpha based on life
        const alpha = this.life * 255;
        
        if (this.type === 'GLOW') {
            // Draw additive glow
            p.blendMode(p.ADD);
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.circle(this.x, this.y, this.size * 2);
            p.blendMode(p.BLEND);
        } else {
            const c = this.color;
            // Handle array colors with length 3 or 4
            if (c.length === 4) {
                 p.fill(c[0], c[1], c[2], Math.min(c[3], alpha));
            } else {
                 p.fill(c[0], c[1], c[2], alpha);
            }
            p.rect(this.x, this.y, this.size, this.size);
        }
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, type, count = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(p) {
        for (const particle of this.particles) {
            particle.render(p);
        }
    }
    
    clear() {
        this.particles = [];
    }
}