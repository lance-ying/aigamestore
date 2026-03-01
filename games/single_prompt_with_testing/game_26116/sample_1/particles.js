/**
 * Particle System for Visual Effects.
 * Handles creation, updating, and rendering of transient visual elements.
 */

import { gameState } from './globals.js';

export class ParticleSystem {
    constructor() {
        // Wrapper class for helper methods
    }

    static spawnExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const p = new Particle(x, y, 'EXPLOSION', color);
            gameState.particles.push(p);
        }
    }

    static spawnDust(x, y) {
        for (let i = 0; i < 5; i++) {
            gameState.particles.push(new Particle(x, y, 'DUST', [200, 200, 200]));
        }
    }

    static spawnSpark(x, y, vx, vy) {
        const p = new Particle(x, y, 'SPARK', [255, 255, 100]);
        p.vx = vx + (Math.random() - 0.5);
        p.vy = vy + (Math.random() - 0.5);
        gameState.particles.push(p);
    }
}

export class Particle {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color; // Array [r, g, b]
        this.active = true;
        
        // Random velocities based on type
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 5 + Math.random() * 5;
        this.gravity = 0;
        
        if (type === 'DUST') {
            this.vy = -Math.random() * 1;
            this.vx *= 0.5;
            this.gravity = -0.05; // float up
            this.decay = 0.05;
        } else if (type === 'EXPLOSION') {
            this.gravity = 0.1;
        } else if (type === 'SPARK') {
            this.life = 0.5;
            this.decay = 0.1;
            this.size = 3;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(p) {
        p.push();
        p.noStroke();
        
        const alpha = this.life * 255;
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === 'SPARK') {
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size * this.life); // Shrink over time
        }
        
        p.pop();
    }
}