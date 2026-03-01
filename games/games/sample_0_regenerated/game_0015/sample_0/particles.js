/**
 * Particle system for visual effects.
 * Includes floating numbers, blood splatters, and skill effects.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, life) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = life;
        this.maxLife = life;
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    render(p) {
        // Override
    }
}

export class FloatingText extends Particle {
    constructor(x, y, text, color, size = 16) {
        super(x, y, 60); // 1 second life
        this.text = text;
        this.color = color;
        this.size = size;
        this.vy = -1.5; // Float up
        this.vx = 0;
    }

    update() {
        super.update();
        this.vy *= 0.95; // Slow down ascent
    }

    render(p) {
        p.push();
        p.textAlign(p.CENTER);
        p.textSize(this.size);
        // Fade out
        const alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.noStroke();
        p.text(this.text, this.x, this.y);
        p.stroke(0, alpha);
        p.strokeWeight(1);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export class BloodParticle extends Particle {
    constructor(x, y, color = [200, 0, 0]) {
        super(x, y, 30 + Math.random() * 20);
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.gravity = 0.2;
    }

    update() {
        super.update();
        this.vy += this.gravity;
        this.size *= 0.95;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], p.map(this.life, 0, this.maxLife, 0, 255));
        p.circle(this.x, this.y, this.size);
    }
}

export class SparkParticle extends Particle {
    constructor(x, y, color = [255, 255, 200]) {
        super(x, y, 15);
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
    }

    update() {
        super.update();
        this.vx *= 0.8;
        this.vy *= 0.8;
    }

    render(p) {
        p.stroke(this.color);
        p.strokeWeight(2);
        p.line(this.x, this.y, this.x - this.vx, this.y - this.vy);
    }
}

export class SlashEffect extends Particle {
    constructor(x, y, angle, size) {
        super(x, y, 10); // Very short life
        this.angle = angle;
        this.size = size;
        this.arcSize = p => p.QUARTER_PI; // Default
        this.color = [200, 230, 255];
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        p.noFill();
        p.stroke(this.color[0], this.color[1], this.color[2], p.map(this.life, 0, this.maxLife, 0, 200));
        p.strokeWeight(3);
        p.strokeCap(p.ROUND);
        
        // Draw an arc slash
        const s = this.size * 1.5;
        p.arc(0, 0, s, s, -p.QUARTER_PI, p.QUARTER_PI);
        
        p.pop();
    }
}

// Helper to spawn text
export function spawnDamageText(x, y, amount, isCrit) {
    const color = isCrit ? COLORS.crit_text : COLORS.damage_text;
    const size = isCrit ? 24 : 16;
    const text = isCrit ? amount + "!" : amount;
    gameState.particles.push(new FloatingText(x, y - 20, text, color, size));
}

export function spawnHealText(x, y, amount) {
    gameState.particles.push(new FloatingText(x, y - 20, "+" + amount, COLORS.heal_text, 18));
}

// Helper to spawn explosion
export function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new BloodParticle(x, y, color));
    }
    for (let i = 0; i < Math.floor(count/2); i++) {
        gameState.particles.push(new SparkParticle(x, y));
    }
}