/**
 * Particle System Module
 * 
 * Handles visual effects for attacks, hits, movement, and elemental powers.
 */

import { gameState } from './globals.js';

/**
 * Base Particle Class
 */
export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'fire', 'smoke', 'spark', 'dust'
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0; // 1.0 to 0.0
        this.decay = 0.03;
        this.size = Math.random() * 5 + 3;
        this.color = [255, 255, 255];
        
        this.setupType();
    }
    
    setupType() {
        switch(this.type) {
            case 'fire':
                this.color = [255, 100 + Math.random() * 100, 0];
                this.vy -= 1; // Rise up
                this.decay = 0.05;
                break;
            case 'smoke':
                const gray = 100 + Math.random() * 50;
                this.color = [gray, gray, gray];
                this.vy -= 0.5;
                this.size = 8;
                this.decay = 0.02;
                break;
            case 'spark':
                this.color = [255, 255, 100];
                this.vx *= 3; // Fast burst
                this.vy *= 3;
                this.decay = 0.1; // Short life
                break;
            case 'dust':
                this.color = [200, 190, 180];
                this.vy = 0;
                this.vx *= 0.5;
                this.size = 6;
                this.decay = 0.04;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Type specific physics
        if (this.type === 'fire') {
            this.size *= 0.95; // Shrink
        } else if (this.type === 'smoke') {
            this.size *= 1.05; // Expand
        }
        
        this.life -= this.decay;
    }
    
    render(p) {
        if (this.life <= 0) return;
        
        p.push();
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}

/**
 * Spawns a burst of particles at a location.
 * @param {number} x 
 * @param {number} y 
 * @param {string} type 
 * @param {number} count 
 */
export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}

/**
 * Manages the particle lifecycle loop.
 * @param {object} p - p5 instance
 */
export function updateAndRenderParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.update();
        particle.render(p);
        
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}