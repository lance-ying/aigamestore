// particles.js - Particle system for visual effects

import { gameState, CANVAS_HEIGHT, COLORS } from './globals.js';

// Particle class
export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.age = 0;
    this.size = size;
    this.gravity = 0.2;
  }
  
  update() {
    this.vx *= 0.98;
    this.vy += this.gravity;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime || this.y > CANVAS_HEIGHT + 50;
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    
    const currentSize = this.size * (1 - this.age / this.lifetime * 0.5);
    p.circle(this.x, this.y, currentSize * 2);
  }
}

// Create particle burst
export function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2;
    
    const particle = new Particle(
      x,
      y,
      vx,
      vy,
      color,
      Math.random() * 20 + 20,
      Math.random() * 2 + 2
    );
    
    gameState.particles.push(particle);
  }
}

// Create star burst particles (for collectibles)
export function createStarBurstParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = Math.random() * 3 + 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    const particle = new Particle(
      x,
      y,
      vx,
      vy,
      COLORS.star,
      Math.random() * 30 + 30,
      Math.random() * 3 + 2
    );
    
    gameState.particles.push(particle);
  }
}

// Update all particles
export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

// Render all particles
export function renderParticles(p) {
  gameState.particles.forEach(particle => {
    particle.render(p);
  });
}