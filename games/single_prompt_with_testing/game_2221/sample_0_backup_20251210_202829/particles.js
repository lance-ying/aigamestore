/**
 * particles.js
 * Visual effects system.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05;
        this.type = type; // "EXPLOSION", "DUST", "SPARK", "TEXT"
        
        if (type === "EXPLOSION") {
            this.size = 10 + Math.random() * 20;
            this.color = [...COLORS.ENEMY_MAIN];
            this.vx *= 2;
            this.vy *= 2;
            this.decay = 0.03;
        } else if (type === "DUST") {
            this.size = 5 + Math.random() * 5;
            this.color = [200, 200, 200, 150];
            this.vy = -Math.random() * 2;
            this.decay = 0.08;
        } else if (type === "SPARK") {
            this.size = 3;
            this.color = [255, 255, 100];
            this.vx *= 3;
            this.vy *= 3;
            this.decay = 0.1;
        } else if (type === "HOOK_TRAIL") {
            this.size = 4;
            this.color = [...COLORS.HOOK];
            this.decay = 0.15;
            this.vx = 0;
            this.vy = 0;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === "EXPLOSION") {
            this.size *= 0.95;
        }
    }

    render(p) {
        if (this.life <= 0) return;
        
        p.push();
        p.noStroke();
        
        const alpha = this.life * 255;
        
        if (this.type === "EXPLOSION") {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.circle(this.x, this.y, this.size);
        } else if (this.type === "SPARK") {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.circle(this.x, this.y, this.size);
        }
        
        p.pop();
    }
}

export class FloatingText extends Particle {
    constructor(x, y, text, color) {
        super(x, y, "TEXT");
        this.text = text;
        this.color = color || [255, 255, 255];
        this.vy = -2;
        this.vx = 0;
        this.decay = 0.02;
        this.size = 14;
    }

    render(p) {
        p.push();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(this.size);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export function spawnExplosion(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, "EXPLOSION"));
    }
}

export function spawnSparks(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, "SPARK"));
    }
}

export function spawnDust(x, y) {
    for (let i = 0; i < 3; i++) {
        gameState.particles.push(new Particle(x, y, "DUST"));
    }
}