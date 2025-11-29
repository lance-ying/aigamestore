// particles.js - Particle system for visual effects

import { gameState } from './globals.js';

// Particle class
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
    this.alpha = 1;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.age++;
    this.alpha = 1 - (this.age / this.lifetime);
    
    // Gravity for some particles
    if (this.lifetime > 30) {
      this.vy += 0.1;
    }
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha * 255);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

// Explosion class
export class Explosion {
  constructor(x, y, size, color) {
    this.x = x;
    this.y = y;
    this.maxSize = size;
    this.currentSize = 0;
    this.color = color;
    this.lifetime = 30;
    this.age = 0;
    this.particles = [];
    
    // Create explosion particles
    const particleCount = 15 + Math.floor(size / 5);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const particleColor = [
        color[0] + (Math.random() - 0.5) * 50,
        color[1] + (Math.random() - 0.5) * 50,
        color[2] + (Math.random() - 0.5) * 50
      ];
      const particleSize = 3 + Math.random() * 4;
      const particleLifetime = 20 + Math.random() * 20;
      
      this.particles.push(new Particle(x, y, vx, vy, particleColor, particleSize, particleLifetime));
    }
    
    gameState.explosions.push(this);
  }
  
  update() {
    this.age++;
    
    // Grow then shrink
    if (this.age < this.lifetime / 2) {
      this.currentSize = (this.age / (this.lifetime / 2)) * this.maxSize;
    } else {
      this.currentSize = ((this.lifetime - this.age) / (this.lifetime / 2)) * this.maxSize;
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  isDead() {
    return this.age >= this.lifetime && this.particles.length === 0;
  }
  
  render(p) {
    // Render main explosion flash
    if (this.currentSize > 0) {
      const alpha = 1 - (this.age / this.lifetime);
      
      // Outer glow
      p.push();
      p.noStroke();
      p.fill(this.color[0], this.color[1], this.color[2], alpha * 100);
      p.circle(this.x, this.y, this.currentSize * 2);
      
      // Inner core
      p.fill(255, 255, 200, alpha * 200);
      p.circle(this.x, this.y, this.currentSize);
      p.pop();
    }
    
    // Render particles
    this.particles.forEach(particle => particle.render(p));
  }
}

// Helper functions to create effects
export function createExplosion(p, x, y, size, color) {
  const explosion = new Explosion(x, y, size, color);
  return explosion;
}

export function createSmokeTrail(p, x, y) {
  const particle = new Particle(
    x,
    y,
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.5,
    [100, 100, 100],
    3 + Math.random() * 3,
    30 + Math.random() * 20
  );
  gameState.particles.push(particle);
}

export function createSparkles(p, x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    const particle = new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 255, 100],
      2 + Math.random() * 2,
      15 + Math.random() * 15
    );
    gameState.particles.push(particle);
  }
}

// Update all particles
export function updateParticles() {
  // Update regular particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update explosions
  for (let i = gameState.explosions.length - 1; i >= 0; i--) {
    gameState.explosions[i].update();
    if (gameState.explosions[i].isDead()) {
      gameState.explosions.splice(i, 1);
    }
  }
}

// Render all particles
export function renderParticles(p) {
  gameState.particles.forEach(particle => particle.render(p));
  gameState.explosions.forEach(explosion => explosion.render(p));
}