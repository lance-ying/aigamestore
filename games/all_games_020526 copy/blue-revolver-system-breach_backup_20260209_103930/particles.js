/**
 * particles.js
 * Particle system for explosions, trails, and effects.
 */

import { gameState, COLORS } from './globals.js';

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = 0.05;
        this.size = Math.random() * 5 + 2;
        this.type = type; // 'spark', 'explosion', 'smoke'
        this.color = COLORS.PARTICLE_SPARK;
        
        if (type === 'explosion') {
            this.color = COLORS.PARTICLE_EXPLOSION;
            this.decay = 0.03;
            this.size = Math.random() * 10 + 5;
        } else if (type === 'smoke') {
            this.color = '#888888';
            this.vx *= 0.5;
            this.vy *= 0.5;
            this.decay = 0.02;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
    }

    render(p) {
        p.push();
        p.noStroke();
        // Alpha based on life
        const alpha = Math.floor(this.life * 255);
        // Parse hex to rgb for alpha? p5 handles this if we use color() object usually
        // but for raw performance string manipulation is tricky. 
        // We'll trust p5's fill(color, alpha) overload if color is a string is iffy
        // Safer to use simple transparency:
        
        const c = p.color(this.color);
        c.setAlpha(alpha);
        p.fill(c);
        
        if (this.type === 'spark') {
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size);
        }
        p.pop();
    }
}

export const ParticleSystem = {
    emit: (x, y, count, type = 'spark') => {
        for (let i = 0; i < count; i++) {
            gameState.particles.push(new Particle(x, y, type));
        }
    },
    
    updateAndRender: (p) => {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            part.render(p);
            if (part.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }
};