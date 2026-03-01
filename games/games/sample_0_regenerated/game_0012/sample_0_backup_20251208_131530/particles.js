/**
 * Particle system for visual effects.
 * Includes Dash trails, Snow, and Dust.
 */

import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.age = 0;
        this.dead = false;
        
        // Defaults
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 60;
        this.size = 3;
        this.color = [255, 255, 255];
        this.alpha = 255;
        
        this.initType();
    }
    
    initType() {
        switch(this.type) {
            case 'SNOW':
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = Math.random() * 1 + 0.5;
                this.life = 300;
                this.size = Math.random() * 2 + 1;
                this.color = COLORS.snow;
                break;
            case 'DUST':
                this.vx = (Math.random() - 0.5);
                this.vy = (Math.random() * -0.5);
                this.life = 20;
                this.size = Math.random() * 4 + 2;
                this.color = [200, 200, 200];
                break;
            case 'DASH_TRAIL':
                this.life = 15;
                this.alpha = 150;
                this.vx = 0;
                this.vy = 0;
                break;
            case 'COLLECT':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.life = 30;
                this.color = [255, 255, 100];
                this.size = 4;
                break;
            case 'DEATH':
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.life = 45;
                this.color = COLORS.player_idle;
                this.size = 6;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        
        if (this.age >= this.life) {
            this.dead = true;
        }
        
        if (this.type === 'SNOW') {
            if (this.y > gameState.cameraY + 400) {
                this.y = gameState.cameraY - 10;
                this.x = Math.random() * 600;
            }
        }
    }
    
    render(p) {
        if (this.dead) return;
        
        p.push();
        let a = p.map(this.age, 0, this.life, this.alpha, 0);
        
        // Handle specialized rendering
        if (this.type === 'DASH_TRAIL') {
             // Trail is a rect
             p.noStroke();
             p.fill(this.color[0], this.color[1], this.color[2], a);
             p.rect(this.x, this.y, this.w || 20, this.h || 20);
        } else {
            p.noStroke();
            p.fill(this.color[0], this.color[1], this.color[2], a);
            p.circle(this.x, this.y, this.size);
        }
        p.pop();
    }
}

export function createParticle(x, y, type, options = {}) {
    const p = new Particle(x, y, type);
    if (options.color) p.color = options.color;
    if (options.vx) p.vx = options.vx;
    if (options.vy) p.vy = options.vy;
    if (options.w) p.w = options.w;
    if (options.h) p.h = options.h;
    gameState.particles.push(p);
}

export function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].dead && gameState.particles[i].type !== 'SNOW') {
            gameState.particles.splice(i, 1);
        }
    }
}

export function renderParticles(p) {
    gameState.particles.forEach(pt => pt.render(p));
}