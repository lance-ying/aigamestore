/**
 * particles.js
 * Visual effects system.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.type = type; // 'spark', 'blood', 'magic', 'dust'
        
        if (type === 'blood') {
            this.color = [200, 0, 0];
            this.size = Math.random() * 4 + 2;
            this.gravity = 0.2;
        } else if (type === 'magic') {
            this.color = [0, 255, 255];
            this.size = Math.random() * 3 + 1;
            this.gravity = -0.05;
            this.vx *= 0.5;
            this.vy *= 0.5;
        } else if (type === 'dust') {
            this.color = [150, 150, 150];
            this.size = Math.random() * 5 + 2;
            this.gravity = 0;
            this.vx *= 0.2;
            this.vy *= 0.2;
        } else { // spark
            this.color = [255, 200, 50];
            this.size = Math.random() * 3 + 1;
            this.gravity = 0.1;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.gravity) this.vy += this.gravity;
        
        this.life -= this.decay;
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size * this.life);
    }

    isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, type, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(p) {
        this.particles.forEach(pt => pt.render(p));
    }
    
    clear() {
        this.particles = [];
    }
}

export const globalParticles = new ParticleSystem();