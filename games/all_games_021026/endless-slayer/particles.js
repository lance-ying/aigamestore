/**
 * Particle system for visual effects.
 */
import { gameState, ENTITY_TYPES } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'dust', 'blood', 'magic', 'spark', 'text'
        this.dead = false;
        
        // Defaults
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 60;
        this.maxLife = 60;
        this.size = 5;
        this.color = [255, 255, 255];
        this.gravity = 0;
        this.text = "";
        
        // Customization
        this.initType();
    }
    
    initType() {
        switch(this.type) {
            case 'dust':
                this.color = [150, 150, 150];
                this.vy = -1 - Math.random();
                this.life = 30;
                this.size = Math.random() * 6 + 2;
                break;
            case 'blood':
                this.color = [200, 0, 0];
                this.gravity = 0.2;
                this.life = 45;
                this.size = Math.random() * 4 + 2;
                break;
            case 'magic':
                this.color = [0, 200, 255];
                this.vx *= 0.5;
                this.vy *= 0.5;
                this.life = 20;
                break;
            case 'spark':
                this.color = [255, 255, 0];
                this.vx *= 2;
                this.vy *= 2;
                this.life = 15;
                break;
            case 'text':
                this.vy = -1;
                this.vx = 0;
                this.life = 40;
                this.color = [255, 255, 255];
                break;
            case 'level_up':
                this.vy = -2;
                this.vx = 0;
                this.life = 60;
                this.color = [255, 215, 0];
                this.text = "LEVEL UP!";
                break;
        }
        this.maxLife = this.life;
    }
    
    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        
        if (this.life <= 0) {
            this.dead = true;
        }
    }
    
    render(p) {
        const alpha = p.map(this.life, 0, this.maxLife, 255, 0);
        
        if (this.type === 'text' || this.type === 'level_up') {
            p.push();
            p.textAlign(p.CENTER);
            p.textSize(12);
            if (this.type === 'level_up') p.textSize(16);
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.stroke(0, alpha);
            p.strokeWeight(2);
            p.text(this.text, this.x, this.y);
            p.pop();
        } else {
            p.push();
            p.noStroke();
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.rectMode(p.CENTER);
            p.rect(this.x, this.y, this.size, this.size);
            p.pop();
        }
    }
}

export function createExplosion(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

export function createFloatingText(x, y, text, color=[255,255,255]) {
    const p = new Particle(x, y, 'text');
    p.text = text;
    p.color = color;
    gameState.particles.push(p);
}