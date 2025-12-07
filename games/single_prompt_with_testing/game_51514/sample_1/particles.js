/**
 * particles.js
 * Particle system for visual effects.
 */

import { gameState } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'TRAIL', 'EXPLOSION', 'COLLECT', 'GRAVITY'
        this.age = 0;
        this.dead = false;
        
        // Defaults
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = 5;
        this.life = 30;
        this.color = [255, 255, 255];
        this.alpha = 255;
        
        this.initType();
    }
    
    initType() {
        switch(this.type) {
            case 'TRAIL':
                this.life = 15;
                this.size = 8;
                this.color = [0, 255, 255];
                this.vx = 0;
                this.vy = 0;
                break;
            case 'EXPLOSION':
                this.life = 40;
                this.size = Math.random() * 8 + 4;
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.color = [255, 50, 50];
                break;
            case 'COLLECT':
                this.life = 25;
                this.size = 4;
                this.vx = (Math.random() - 0.5) * 5;
                this.vy = (Math.random() - 0.5) * 5;
                this.color = [255, 255, 0];
                break;
            case 'GRAVITY':
                this.life = 20;
                this.size = Math.random() * 20 + 10;
                this.vx = 0;
                this.vy = (gameState.gravityDirection === 1 ? -1 : 1) * 2; // Move opposite to new gravity
                this.color = [100, 100, 255, 100];
                break;
            case 'DASH':
                this.life = 10;
                this.size = 28; // Player size approx
                this.color = [255, 255, 255, 150];
                this.vx = 0;
                this.vy = 0;
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
        
        // Decay alpha
        this.alpha = 255 * (1 - this.age / this.life);
    }
    
    render(p) {
        p.push();
        p.noStroke();
        // Handle array color with alpha
        if (this.color.length === 3) {
            p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], this.color[3] * (this.alpha/255));
        }
        
        if (this.type === 'TRAIL' || this.type === 'DASH') {
            p.rectMode(p.CENTER);
            p.rect(this.x, this.y, this.size, this.size);
        } else {
            p.circle(this.x, this.y, this.size);
        }
        p.pop();
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}