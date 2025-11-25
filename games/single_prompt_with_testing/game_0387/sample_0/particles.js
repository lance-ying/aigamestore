// particles.js - Visual effects and particles

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
    this.isDead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.vx *= 0.98;
    this.life--;
    
    if (this.life <= 0) {
      this.isDead = true;
    }
  }

  render(p) {
    if (this.isDead) return;
    
    p.push();
    p.noStroke();
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export function createBloodParticles(x, y, count = 10) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const particle = new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2,
      [200, 0, 0],
      Math.random() * 4 + 2,
      30
    );
    particles.push(particle);
  }
  return particles;
}

export function createImpactParticles(x, y, count = 8) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    const particle = new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 1,
      [255, 255, 150],
      Math.random() * 3 + 1,
      20
    );
    particles.push(particle);
  }
  return particles;
}

export function createGoldParticles(x, y, count = 15) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    const particle = new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 3,
      [255, 215, 0],
      Math.random() * 5 + 2,
      40
    );
    particles.push(particle);
  }
  return particles;
}