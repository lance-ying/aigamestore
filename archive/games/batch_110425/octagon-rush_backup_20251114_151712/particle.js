// particle.js - Particle system for visual effects

export class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.alpha = 255;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime * 60;
    this.y += this.vy * deltaTime * 60;
    this.lifetime -= deltaTime;
    this.alpha = 255 * (this.lifetime / this.maxLifetime);
    
    // Apply gravity
    this.vy += 0.3 * deltaTime * 60;
    
    // Friction
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  isDead() {
    return this.lifetime <= 0;
  }

  render(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

// Create a burst of particles at a position
export function createParticleBurst(x, y, color, count = 15) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = Math.random() * 4 + 2;
    const lifetime = Math.random() * 0.5 + 0.5;
    
    particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
  }
  return particles;
}

// Create trail particles for lane switching
export function createTrailParticles(x, y, color, count = 8) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    const size = Math.random() * 3 + 2;
    const lifetime = Math.random() * 0.3 + 0.3;
    
    particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
  }
  return particles;
}