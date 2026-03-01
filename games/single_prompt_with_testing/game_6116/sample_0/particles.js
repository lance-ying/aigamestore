// particles.js
// Visual effects system

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 2;
        this.vy = options.vy || (Math.random() - 0.5) * 2;
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.size = options.size || 5;
        this.color = options.color || [255, 255, 255];
        this.gravity = options.gravity || 0;
        this.decay = options.decay || 0.95; // Friction
        this.shrink = options.shrink || false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        this.vx *= this.decay;
        this.vy *= this.decay;
        
        this.life--;
    }

    render(p, cameraX, cameraY) {
        const alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        const currentSize = this.shrink ? p.map(this.life, 0, this.maxLife, 0, this.size) : this.size;
        
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x - cameraX, this.y - cameraY, currentSize);
    }
    
    isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor() {
        // Particles are stored in gameState.particles for global rendering
    }

    static emit(type, x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            let p;
            switch (type) {
                case 'dust':
                    p = new Particle(x, y, {
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: -Math.random() * 1, // Rise slightly
                        life: 30 + Math.random() * 20,
                        size: 3 + Math.random() * 4,
                        color: [200, 200, 200],
                        gravity: -0.01,
                        shrink: true
                    });
                    break;
                case 'charge':
                    p = new Particle(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*20, {
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5 - 1, // Float up
                        life: 20,
                        size: 2,
                        color: [255, 255, 100],
                        gravity: 0,
                        shrink: false
                    });
                    break;
                case 'land':
                    p = new Particle(x, y, {
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 2,
                        life: 20,
                        size: 4,
                        color: [255, 255, 255],
                        gravity: 0.1,
                        shrink: true
                    });
                    break;
                case 'spark':
                    p = new Particle(x, y, {
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        life: 15,
                        size: 3,
                        color: [255, 200, 50],
                        gravity: 0,
                        shrink: true
                    });
                    break;
            }
            if (p) gameState.particles.push(p);
        }
    }
}