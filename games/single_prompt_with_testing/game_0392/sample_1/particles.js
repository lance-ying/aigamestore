// particles.js - Particle system for visual effects

import { gameState } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.age = 0;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    p.push();
    p.fill(...this.color, alpha * 255);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export class Explosion {
  constructor(x, y, color, particleCount) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.particleCount = particleCount;
    this.particles = [];
    this.lifetime = 30;
    this.age = 0;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = Math.random() * 3 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 4 + 2;
      
      this.particles.push(new Particle(x, y, vx, vy, color, size, this.lifetime));
    }
  }
  
  update() {
    this.age++;
    this.particles.forEach(p => p.update());
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    this.particles.forEach(particle => particle.render(p));
  }
}

export function createExplosion(p, x, y, color, particleCount) {
  const explosion = new Explosion(x, y, color, particleCount);
  gameState.explosions.push(explosion);
}

export function createParticles(p, x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = Math.random() * 3 + 1;
    const lifetime = Math.floor(Math.random() * 20 + 20);
    
    const particle = new Particle(x, y, vx, vy, color, size, lifetime);
    gameState.particles.push(particle);
  }
}