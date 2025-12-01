import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, speed, life) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 2;
        this.drag = 0.95;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.life--;
    }

    render(p) {
        const alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60;
        this.vy = -1;
    }

    update() {
        this.y += this.vy;
        this.life--;
    }

    render(p) {
        const alpha = p.map(this.life, 0, 60, 0, 255);
        p.push();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, Math.random() * 3 + 1, 30 + Math.random() * 20));
    }
}