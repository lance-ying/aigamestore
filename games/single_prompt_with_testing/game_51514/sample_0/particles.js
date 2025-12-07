/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, type = "DEFAULT") {
        this.x = x;
        this.y = y;
        this.color = color; // Array [r, g, b]
        this.type = type;
        
        // Random velocity spread
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 5 + Math.random() * 5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // Optional gravity for some particles
        if (this.type === "DEBRIS") {
            this.vy += 0.2;
        } else {
            // Friction for smoke/spark type
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
    }

    render(p) {
        if (this.life <= 0) return;
        
        p.push();
        p.noStroke();
        
        // Alpha calculation based on life
        let alpha = this.life * 255;
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        p.translate(this.x, this.y);
        p.circle(0, 0, this.size * this.life);
        
        p.pop();
    }
}

/**
 * Helper to spawn an explosion of particles
 */
export function spawnExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, "DEBRIS"));
    }
}

/**
 * Helper to spawn dust from jumping/landing
 */
export function spawnDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
        let p = new Particle(x, y, [200, 200, 200], "DUST");
        p.vy = -Math.random() * 2; // Upward drift
        gameState.particles.push(p);
    }
}