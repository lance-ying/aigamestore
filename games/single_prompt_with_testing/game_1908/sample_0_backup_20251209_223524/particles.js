/**
 * particles.js
 * Particle system for visual effects.
 */

import { gridToScreen } from './iso.js';
import { gameState, ANIMATION_SPEED } from './globals.js';

export class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.life = 0;
        this.maxLife = 60;
        this.color = [255, 255, 255];
        this.size = 2;
        this.active = false;
    }
    
    spawn(x, y, z, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = color || [255, 255, 255];
        this.vx = (Math.random() - 0.5) * 0.1;
        this.vy = (Math.random() - 0.5) * 0.1;
        this.vz = (Math.random()) * 0.05;
        this.life = this.maxLife;
        this.active = true;
    }
    
    update() {
        if (!this.active) return;
        
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        
        this.life--;
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    render(p, cameraX, cameraY) {
        if (!this.active) return;
        
        const pos = gridToScreen(this.x, this.y, this.z);
        const alpha = (this.life / this.maxLife) * 255;
        
        p.push();
        p.translate(pos.x + cameraX, pos.y + cameraY);
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.noStroke();
        p.circle(0, 0, this.size);
        p.pop();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            this.particles.push(new Particle());
        }
    }
    
    emit(x, y, z, count = 5, color = [255, 255, 255]) {
        let spawned = 0;
        for (const p of this.particles) {
            if (!p.active) {
                p.spawn(x, y, z, color);
                spawned++;
                if (spawned >= count) break;
            }
        }
    }
    
    update() {
        for (const p of this.particles) {
            p.update();
        }
    }
    
    render(p, cameraX, cameraY) {
        for (const p of this.particles) {
            p.render(p, cameraX, cameraY);
        }
    }
}