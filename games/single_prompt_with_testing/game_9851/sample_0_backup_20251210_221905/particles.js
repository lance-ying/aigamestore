/**
 * Particle system for visual effects.
 */

import { gameState } from './globals.js';

class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.vy += 0.05; // Light gravity
    }

    render(p) {
        const alpha = (this.life / this.maxLife) * 255;
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function updateParticles(p) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const part = gameState.particles[i];
        part.update();
        if (part.life <= 0) {
            gameState.particles.splice(i, 1);
        } else {
            part.render(p);
        }
    }
}

export function createBloodEffect(x, y, amount = 10, color = [180, 0, 0]) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3;
        gameState.particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            randomInt(10, 30),
            randomInt(2, 5)
        ));
    }
}

export function createDustEffect(x, y, color = [200, 200, 200]) {
    gameState.particles.push(new Particle(
        x, y,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1,
        color,
        randomInt(10, 20),
        randomInt(3, 6)
    ));
}

export function createSparkle(x, y) {
    for (let i = 0; i < 5; i++) {
        gameState.particles.push(new Particle(
            x, y,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            [255, 255, 0],
            20,
            2
        ));
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}