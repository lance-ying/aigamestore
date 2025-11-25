// particles.js - Particle effects

export class Particle {
  constructor(x, y, vx, vy, color, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = 1.0;
    this.decay = 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life -= this.decay;
    return this.life > 0;
  }

  draw(p) {
    p.push();
    p.noStroke();
    p.fill(...this.color, this.life * 255);
    p.ellipse(this.x, this.y, this.size * this.life);
    p.pop();
  }
}

export function createSuccessParticles(p, x, y, particles) {
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10;
    const speed = 2 + Math.random() * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2;
    const color = [100 + Math.random() * 155, 255, 100 + Math.random() * 155];
    const size = 4 + Math.random() * 4;
    particles.push(new Particle(x, y, vx, vy, color, size));
  }
}

export function createMissParticles(p, x, y, particles) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 1 + Math.random() * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 1;
    const color = [255, 100, 100];
    const size = 3 + Math.random() * 3;
    particles.push(new Particle(x, y, vx, vy, color, size));
  }
}