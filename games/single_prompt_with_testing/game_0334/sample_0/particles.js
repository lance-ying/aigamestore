// particles.js
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.05;
        
        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        if (type === 'BLOOD') {
            this.color = [200, 20, 50];
            this.decay = 0.02;
            this.size = Math.random() * 4 + 2;
        } else if (type === 'SPARK') {
            this.color = [200, 255, 255];
            this.decay = 0.1;
            this.size = Math.random() * 3 + 1;
        } else if (type === 'DUST') {
            this.color = [200, 200, 200, 100];
            this.decay = 0.08;
            this.size = Math.random() * 6 + 2;
        } else if (type === 'GLITCH') {
            this.color = [255, 0, 255];
            this.decay = 0.2;
            this.size = Math.random() * 10 + 2;
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // Friction
        this.vx *= 0.9;
        this.vy *= 0.9;
    }

    render(p) {
        p.push();
        p.noStroke();
        
        // Alpha based on life
        const alpha = Math.floor(this.life * 255);
        
        if (this.type === 'GLITCH') {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.rect(this.x, this.y, this.size, this.size/4);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.circle(this.x, this.y, this.size);
        }
        p.pop();
    }
}

export function createExplosion(x, y, count, type) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export class AfterImage {
    constructor(x, y, w, h, facing, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.facing = facing;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.15;
    }

    update() {
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        if (this.facing < 0) p.scale(-1, 1);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 100);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.w, this.h);
        p.pop();
    }
}