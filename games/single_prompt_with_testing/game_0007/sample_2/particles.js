import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'DUST', 'EXPLOSION'
        this.life = 1.0;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        
        if (type === 'DUST') {
            this.vy = -Math.random() * 2;
            this.decay = 0.05;
            this.size = Math.random() * 10 + 5;
        } else if (type === 'EXPLOSION') {
            this.decay = 0.02;
            this.size = Math.random() * 20 + 10;
            this.vx *= 3;
            this.vy *= 3;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(p) {
        p.noStroke();
        if (this.type === 'DUST') {
            p.fill(200, 200, 200, this.life * 200);
            p.circle(this.x, this.y, this.size);
        } else if (this.type === 'EXPLOSION') {
            p.fill(255, 100 + this.life * 155, 0, this.life * 255);
            p.star(this.x, this.y, this.size * 0.5, this.size, 5); // Assuming custom p5 extension or helper
            // If no star helper, use circle
            // p.circle(this.x, this.y, this.size);
        }
    }
}

export function createDust(x, y) {
    for (let i = 0; i < 5; i++) {
        gameState.particles.push(new Particle(x, y, 'DUST'));
    }
}

export function createExplosion(x, y, count=10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, 'EXPLOSION'));
    }
}