// particles.js - Particle system for visual effects

import { gameState } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.active = true;
  }
  
  update() {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // Gravity
    this.vx *= 0.98; // Air resistance
    this.age++;
    
    if (this.age >= this.lifetime) {
      this.active = false;
    }
  }
  
  render(p) {
    if (!this.active) return;
    
    const alpha = 1 - (this.age / this.lifetime);
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}

export function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    const particle = new Particle(x, y, vx, vy, color);
    gameState.particles.push(particle);
  }
}