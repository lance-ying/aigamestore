// particles.js - Particle effects system
import { gameState } from './globals.js';

export class Particle {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-2, 2);
    this.vy = p.random(-3, -1);
    this.life = 1.0;
    this.size = p.random(4, 10);
    this.color = [
      p.random(150, 255),
      p.random(200, 255),
      p.random(100, 200)
    ];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.life -= 0.02;
  }

  draw() {
    const p = this.p;
    p.push();
    p.noStroke();
    p.fill(...this.color, this.life * 255);
    p.ellipse(this.x, this.y, this.size);
    p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

export function createHealingParticles(p, x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    gameState.particles.push(new Particle(p, x, y));
  }
}