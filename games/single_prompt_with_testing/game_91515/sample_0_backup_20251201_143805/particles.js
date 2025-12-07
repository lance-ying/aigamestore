import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.05;
        
        if (type === 'EXPLOSION') {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.size = Math.random() * 15 + 5;
            this.color = [255, 200, 0];
        } else if (type === 'SMOKE') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 2 - 1;
            this.size = Math.random() * 8 + 4;
            this.color = [100, 100, 100];
            this.decay = 0.02;
        } else if (type === 'JUMP_DUST') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = 0;
            this.size = Math.random() * 6 + 2;
            this.color = [200, 200, 200];
            this.decay = 0.1;
        } else if (type === 'SPARK') {
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
            this.size = 3;
            this.color = [0, 255, 255];
            this.decay = 0.1;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'EXPLOSION') {
            this.size *= 0.9;
        } else if (this.type === 'SMOKE') {
            this.size *= 1.05;
            this.vx *= 0.9;
        }
    }
    
    render(p) {
        if (this.life <= 0) return;
        
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        
        if (this.type === 'SPARK') {
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size);
        }
        
        p.pop();
    }
}

export function spawnExplosion(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, 'EXPLOSION'));
    }
    for (let i = 0; i < count / 2; i++) {
        gameState.particles.push(new Particle(x, y, 'SMOKE'));
    }
}