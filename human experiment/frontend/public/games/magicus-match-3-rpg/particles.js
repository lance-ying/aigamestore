import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, color, type = 'spark') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'gravity') {
            this.vy += 0.2;
        }
    }

    render(p) {
        p.push();
        p.noStroke();
        
        // Extract RGB to handle alpha
        const c = p.color(this.color);
        p.fill(p.red(c), p.green(c), p.blue(c), this.life * 255);
        
        if (this.type === 'spark') {
            p.circle(this.x, this.y, this.size * this.life);
        } else if (this.type === 'square') {
            p.rectMode(p.CENTER);
            p.rect(this.x, this.y, this.size * this.life, this.size * this.life);
        }
        
        p.pop();
    }
}

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.vy = -1;
        this.life = 1.0;
        this.decay = 0.015;
    }

    update() {
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.fill(this.color); // Should implement fade out logic if color was object
        // p5 text transparency with simple hex strings isn't direct, so we assume solid or use rgba
        // For simplicity, just solid color that moves up
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.stroke(0);
        p.strokeWeight(2);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

export function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, 'gravity'));
    }
}

export function createFloatingText(x, y, text, color) {
    gameState.floatingTexts.push(new FloatingText(x, y, text, color));
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
    
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
        gameState.floatingTexts[i].update();
        if (gameState.floatingTexts[i].life <= 0) {
            gameState.floatingTexts.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(pt => pt.render(p));
    gameState.floatingTexts.forEach(ft => ft.render(p));
}