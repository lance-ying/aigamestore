import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        
        switch(type) {
            case 'dust':
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = 3 + Math.random() * 5;
                this.color = [200, 200, 200];
                break;
            case 'spark':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.size = 2 + Math.random() * 3;
                this.color = [255, 255, 100];
                this.decay = 0.05;
                break;
            case 'blood':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.size = 4 + Math.random() * 4;
                this.color = [200, 50, 50];
                break;
            case 'magic':
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 1) * 2; // Upward
                this.size = 5;
                this.color = [100, 200, 255];
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if(this.type === 'dust') {
            this.size *= 0.95;
        }
    }
    
    render(p) {
        const alpha = this.life * 255;
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function spawnParticles(x, y, type, count) {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function createDamageText(x, y, amount) {
    // Implemented as a special particle type if needed, or separate UI element
    // For simplicity, we'll just flash the enemy
}