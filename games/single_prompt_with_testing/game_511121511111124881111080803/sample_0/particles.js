// particles.js - Particle system for visual effects

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONSTANTS } from './globals.js';

// ============================================================================
// PARTICLE CLASS
// ============================================================================

export class Particle {
  constructor(x, y, vx, vy, lifetime, color, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = lifetime;
    this.age = 0;
    this.color = color;
    this.size = size;
    this.isActive = true;
    
    // Visual properties
    this.gravity = 0.1;
    this.friction = 0.98;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    
    gameState.particles.push(this);
  }
  
  update() {
    if (!this.isActive) return;
    
    // Apply physics
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Update rotation
    this.rotation += this.rotationSpeed;
    
    // Update age
    this.age++;
    
    // Check if expired
    if (this.age >= this.lifetime) {
      this.destroy();
    }
  }
  
  destroy() {
    this.isActive = false;
    const index = gameState.particles.indexOf(this);
    if (index > -1) {
      gameState.particles.splice(index, 1);
    }
  }
  
  render(p) {
    if (!this.isActive) return;
    
    // Calculate alpha based on age
    const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Draw particle
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.circle(0, 0, this.size);
    
    // Inner glow
    p.fill(255, 255, 255, alpha * 0.5);
    p.circle(0, 0, this.size * 0.5);
    
    p.pop();
  }
}

// ============================================================================
// PARTICLE EFFECTS
// ============================================================================

export function createParticleExplosion(x, y, count, color, speed = 5) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const velocity = speed * (0.5 + Math.random() * 0.5);
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    const lifetime = GAME_CONSTANTS.PARTICLE_LIFETIME * (0.7 + Math.random() * 0.6);
    const size = 2 + Math.random() * 3;
    
    new Particle(x, y, vx, vy, lifetime, color, size);
  }
}

export function createTrailParticle(x, y, vx, vy, color) {
  const lifetime = 20;
  const size = 2;
  new Particle(x, y, vx, vy, lifetime, color, size);
}

export function createSparkEffect(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = [255, 255, 100 + Math.random() * 155];
    const lifetime = 15 + Math.random() * 15;
    const size = 1 + Math.random() * 2;
    
    new Particle(x, y, vx, vy, lifetime, color, size);
  }
}

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
  }
}

export function renderParticles(p) {
  gameState.particles.forEach(particle => particle.render(p));
}