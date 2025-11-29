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
    this.gravity = 0.2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.age++;
    
    // Fade out
    this.alpha = 1 - (this.age / this.lifetime);
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    p.push();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha * 255);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

// Damage number particle
export class DamageNumber {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.lifetime = 30;
    this.age = 0;
    this.vy = -2;
  }
  
  update() {
    this.y += this.vy;
    this.age++;
    this.alpha = 1 - (this.age / this.lifetime);
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    p.push();
    p.fill(255, 255, 0, this.alpha * 255);
    p.stroke(0, 0, 0, this.alpha * 255);
    p.strokeWeight(2);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(Math.floor(this.damage), this.x, this.y);
    p.pop();
  }
}

// Create explosion effect
export function createParticleExplosion(x, y, color) {
  const particleCount = 12;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = 3 + Math.random() * 4;
    const lifetime = 20 + Math.random() * 20;
    
    const particle = new Particle(x, y, vx, vy, color, size, lifetime);
    gameState.particles.push(particle);
  }
}

// Create damage number
export function createDamageNumber(x, y, damage) {
  const damageNum = new DamageNumber(x, y, damage);
  gameState.particles.push(damageNum);
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
  gameState.particles.forEach(particle => particle.render(p));
}