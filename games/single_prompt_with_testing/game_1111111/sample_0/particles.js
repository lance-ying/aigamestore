/**
 * Visual effects system.
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'dust', 'spark', 'explosion', 'speedline'
        this.age = 0;
        this.dead = false;
        
        // Defaults
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 3 + 2;
        this.color = [255, 255, 255];
        this.alpha = 255;
        this.decay = 5;
        
        this.initType();
    }
    
    initType() {
        switch(this.type) {
            case 'dust':
                this.vy = -0.5 - Math.random();
                this.color = [200, 200, 200];
                this.decay = 8;
                break;
            case 'spark':
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.color = [255, 255, 0];
                this.decay = 15;
                break;
            case 'boost':
                this.vx = -10; // Moves left relative to player
                this.vy = (Math.random() - 0.5);
                this.color = [0, 255, 255];
                this.size = 2;
                this.decay = 10;
                break;
            case 'explosion':
                this.vx = (Math.random() - 0.5) * 15;
                this.vy = (Math.random() - 0.5) * 15;
                this.color = [255, 100, 0];
                this.size = Math.random() * 10 + 5;
                this.decay = 10;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'explosion' || this.type === 'spark') {
            this.vy += 0.2; // Gravity for heavy particles
            this.vx *= 0.95;
        }
        
        this.alpha -= this.decay;
        this.age++;
        
        if (this.alpha <= 0) this.dead = true;
    }
    
    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}