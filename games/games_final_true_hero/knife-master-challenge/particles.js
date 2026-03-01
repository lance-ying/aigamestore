/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState, GAME_CONFIG } from './globals.js';

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.alpha = 255;
        this.decay = Math.random() * 5 + 2;
        this.gravity = 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        p.rectMode(p.CENTER);
        p.square(this.x, this.y, this.size);
    }
}

class WoodChip extends Particle {
    constructor(x, y) {
        super(x, y, GAME_CONFIG.colors.woodLight);
        this.size = Math.random() * 6 + 3;
    }
}

class AppleSlice extends Particle {
    constructor(x, y) {
        super(x, y, [220, 30, 30]); // Red
        this.gravity = 0.3;
        this.size = 8;
    }
}

class Spark extends Particle {
    constructor(x, y) {
        super(x, y, [255, 255, 100]); // Yellow
        this.gravity = 0.1;
        this.decay = 10;
    }
}

/**
 * Spawns an explosion of particles.
 */
export function spawnParticles(x, y, type, count = 10) {
    for (let i = 0; i < count; i++) {
        let p;
        if (type === "WOOD") p = new WoodChip(x, y);
        else if (type === "APPLE") p = new AppleSlice(x, y);
        else if (type === "SPARK") p = new Spark(x, y);
        else p = new Particle(x, y, [255, 255, 255]);
        
        gameState.particles.push(p);
    }
}

/**
 * Update and render all particles.
 */
export function updateAndRenderParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        part.render(p);
        
        if (part.alpha <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}