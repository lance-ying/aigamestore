/**
 * particles.js
 * Handles visual effects like dust, hits, blood, and damage numbers.
 */

import { gameState, COLORS, GRAVITY } from './globals.js';

export class Particle {
    constructor(x, y, z, type) {
        this.x = x;
        this.y = y; // Depth position
        this.z = z; // Altitude
        this.type = type;
        this.life = 1.0;
        this.decay = 0.05;
        this.vx = (Math.random() - 0.5) * 4;
        this.vz = Math.random() * 5; // Initial pop up
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 5 + 3;
        
        switch (type) {
            case 'blood':
                this.color = COLORS.blood;
                this.gravity = 0.5;
                this.decay = 0.03;
                break;
            case 'dust':
                this.color = [200, 200, 200, 150];
                this.gravity = 0;
                this.vx *= 0.5;
                this.vz = Math.random() * 2;
                this.decay = 0.08;
                break;
            case 'spark':
                this.color = [255, 255, 100];
                this.gravity = 0.3;
                this.decay = 0.1;
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        
        if (this.gravity) {
            this.vz -= this.gravity;
        }

        // Ground collision for particles
        if (this.z < 0) {
            this.z = 0;
            this.vx *= 0.5;
            this.vy *= 0.5;
            this.vz = 0;
        }

        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;
        
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - this.z - gameState.cameraY;
        
        p.push();
        p.noStroke();
        
        if (this.type === 'dust') {
            p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
            p.circle(screenX, screenY, this.size * this.life);
        } else {
            p.fill(this.color);
            p.circle(screenX, screenY, this.size);
        }
        
        p.pop();
    }
}

export class DamageNumber {
    constructor(x, y, z, value, isCrit) {
        this.x = x;
        this.y = y;
        this.z = z + 50; // Start above head
        this.value = Math.floor(value);
        this.isCrit = isCrit;
        this.life = 1.0;
        this.vy = 2; // Float up speed
    }

    update() {
        this.z += this.vy;
        this.vy *= 0.9;
        this.life -= 0.02;
    }

    render(p) {
        if (this.life <= 0) return;

        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - this.z - gameState.cameraY;

        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        
        if (this.isCrit) {
            p.textSize(24);
            p.fill(COLORS.crit);
            p.stroke(0);
            p.strokeWeight(3);
            p.text(this.value + "!", screenX, screenY);
        } else {
            p.textSize(16);
            p.fill(COLORS.damage);
            p.stroke(0);
            p.strokeWeight(2);
            p.text(this.value, screenX, screenY);
        }
        p.pop();
    }
}

export function spawnParticles(x, y, z, count, type) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, z, type));
    }
}

export function spawnDamageNumber(x, y, z, value, isCrit) {
    gameState.particles.push(new DamageNumber(x, y, z, value, isCrit));
}