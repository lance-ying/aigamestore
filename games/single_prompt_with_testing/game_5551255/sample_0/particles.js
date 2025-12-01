import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, speed = 1, life = 30) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed * 2;
        this.vy = (Math.random() - 0.5) * speed * 2;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.95;
    }

    render(p) {
        p.noStroke();
        const alpha = (this.life / this.maxLife) * 255;
        p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

export function createTrail(x, y, width, height, color) {
    // Create a stationary fading particle representing the player's shape
    const p = new Particle(x + width/2, y + height/2, color, 0, 15);
    p.size = width * 0.8; // Approximate
    p.vx = 0;
    p.vy = 0;
    gameState.particles.push(p);
}