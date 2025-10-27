// particle.js

export class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
    
    if (this.life <= 0) {
      this.dead = true;
    }
  }
  
  draw(p, cameraX) {
    p.push();
    const alpha = 255 * (this.life / this.maxLife);
    p.fill(...this.color, alpha);
    p.noStroke();
    const screenX = this.x - cameraX;
    p.ellipse(screenX, this.y, this.size, this.size);
    p.pop();
  }
}

export function createHitParticles(x, y, count = 8) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 255, 255],
      Math.random() * 5 + 3,
      25
    ));
  }
  // Add some bright impact particles
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 200, 100],
      Math.random() * 6 + 4,
      20
    ));
  }
  return particles;
}

export function createDeathParticles(x, y, width, height, count = 15) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 3;
    particles.push(new Particle(
      x + Math.random() * width,
      y + Math.random() * height,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [40, 40, 50],
      Math.random() * 7 + 4,
      35
    ));
  }
  return particles;
}

export function createDashParticles(x, y, backward = false, count = 5) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    // Create particles that trail backward from the dash direction
    const angle = (backward ? 0 : Math.PI) + (Math.random() - 0.5) * 0.8;
    const speed = Math.random() * 3 + 1;
    particles.push(new Particle(
      x + (Math.random() - 0.5) * 20,
      y + (Math.random() - 0.5) * 30,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 0.5,
      [100, 180, 255],
      Math.random() * 4 + 3,
      15
    ));
  }
  // Add bright core particles
  for (let i = 0; i < 2; i++) {
    const angle = (backward ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 2 + 0.5;
    particles.push(new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [200, 230, 255],
      Math.random() * 5 + 4,
      12
    ));
  }
  return particles;
}