import { gameState } from './globals.js';

/**
 * Particle system for effects.
 */

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05;
        this.color = [255, 255, 255];
        this.size = 5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
    }
}

class TextParticle extends Particle {
    constructor(x, y, text, color) {
        super(x, y);
        this.text = text;
        this.color = color;
        this.vy = -1; // Float up
        this.vx = 0;
        this.decay = 0.02;
        this.size = 20;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.textAlign(p.CENTER);
        p.textSize(this.size);
        p.text(this.text, this.x, this.y);
    }
}

export function createDamageParticle(x, y, amount, isBlocked) {
    if (amount === 0 && isBlocked) {
        gameState.particles.push(new TextParticle(x, y - 40, "BLOCKED", [150, 150, 200]));
    } else {
        gameState.particles.push(new TextParticle(x, y - 40, amount.toString(), [255, 50, 50]));
    }
    
    // Debris
    for(let i=0; i<5; i++) {
        let p = new Particle(x, y);
        p.color = [255, 50, 50];
        gameState.particles.push(p);
    }
}

export function createBlockParticle(x, y, amount) {
    gameState.particles.push(new TextParticle(x, y - 40, "+" + amount + " Block", [100, 100, 255]));
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let p = gameState.particles[i];
        p.update();
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(pt => pt.render(p));
}