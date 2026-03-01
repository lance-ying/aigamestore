/**
 * particles.js
 * Visual effects system including particles and floating text.
 */

import { gameState } from './globals.js';
import { randomRange } from './utils.js';

export class Particle {
    constructor(x, y, color, type = 'pixel') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = randomRange(-3, 3);
        this.vy = randomRange(-3, 3);
        this.life = 1.0;
        this.decay = randomRange(0.02, 0.05);
        this.size = randomRange(2, 5);
        this.type = type; // 'pixel', 'circle', 'spark'
        this.gravity = 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        
        if (this.type === 'pixel') {
            p.rect(this.x, this.y, this.size, this.size);
        } else if (this.type === 'circle') {
            p.circle(this.x, this.y, this.size);
        } else if (this.type === 'spark') {
            p.translate(this.x, this.y);
            p.rotate(p.frameCount * 0.5);
            p.rect(0, 0, this.size, this.size * 3);
            p.rect(0, 0, this.size * 3, this.size);
        }
        p.pop();
    }
}

export class FloatingText {
    constructor(x, y, text, color, size = 16) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.vy = -2;
        this.life = 1.0;
        this.decay = 0.02;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.9; // Slow down
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(this.size);
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.stroke(0, this.life * 255);
        p.strokeWeight(2);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function createBlood(x, y, count) {
    for (let i = 0; i < count; i++) {
        const p = new Particle(x, y, [200, 20, 20]);
        p.size = randomRange(3, 6);
        gameState.particles.push(p);
    }
}

export function spawnFloatingText(x, y, text, color) {
    gameState.floatingTexts.push(new FloatingText(x, y, text, color));
}