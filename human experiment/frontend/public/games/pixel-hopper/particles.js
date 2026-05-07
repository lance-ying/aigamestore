import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'DUST', 'EXPLOSION'
        this.age = 0;
        
        if (type === 'DUST') {
            this.lifetime = 20;
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1;
            this.size = Math.random() * 4 + 2;
            this.color = [255, 255, 255, 200];
        } else if (type === 'EXPLOSION') {
            this.lifetime = 40;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.size = Math.random() * 8 + 4;
            this.color = [255, Math.random() * 100, 0, 255];
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        
        if (this.type === 'DUST') {
            this.color[3] = 200 * (1 - this.age/this.lifetime);
        } else if (this.type === 'EXPLOSION') {
            this.color[3] = 255 * (1 - this.age/this.lifetime);
            this.vy += 0.2; // Gravity
        }
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color);
        p.circle(this.x, this.y, this.size);
    }
}

export class ParticleSystem {
    constructor(x, y, type) {
        this.particles = [];
        const count = type === 'EXPLOSION' ? 20 : 5;
        
        for(let i=0; i<count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
        
        gameState.particles.push(this);
    }
    
    update() {
        for(let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].age >= this.particles[i].lifetime) {
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