import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'SMOKE', 'FIRE', 'SPARK', 'SHELL'
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        
        if (type === 'FIRE') {
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = Math.random() * 2 + 1; // Falls down
            this.size = Math.random() * 10 + 5;
            this.color = [255, 100 + Math.random() * 100, 0];
        } else if (type === 'SMOKE') {
            this.vx = -gameState.scrollSpeed + (Math.random() - 0.5); // Moves left with world
            this.vy = (Math.random() - 0.5);
            this.size = Math.random() * 10 + 5;
            this.decay = 0.015;
            this.color = [100, 100, 100];
        } else if (type === 'SPARK') {
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
            this.size = Math.random() * 3 + 1;
            this.color = [255, 255, 0];
            this.decay = 0.05;
        } else if (type === 'SHELL') {
            // Bullet casing
            this.vx = -Math.random() * 3 - 1;
            this.vy = -Math.random() * 3 - 2; // Pop up initially
            this.size = 4;
            this.color = [200, 180, 50];
            this.gravity = 0.4;
            this.decay = 0.01;
        }
    }

    update() {
        if (this.type === 'SHELL') {
            this.vy += this.gravity;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;
        
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        
        if (this.type === 'SHELL') {
             p.translate(this.x, this.y);
             p.rotate(this.life * 10);
             p.rect(0, 0, 3, 6);
        } else {
            p.circle(this.x, this.y, this.size * this.life);
        }
        p.pop();
    }
}

export class ParticleSystem {
    static emit(x, y, type, count = 1) {
        for (let i = 0; i < count; i++) {
            gameState.particles.push(new Particle(x, y, type));
        }
    }

    static updateAndRender(p) {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            let part = gameState.particles[i];
            part.update();
            part.render(p);
            if (part.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }
}