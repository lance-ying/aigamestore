/**
 * Particle system for visual effects.
 * Handles explosions, dust trails, and sparkle effects.
 */
import { gameState, COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.age = 0;
        
        // Default physics
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        
        // Type specific configuration
        switch(type) {
            case 'EXPLOSION':
                this.life = 40;
                this.size = Math.random() * 8 + 4;
                this.color = COLORS.player_outline;
                this.vy -= 2; // Explode upwards slightly
                this.drag = 0.9;
                break;
            case 'DUST':
                this.life = 20;
                this.size = Math.random() * 5 + 2;
                this.color = '#ffffff';
                this.vy = 0;
                this.vx = (Math.random() - 0.5) * 2;
                this.drag = 0.8;
                break;
            case 'COLLECT':
                this.life = 30;
                this.size = Math.random() * 6 + 2;
                this.color = COLORS.collectible;
                this.speed = 4;
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
                this.drag = 0.92;
                break;
            case 'POWERUP':
                this.life = 60;
                this.size = Math.random() * 4 + 2;
                this.color = COLORS.powerup;
                this.vy = -Math.random() * 2;
                this.drag = 0.95;
                break;
            default:
                this.life = 30;
                this.size = 5;
                this.color = '#fff';
                this.drag = 0.9;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        this.vx *= this.drag;
        this.vy *= this.drag;
        
        this.age++;
        
        if (this.age >= this.life) {
            this.active = false;
        }
    }

    render(p) {
        if (!this.active) return;

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        
        // Don't render if off screen
        if (screenX < -20 || screenX > p.width + 20 || screenY < -20 || screenY > p.height + 20) return;

        const alpha = p.map(this.age, 0, this.life, 255, 0);
        
        p.push();
        p.noStroke();
        
        // Parse hex color to rgb for alpha
        const c = p.color(this.color);
        c.setAlpha(alpha);
        p.fill(c);
        
        if (this.type === 'EXPLOSION' || this.type === 'COLLECT') {
            p.circle(screenX, screenY, this.size);
        } else if (this.type === 'DUST') {
            p.rect(screenX, screenY, this.size, this.size);
        } else {
            p.rect(screenX, screenY, this.size, this.size);
        }
        
        p.pop();
    }
}

export function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}