/**
 * Particle system for visual effects.
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'SPARK', 'DUST', 'LINE'
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
        this.size = Math.random() * 5 + 2;
        this.color = [255, 255, 255];
        
        if (type === 'SPARK') {
            this.color = [255, 255, 100];
            this.vx *= 2;
            this.vy *= 2;
        } else if (type === 'DUST') {
            this.color = [200, 200, 200];
            this.vy = Math.random() * -1; // float up
        } else if (type === 'BLOOD') {
            this.color = [255, 50, 50];
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // Physics for some particles
        if (this.type === 'BLOOD' || this.type === 'SPARK') {
            this.vy += 0.2; // Gravity
        }
    }
    
    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        if (this.type === 'LINE') {
            p.stroke(this.color[0], this.color[1], this.color[2], this.life * 255);
            p.strokeWeight(2);
            p.line(this.x, this.y, this.x - this.vx*3, this.y - this.vy*3);
        } else {
            p.circle(this.x, this.y, this.size * this.life);
        }
        p.pop();
    }
}

export function createExplosion(x, y, count = 10, type = 'SPARK') {
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}