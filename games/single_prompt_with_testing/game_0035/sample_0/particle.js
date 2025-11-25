// particle.js - Particle effects

import { gameState } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, size, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.vx *= 0.98; // air resistance
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.dead = true;
    }
  }

  render(p) {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export function createExplosion(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = 3 + Math.random() * 4;
    const lifetime = 20 + Math.floor(Math.random() * 20);
    
    gameState.particles.push(new Particle(x, y, vx, vy, size, color, lifetime));
  }
}

export function createHitEffect(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = 2 + Math.random() * 3;
    const lifetime = 15 + Math.floor(Math.random() * 15);
    
    gameState.particles.push(new Particle(x, y, vx, vy, size, color, lifetime));
  }
}