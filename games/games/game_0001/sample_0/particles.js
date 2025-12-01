import { COLORS } from './globals.js';

export class Particle {
    constructor(x, y, color, speed = 2, life = 40) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.95; // shrink
    }

    render(p) {
        p.noStroke();
        let alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function createExplosion(x, y, color, count, gameState) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}