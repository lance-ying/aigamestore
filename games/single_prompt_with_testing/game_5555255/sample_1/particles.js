/**
 * Particle systems for visual effects
 */
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.03;
        this.size = Math.random() * 5 + 3;
        
        if (type === 'BOUNCE') {
            this.color = [255, 0, 255];
        } else if (type === 'COLLECT') {
            this.color = [255, 255, 0];
            this.decay = 0.05;
        } else {
            this.color = [200, 200, 200];
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }
    
    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

export class ParticleSystem {
    constructor(x, y, type) {
        this.particles = [];
        let count = 10;
        if (type === 'COLLECT') count = 20;
        
        for(let i=0; i<count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
        
        gameState.particles.push(this); // Self-register
    }
    
    update() {
        for(let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if(this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(p) {
        this.particles.forEach(pt => pt.render(p));
    }
    
    isDead() {
        return this.particles.length === 0;
    }
}