/**
 * Particle system for visual effects.
 * Includes Explosions, Blood, Smoke, and Debris.
 */
import { gameState } from './globals.js';
import { randomRange, randomInt } from './utils.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = randomRange(-3, 3);
        this.vy = randomRange(-3, 3);
        this.life = 1.0; // 1.0 to 0.0
        this.decay = randomRange(0.02, 0.05);
        this.size = randomRange(2, 6);
        this.color = [255, 255, 255];
        this.gravity = 0;
        
        this.initType();
    }
    
    initType() {
        switch(this.type) {
            case 'fire':
                this.color = [255, randomInt(100, 200), 0];
                this.vy = randomRange(-4, -1); // Rise
                this.vx = randomRange(-1, 1);
                this.gravity = -0.05;
                this.decay = 0.03;
                this.size = randomRange(5, 12);
                break;
            case 'smoke':
                this.color = [100, 100, 100];
                this.vy = randomRange(-2, -0.5);
                this.gravity = -0.02;
                this.decay = 0.015;
                this.size = randomRange(5, 15);
                break;
            case 'blood':
                this.color = [200, 0, 0];
                this.gravity = 0.3;
                this.size = randomRange(2, 4);
                break;
            case 'debris':
                this.color = [150, 100, 50]; // Brown/Grey
                this.gravity = 0.4;
                this.size = randomRange(3, 8);
                break;
            case 'spark':
                this.color = [255, 255, 100];
                this.gravity = 0.2;
                this.decay = 0.1;
                this.size = 2;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        
        // Simple ground collision for debris/blood
        if ((this.type === 'debris' || this.type === 'blood') && this.y > 350) { // Rough floor
            this.vy *= -0.5;
            this.vx *= 0.8;
        }
    }
    
    render(p) {
        p.noStroke();
        // Alpha based on life
        const alpha = p.map(this.life, 0, 1, 0, 255);
        
        if (this.type === 'fire') {
            // Fire changes color over life
            p.fill(255, p.map(this.life, 0, 1, 0, 200), 0, alpha);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
        }
        
        if (this.type === 'smoke') {
            p.circle(this.x, this.y, this.size);
        } else {
            p.rect(this.x, this.y, this.size, this.size);
        }
    }
}

/**
 * Spawns an explosion effect
 */
export function spawnExplosion(x, y, scale = 1.0) {
    // Fire
    for (let i = 0; i < 20 * scale; i++) {
        gameState.particles.push(new Particle(x, y, 'fire'));
    }
    // Smoke
    for (let i = 0; i < 15 * scale; i++) {
        gameState.particles.push(new Particle(x, y, 'smoke'));
    }
    // Debris
    for (let i = 0; i < 10 * scale; i++) {
        gameState.particles.push(new Particle(x, y, 'debris'));
    }
    // Sparks
    for (let i = 0; i < 10 * scale; i++) {
        gameState.particles.push(new Particle(x, y, 'spark'));
    }
    
    // Screen shake
    gameState.camera.shakeStrength = 15 * scale;
}

/**
 * Spawns blood effect
 */
export function spawnBlood(x, y, amount = 5) {
    for (let i = 0; i < amount; i++) {
        gameState.particles.push(new Particle(x, y, 'blood'));
    }
}