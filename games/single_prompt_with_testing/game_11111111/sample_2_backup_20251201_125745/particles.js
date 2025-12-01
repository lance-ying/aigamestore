import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;
        
        switch(type) {
            case 'BLOOD':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.life = 30 + Math.random() * 20;
                this.size = Math.random() * 4 + 2;
                this.color = [200, 0, 0];
                this.gravity = 0.3;
                break;
            case 'CELL':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 1) * 2;
                this.life = 60;
                this.size = 3;
                this.color = [100, 200, 255];
                this.gravity = 0;
                break;
            case 'JUMP_DUST':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = 0;
                this.life = 20;
                this.size = Math.random() * 5 + 3;
                this.color = [200, 200, 200, 150];
                this.gravity = -0.1;
                break;
            case 'FLAME':
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = -Math.random() * 2 - 1;
                this.life = 15;
                this.size = Math.random() * 4 + 2;
                this.color = [255, 150, 50, 200];
                this.gravity = 0;
                break;
            default:
                this.vx = 0;
                this.vy = 0;
                this.life = 1;
                this.size = 1;
                this.color = [255, 255, 255];
        }
        
        this.maxLife = this.life;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'BLOOD') this.vy += this.gravity;
        if (this.type === 'JUMP_DUST') this.size *= 0.9;
        
        this.life--;
        if (this.life <= 0) this.markedForDeletion = true;
    }
    
    render(p) {
        p.push();
        p.noStroke();
        
        // Alpha fade
        let alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        if (this.color.length === 4) alpha = Math.min(alpha, this.color[3]); // Use preset alpha if lower
        
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === 'CELL') {
            p.circle(this.x, this.y, this.size);
        } else {
            p.rect(this.x, this.y, this.size, this.size);
        }
        p.pop();
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}