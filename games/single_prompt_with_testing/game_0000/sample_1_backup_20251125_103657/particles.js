// particles.js - Particle effects system

export class Particle {
  constructor(x, y, vx, vy, color, size = 3, lifetime = 30) {
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
    this.vy += 0.15; // Gravity
    this.age++;
    this.alpha = 1 - (this.age / this.lifetime);
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

export function createSoulParticles(x, y, count = 8) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 2 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    particles.push(new Particle(x, y, vx, vy, [150, 200, 255], 4, 40));
  }
  return particles;
}

export function createDeathParticles(x, y, count = 12) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2;
    particles.push(new Particle(x, y, vx, vy, [220, 100, 80], 5, 50));
  }
  return particles;
}

export function createSlashParticles(x, y, direction) {
  const particles = [];
  for (let i = 0; i < 5; i++) {
    const spread = (Math.random() - 0.5) * 0.5;
    const angle = (direction > 0 ? 0 : Math.PI) + spread;
    const speed = Math.random() * 4 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed + (Math.random() - 0.5);
    particles.push(new Particle(x, y, vx, vy, [200, 220, 255], 3, 20));
  }
  return particles;
}

export function createDashParticles(x, y) {
  const particles = [];
  for (let i = 0; i < 3; i++) {
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    particles.push(new Particle(x, y, vx, vy, [180, 220, 255], 4, 25));
  }
  return particles;
}