// particles.js - Visual effects system
import { gameState, ENTITY_TYPES } from './globals.js';

class Particle {
    constructor(x, y, color, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.type = ENTITY_TYPES.PARTICLE;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.vy += 0.1; // slight gravity for particles

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(p, cameraX, cameraY) {
        if (!this.active) return;
        const alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.push();
        p.noStroke();
        // Handle color array or p5 color object
        if (Array.isArray(this.color)) {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
        } else {
            // Assume it's a p5 color but we need to set alpha. 
            // Since we can't easily mutate p5 color alpha without creating new,
            // we'll stick to array colors for particles mainly.
            p.fill(this.color); 
        }
        p.circle(this.x - cameraX, this.y - cameraY, this.size);
        p.pop();
    }
}

export function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, 30 + Math.random() * 20, 3 + Math.random() * 4));
    }
}

export function createSparkle(x, y) {
    gameState.particles.push(new Particle(x, y, [255, 255, 0], 20, 2));
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (!part.active) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p, cameraX, cameraY) {
    gameState.particles.forEach(part => part.render(p, cameraX, cameraY));
}