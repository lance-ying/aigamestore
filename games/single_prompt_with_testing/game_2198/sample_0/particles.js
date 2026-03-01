/**
 * particles.js
 * Implementation of particle systems for visual juice.
 */

import { gameState } from './globals.js';

/**
 * Base Particle Class
 */
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color; // [r, g, b]
        this.size = size;
        this.alpha = 255;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = (this.life / this.maxLife) * 255;
        
        // Simple drag
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        p.rect(this.x, this.y, this.size, this.size);
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Creates an explosion of particles (e.g., on death)
 */
export function createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = 30 + Math.random() * 20;
        const size = Math.random() * 8 + 4;
        
        gameState.particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
}

/**
 * Creates dust particles (e.g., on jump or land)
 */
export function createDust(x, y) {
    for (let i = 0; i < 5; i++) {
        const vx = (Math.random() - 0.5) * 2;
        const vy = (Math.random() * -1) - 0.5;
        const life = 20 + Math.random() * 10;
        
        gameState.particles.push(
            new Particle(x, y, vx, vy, life, [200, 200, 200], 4)
        );
    }
}

/**
 * Creates trail particles for the player
 */
export function createTrail(x, y, color) {
    const p = new Particle(x, y, 0, 0, 15, color, 30); // Size matches player roughly
    p.vx = -gameState.worldSpeed * 0.1; // Slight drift back
    p.update = function() {
        this.x += this.vx; // Move relative to world
        this.life--;
        this.size *= 0.9; // Shrink
        this.alpha = (this.life / this.maxLife) * 150;
    };
    gameState.particles.push(p);
}

/**
 * System updater
 */
export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.update();
        if (p.isDead()) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    // Render relative to camera
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    gameState.particles.forEach(part => part.render(p));
    p.pop();
}