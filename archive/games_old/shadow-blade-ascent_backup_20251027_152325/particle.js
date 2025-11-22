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

export function createHitParticles(x, y, count = 5) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 255, 255],
      Math.random() * 4 + 2,
      20
    ));
  }
  return particles;
}

export function createDeathParticles(x, y, width, height, count = 10) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    particles.push(new Particle(
      x + Math.random() * width,
      y + Math.random() * height,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [40, 40, 50],
      Math.random() * 6 + 3,
      30
    ));
  }
  return particles;
}