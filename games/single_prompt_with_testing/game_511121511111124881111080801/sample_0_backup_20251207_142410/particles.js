/**
 * Cavern Tale - Particle System
 * Visual effects for shooting, explosions, jumping, and UI elements.
 */

import { gameState, PALETTE } from './globals.js';

class Particle {
    constructor(x, y, color, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.lifetime = life;
        this.age = 0;
        this.dead = false;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 4 + 2;
        this.gravity = 0;
        this.friction = 0.95;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.age++;
        if (this.age >= this.lifetime) {
            this.dead = true;
        }
    }

    render(p) {
        const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.rect(this.x, this.y, this.size, this.size);
        p.pop();
    }
}

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.lifetime = 60;
        this.age = 0;
        this.dead = false;
        this.vy = -1; // Float up
    }

    update() {
        this.y += this.vy;
        this.age++;
        if (this.age >= this.lifetime) this.dead = true;
    }

    render(p) {
        const alpha = p.map(this.age, this.lifetime - 20, this.lifetime, 255, 0);
        p.push();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export function createExplosion(x, y, count = 10, color = [255, 255, 255]) {
    for (let i = 0; i < count; i++) {
        const p = new Particle(x, y, color, 30 + Math.random() * 20);
        p.vx = (Math.random() - 0.5) * 6;
        p.vy = (Math.random() - 0.5) * 6;
        gameState.particles.push(p);
    }
}

export function createSpark(x, y) {
    const p = new Particle(x, y, [255, 255, 0], 10);
    p.size = 2;
    gameState.particles.push(p);
}

export function createDamageNumber(x, y, amount) {
    const ft = new FloatingText(x, y - 10, "-" + amount, PALETTE.PLAYER_CAP);
    gameState.floatingTexts.push(ft);
}

export function createLevelUpText(x, y) {
    const ft = new FloatingText(x, y - 20, "LEVEL UP!", PALETTE.EXP_TRIANGLE);
    ft.lifetime = 120;
    gameState.floatingTexts.push(ft);
}