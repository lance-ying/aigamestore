import { gameState } from './globals.js';

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color; // [r, g, b]
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(p, camX, camY) {
        let screenX = this.x - camX;
        let screenY = this.y - camY;
        let alpha = (this.life / this.maxLife) * 255;
        
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(screenX, screenY, this.size);
        p.pop();
    }
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p, camX, camY) {
    gameState.particles.forEach(pt => pt.render(p, camX, camY));
}

export function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 3 + 1;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        gameState.particles.push(new Particle(x, y, vx, vy, color, Math.random() * 5 + 2, 30));
    }
}

export function createSparkle(x, y, color) {
    for (let i = 0; i < 5; i++) {
        let vx = (Math.random() - 0.5) * 2;
        let vy = (Math.random() - 0.5) * 2 - 1;
        gameState.particles.push(new Particle(x, y, vx, vy, color, 3, 20));
    }
}