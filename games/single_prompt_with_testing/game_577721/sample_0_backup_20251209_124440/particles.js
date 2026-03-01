/**
 * Particle and Visual Effects System
 */

import { CANVAS_HEIGHT } from './globals.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.05;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }

    render(p) {
        p.noStroke();
        // Add alpha to color
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
    }

    isDead() {
        return this.life <= 0;
    }
}

export class FloatingText {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.vy = -1; // Float up
        this.life = 40; // Frames
        this.maxLife = 40;
    }

    update() {
        this.y += this.vy;
        this.life--;
    }

    render(p) {
        const alpha = (this.life / this.maxLife) * 255;
        p.push();
        p.fill(255, 255, 255, alpha);
        p.stroke(0, 0, 0, alpha);
        p.strokeWeight(2);
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.text(this.text, this.x, this.y);
        p.pop();
    }

    isDead() {
        return this.life <= 0;
    }
}