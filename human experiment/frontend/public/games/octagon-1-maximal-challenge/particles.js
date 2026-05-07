/**
 * Particle system for visual effects.
 */
import { project3D, lerp } from './math_utils.js';
import { gameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

class Particle {
    constructor(x, y, z, type = 'spark') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.vz = type === 'speed_line' ? -50 : (Math.random() * 10 - 5);
        
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.01;
        this.type = type; // 'spark', 'speed_line', 'explosion'
        
        if (type === 'speed_line') {
            this.x = (Math.random() - 0.5) * CANVAS_WIDTH * 2;
            this.y = (Math.random() - 0.5) * CANVAS_HEIGHT * 2;
            this.z = 1000;
            this.decay = 0.05;
            this.color = [255, 255, 255];
        } else if (type === 'explosion') {
            this.color = [255, 100, 0];
        } else {
            this.color = [255, 255, 0];
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        
        // Speed lines move towards camera
        if (this.type === 'speed_line') {
            this.z -= gameState.currentSpeed * 2;
            if (this.z < 10) this.life = 0;
        } else {
            this.life -= this.decay;
        }
    }

    render(p) {
        if (this.z <= -500) return;
        
        const proj = project3D(this.x, this.y, this.z);
        
        // Don't draw if off screen
        if (proj.x < 0 || proj.x > CANVAS_WIDTH || proj.y < 0 || proj.y > CANVAS_HEIGHT) return;

        p.noStroke();
        const alpha = this.life * 255;
        
        if (this.type === 'speed_line') {
            const prevProj = project3D(this.x, this.y, this.z + 50);
            p.stroke(this.color[0], this.color[1], this.color[2], alpha * 0.5);
            p.strokeWeight(2);
            p.line(proj.x, proj.y, prevProj.x, prevProj.y);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            const size = (this.type === 'explosion' ? 20 : 5) * proj.scale;
            p.circle(proj.x, proj.y, size);
        }
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, z, count, type) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, z, type));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(p) {
        // Sort by Z for correct depth rendering (painters algorithm)
        this.particles.sort((a, b) => b.z - a.z);
        this.particles.forEach(pt => pt.render(p));
    }
}