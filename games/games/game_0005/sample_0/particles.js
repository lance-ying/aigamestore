// particles.js
import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // "DUST", "SPARKLE", "DEATH"
        this.age = 0;
        this.lifetime = 60;
        
        if (type === "DUST") {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 5 + 2;
            this.color = [200, 200, 200, 100];
            this.decay = 0.5;
        } else if (type === "SPARKLE") {
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1 - 1; // Float up
            this.size = Math.random() * 8 + 4;
            this.color = [255, 255, 100, 200];
            this.decay = 2;
        } else if (type === "DEATH") {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.size = Math.random() * 6 + 3;
            this.color = [50, 150, 100, 255];
            this.decay = 1;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        
        // Type specific updates
        if (this.type === "DUST") {
            this.size *= 0.95;
            this.vy *= 0.95;
        } else if (this.type === "SPARKLE") {
            this.size *= 0.95;
            this.vx *= 0.9;
        } else if (this.type === "DEATH") {
            this.vy += 0.2; // Gravity for debris
        }
    }
    
    isDead() {
        return this.age >= this.lifetime || this.size < 0.5;
    }
    
    render(p) {
        p.push();
        p.noStroke();
        
        const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
        
        if (this.type === "SPARKLE") {
            // Draw star shape
            p.translate(this.x, this.y);
            p.rotate(this.age * 0.1);
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.beginShape();
            for(let i=0; i<5; i++) {
                let angle = p.TWO_PI * i / 5;
                let r1 = this.size;
                let r2 = this.size / 2;
                p.vertex(Math.cos(angle) * r1, Math.sin(angle) * r1);
                p.vertex(Math.cos(angle + p.PI/5) * r2, Math.sin(angle + p.PI/5) * r2);
            }
            p.endShape(p.CLOSE);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.circle(this.x, this.y, this.size);
        }
        
        p.pop();
    }
}

export function createExplosion(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}