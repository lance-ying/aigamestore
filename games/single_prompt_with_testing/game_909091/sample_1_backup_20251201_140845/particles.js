import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 30;
        this.color = color;
        this.size = Math.random() * 5 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], (this.life/30) * 255);
        p.circle(this.x, this.y, this.size);
    }
}

export function createParticleExplosion(x, y, color) {
    for(let i=0; i<8; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}