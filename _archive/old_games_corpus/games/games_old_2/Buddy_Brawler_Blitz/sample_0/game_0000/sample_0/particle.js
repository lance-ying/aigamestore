// particle.js - Particle effects
export class Particle {
  constructor(p, x, y, vx, vy, color, lifetime = 30) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = p.random(2, 5);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.lifetime--;
  }
  
  draw() {
    const p = this.p;
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
  
  isDead() {
    return this.lifetime <= 0;
  }
}

export function createImpactParticles(p, x, y, color, count = 10) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(2, 5);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    particles.push(new Particle(p, x, y, vx, vy, color, 20));
  }
  return particles;
}

export function createExplosionParticles(p, x, y, count = 30) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(3, 8);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = [255, p.random(150, 220), 0];
    particles.push(new Particle(p, x, y, vx, vy, color, 30));
  }
  return particles;
}