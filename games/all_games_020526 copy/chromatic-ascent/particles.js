/**
 * particles.js
 * Particle systems for visual effects (explosions, trails, collection).
 */

import { gameState } from './globals.js';

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 3;
        
        // Random velocity for explosion
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.alpha = 255;
        this.decay = Math.random() * 5 + 2;
        this.isDead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Add minimal gravity
        this.vy += 0.05;
        
        // Fade out
        this.alpha -= this.decay;
        this.size *= 0.95; // Shrink
        
        if (this.alpha <= 0 || this.size < 0.5) {
            this.isDead = true;
        }
    }

    render(p) {
        p.push();
        p.noStroke();
        // Parse hex color or p5 color to apply alpha
        const c = p.color(this.color);
        c.setAlpha(this.alpha);
        p.fill(c);
        p.circle(this.x, this.y - gameState.cameraY, this.size);
        p.pop();
    }
}

class StarParticle extends Particle {
    constructor(x, y) {
        super(x, y, '#FFFFFF');
        this.vx *= 0.5;
        this.vy *= 0.5;
        this.decay = 2;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Spawn explosion at coordinates
    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            gameState.particles.push(new Particle(x, y, color));
        }
    }

    // Spawn collection effect
    createCollectEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            gameState.particles.push(new StarParticle(x, y));
        }
    }
}

// Global helper to spawn particles
export function spawnExplosion(x, y, color) {
    // Add to global particle list
    for (let i = 0; i < 15; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.isDead) {
            gameState.particles.splice(i, 1);
        } else {
            part.render(p);
        }
    }
}