/**
 * Visual Effects: Particles and Floating Text
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
    }
}

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -1; // Float up
    }
    
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    
    render(p) {
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.textAlign(p.CENTER);
        p.textSize(16);
        p.stroke(0, this.life * 255);
        p.strokeWeight(2);
        p.text(this.text, this.x, this.y);
    }
}

export function createParticleEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, 3));
    }
}

export function createFloatingText(x, y, text, color) {
    gameState.particles.push(new FloatingText(x, y, text, color));
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.update();
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(part => part.render(p));
}