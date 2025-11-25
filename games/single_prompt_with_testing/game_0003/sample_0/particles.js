// particles.js - Visual effects and particles
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

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
    this.dead = false;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.age++;
    
    if (this.age >= this.lifetime) {
      this.dead = true;
    }
  }
  
  render(p, camera) {
    if (this.dead) return;
    
    const screenX = this.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = this.y - camera.y + CANVAS_HEIGHT / 2;
    
    const alpha = 255 * (1 - this.age / this.lifetime);
    
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.ellipse(screenX, screenY, this.size, this.size);
    p.pop();
  }
}

export function createDeathParticles(x, y, count, color) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = Math.random() * 4 + 2;
    const lifetime = Math.random() * 20 + 20;
    particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
  }
  return particles;
}

export function createHitParticles(x, y, color) {
  const particles = [];
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = Math.random() * 3 + 1;
    const lifetime = Math.random() * 10 + 10;
    particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
  }
  return particles;
}