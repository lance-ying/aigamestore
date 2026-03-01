/**
 * particle_system.js
 * Handles visual effects, explosions, blood splatters, and hit indicators.
 * Essential for the "Juice" and feel of a brawler game.
 */

import { gameState, DRAG, GRAVITY, COLOR_UI_ACCENT } from './globals.js';

/**
 * Base Particle Class
 */
export class Particle {
    constructor(x, y, type = "NORMAL") {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 5 + Math.random() * 5;
        this.type = type; // NORMAL, BLOOD, SPARK, SMOKE, TEXT
        this.color = [255, 255, 255];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Physics per type
        if (this.type === "BLOOD") {
            this.vy += GRAVITY * 0.5; // Blood drips
            this.vx *= 0.95;
        } else if (this.type === "SPARK") {
            this.vy += GRAVITY * 0.2;
            this.vx *= DRAG;
        } else if (this.type === "SMOKE") {
            this.vy -= 0.05; // Smoke rises
            this.vx *= 0.9;
        }

        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;

        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        const alpha = this.life * 255;
        
        if (this.type === "BLOOD") {
            p.noStroke();
            p.fill(200, 0, 0, alpha);
            p.ellipse(0, 0, this.size * this.life, this.size * this.life);
        } else if (this.type === "SPARK") {
            p.noStroke();
            p.fill(255, 255, 100, alpha);
            p.rectMode(p.CENTER);
            p.rect(0, 0, this.size * 0.5, this.size * 2);
        } else if (this.type === "SMOKE") {
            p.noStroke();
            p.fill(100, 100, 100, alpha * 0.5);
            p.circle(0, 0, this.size * 2);
        } else {
            p.noStroke();
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.circle(0, 0, this.size);
        }
        
        p.pop();
    }
}

/**
 * Floating Text Particle (e.g., "Hit!", "Miss!", "100")
 */
export class FloatingText {
    constructor(x, y, text, color = [255, 255, 255], size = 20) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.vy = -2;
        this.life = 1.0;
        this.decay = 0.02;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.9; // Slow down ascent
        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(this.size);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.text(this.text, this.x, this.y);
        p.stroke(0, this.life * 255);
        p.strokeWeight(1);
        p.noFill();
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}

/**
 * Speed Line Effect (Background)
 */
export class SpeedLine {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.length = 50 + Math.random() * 100;
        this.thickness = 1 + Math.random() * 3;
        this.life = 1.0;
        this.decay = 0.05;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;
        p.push();
        p.stroke(255, 255, 255, this.life * 100);
        p.strokeWeight(this.thickness);
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;
        p.line(this.x, this.y, tailX, tailY);
        p.pop();
    }
}

/**
 * Manager functions to spawn effects
 */
export function createExplosion(x, y, type, count = 10) {
    for (let i = 0; i < count; i++) {
        const p = new Particle(x, y, type);
        gameState.particles.push(p);
    }
}

export function createFloatingText(x, y, text, color, size) {
    gameState.floatingTexts.push(new FloatingText(x, y, text, color, size));
}

export function createSpeedLines(p, count = 5) {
    // Spawns lines radiating from center or moving horizontally
    for (let i = 0; i < count; i++) {
        const angle = (Math.random() < 0.5) ? 0 : Math.PI; // Left or Right
        const x = (Math.random() < 0.5) ? 0 : p.width;
        const y = Math.random() * p.height;
        const speed = 20 + Math.random() * 20;
        
        // Adjust angle to point towards center roughly
        const dir = (x === 0) ? 0 : Math.PI; 
        
        gameState.backgroundEffects.push(new SpeedLine(x, y, dir, speed));
    }
}