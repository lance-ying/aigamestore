/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState } from './globals.js';

class Particle {
    constructor(x, y, color, size, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.05 + Math.random() * 0.05;
    }

    update() {
        if (!gameState.isFrozen) {
            this.y += gameState.scrollSpeed;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    render(p) {
        p.push();
        // Handle color array or string
        if (Array.isArray(this.color)) {
            p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        } else {
            let c = p.color(this.color);
            c.setAlpha(this.life * 255);
            p.fill(c);
        }
        p.noStroke();
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

class TextParticle {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -1;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }

    render(p) {
        p.push();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export function createExplosion(p, x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, p.random(3, 8), p.random(2, 5)));
    }
}

export function createTextPopup(p, x, y, text, color) {
    gameState.particles.push(new TextParticle(x, y, text, color));
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(part => part.render(p));
}