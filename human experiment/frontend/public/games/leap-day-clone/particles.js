/**
 * Particle system for visual effects
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, speed, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
    }

    isDead() {
        return this.life <= 0;
    }

    render(p) {
        const alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.noStroke();
        
        // Handle hex colors or p5 color objects
        if (typeof this.color === 'string') {
            const c = p.color(this.color);
            c.setAlpha(alpha);
            p.fill(c);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
        }
        
        p.circle(this.x, this.y, this.size);
    }
}

export function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(
            x, y, 
            color, 
            5, // Speed
            Math.random() * 4 + 2, // Size
            30 + Math.random() * 20 // Life
        ));
    }
}

export function spawnJumpDust(x, y) {
    spawnParticles(x, y, 5, '#ECF0F1');
}

export function spawnCollectEffect(x, y) {
    spawnParticles(x, y, 10, '#E67E22');
}