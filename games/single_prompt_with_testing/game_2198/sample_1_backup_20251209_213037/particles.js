/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.age = 0;
        this.dead = false;

        // Init based on type
        if (type === "DUST") {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 1) * 2;
            this.life = 20 + Math.random() * 10;
            this.size = Math.random() * 5 + 2;
            this.color = [...COLORS.GROUND];
            this.alpha = 200;
        } else if (type === "EXPLOSION") {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 40;
            this.size = Math.random() * 8 + 4;
            this.color = [...COLORS.PARTICLE_DEATH];
            this.alpha = 255;
            this.gravity = 0.2;
        } else if (type === "SPARKLE") {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.life = 30;
            this.size = 4;
            this.color = [...COLORS.ORB];
            this.alpha = 255;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;

        if (this.type === "EXPLOSION") {
            this.vy += this.gravity || 0;
        }

        if (this.age >= this.life) {
            this.dead = true;
        }
    }

    render(p) {
        const fade = 1 - (this.age / this.life);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha * fade);
        
        if (this.type === "DUST") {
            p.square(this.x, this.y, this.size * fade);
        } else {
            p.circle(this.x, this.y, this.size * fade);
        }
    }
}

export function createExplosion(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, "EXPLOSION"));
    }
}

export function createDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, "DUST"));
    }
}

export function createSparkle(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, "SPARKLE"));
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.dead) {
            gameState.particles.splice(i, 1);
        } else {
            // Render relative to camera
            const screenX = part.x - gameState.camera.x;
            const screenY = part.y - gameState.camera.y;
            
            // Basic culling
            if (screenX > -20 && screenX < p.width + 20 && screenY > -20 && screenY < p.height + 20) {
                p.push();
                p.translate(screenX, screenY);
                part.render(p);
                p.pop();
            }
        }
    }
}