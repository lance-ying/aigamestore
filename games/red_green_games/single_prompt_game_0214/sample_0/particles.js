// particles.js - Particle system for visual effects

import { gameState } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.gravity = 0.1;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.age++;
    
    // Slow down over time
    this.vx *= 0.98;
    this.vy *= 0.98;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 255 * (1 - this.age / this.lifetime);
    p.push();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export function createParticle(x, y, vx, vy, color, lifetime) {
  const particle = new Particle(x, y, vx, vy, color, lifetime);
  gameState.particles.push(particle);
  return particle;
}

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function renderParticles(p) {
  gameState.particles.forEach(particle => particle.render(p));
}