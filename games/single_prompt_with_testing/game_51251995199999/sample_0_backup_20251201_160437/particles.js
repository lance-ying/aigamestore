import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, color, speed, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.initialSize = size;
        this.life = life;
        this.maxLife = life;
        
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Add minimal gravity/friction
        this.friction = 0.95;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.life--;
        this.size = (this.life / this.maxLife) * this.initialSize;
    }
    
    render(p) {
        p.push();
        p.noStroke();
        p.fill(this.color);
        p.circle(this.x, this.y - gameState.cameraY, this.size);
        p.pop();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    spawnExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, 3, 5, 30));
        }
    }
    
    spawnTrail(x, y, color) {
        // Square particle for trail
        const p = new Particle(x, y, color, 0.5, 10, 15);
        p.render = function(p5) {
            p5.push();
            p5.noStroke();
            // Alpha fade
            const alpha = Math.floor((this.life / this.maxLife) * 150);
            const c = p5.color(this.color);
            c.setAlpha(alpha);
            p5.fill(c);
            p5.rectMode(p5.CENTER);
            p5.rect(this.x, this.y - gameState.cameraY, this.size, this.size);
            p5.pop();
        };
        this.particles.push(p);
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(p) {
        this.particles.forEach(pt => pt.render(p));
    }
}

export const particleSystem = new ParticleSystem();