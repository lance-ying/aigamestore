// Particle system for visual effects
import { gameState } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, color, size = 5) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color || [255, 255, 255];
    this.size = size;
    this.lifetime = 30;
    this.age = 0;
    this.gravity = 0.1;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.age++;
    
    this.vx *= 0.98;
    this.vy *= 0.98;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.noStroke();
    p.fill(...this.color, alpha);
    p.circle(this.x, this.y, this.size * (1 - this.age / this.lifetime));
  }
}

// Create explosion effect
export function createExplosion(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const speed = 2 + Math.random() * 3;
    const particle = new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      3 + Math.random() * 4
    );
    gameState.particles.push(particle);
  }
}

// Create sparkle effect
export function createSparkle(x, y, color) {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2;
    const particle = new Particle(
      x + (Math.random() - 0.5) * 10,
      y + (Math.random() - 0.5) * 10,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      2 + Math.random() * 3
    );
    particle.gravity = -0.05;
    particle.lifetime = 20;
    gameState.particles.push(particle);
  }
}