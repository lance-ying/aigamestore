/**
 * particles.js
 * Visual effects system.
 */

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, vx, vy, life, color, size, type = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.type = type; // 'circle', 'text', 'spark'
        this.alpha = 255;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = (this.life / this.maxLife) * 255;
        
        // Physics for some particles
        if (this.type !== 'text') {
            this.vx *= 0.95;
            this.vy *= 0.95;
        } else {
            this.vy *= 0.98; // Slow float up for text
        }
    }

    render(p, cameraX, cameraY) {
        p.push();
        p.translate(this.x - cameraX, this.y - cameraY);
        
        if (this.type === 'text') {
            p.fill(this.color);
            p.noStroke();
            p.textAlign(p.CENTER);
            p.textSize(this.size);
            p.text(this.textValue, 0, 0);
            p.stroke(0);
            p.strokeWeight(1);
            p.text(this.textValue, 1, 1); // Simple shadow
        } else {
            let c = p.color(this.color);
            c.setAlpha(this.alpha);
            p.fill(c);
            p.noStroke();
            if (this.type === 'circle') {
                p.circle(0, 0, this.size);
            } else if (this.type === 'rect') {
                p.rect(0, 0, this.size, this.size);
            }
        }
        
        p.pop();
    }
}

// Floating Combat Text
class FloatingText extends Particle {
    constructor(x, y, text, color, size) {
        super(x, y, 0, -1, 40, color, size, 'text');
        this.textValue = text;
    }
}

export function createParticleExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = 20 + Math.random() * 20;
        const size = Math.random() * 4 + 2;
        
        gameState.particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
}

export function createFloatingText(x, y, text, color, size) {
    gameState.particles.push(new FloatingText(x, y, text, color, size));
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

export function renderParticles(p, cameraX, cameraY) {
    gameState.particles.forEach(particle => particle.render(p, cameraX, cameraY));
}