/**
 * Particle system for visual effects.
 */

import { gameState } from './globals.js';
import { worldToScreen } from './physics.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;
        this.type = type; // 'crumb', 'sparkle', 'dust'
        
        switch(type) {
            case 'crumb':
                this.color = [210, 180, 140]; // Light brown
                this.size = Math.random() * 6 + 2;
                this.vy -= 2; // Initial pop up
                break;
            case 'sparkle':
                this.color = [255, 255, 0];
                this.size = Math.random() * 4 + 1;
                this.decay = 0.05;
                break;
            case 'dust':
                this.color = [200, 200, 200];
                this.size = Math.random() * 8 + 4;
                this.vx *= 0.2; // Move slower
                this.vy = -1; // Float up
                break;
            default:
                this.color = [255, 255, 255];
                this.size = 4;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'crumb') {
            this.vy += 0.2; // Gravity
        }
    }

    render(p) {
        const pos = worldToScreen(this.x, this.y);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        
        if (this.type === 'sparkle') {
            p.push();
            p.translate(pos.x, pos.y);
            p.rotate(p.frameCount * 0.2);
            p.rect(0, 0, this.size, this.size); // Rotating rect for sparkle
            p.pop();
        } else {
            p.circle(pos.x, pos.y, this.size);
        }
    }

    isDead() {
        return this.life <= 0;
    }
}

export function createExplosion(x, y, count = 10, type = 'crumb') {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}