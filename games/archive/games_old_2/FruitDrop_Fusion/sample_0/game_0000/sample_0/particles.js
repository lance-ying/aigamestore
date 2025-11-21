// particles.js - Particle effects for fusion

export class Particle {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-5, -2);
    this.color = color;
    this.life = 255;
    this.decay = p.random(5, 10);
    this.size = p.random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life -= this.decay;
  }

  draw() {
    this.p.push();
    this.p.noStroke();
    this.p.fill(...this.color, this.life);
    this.p.circle(this.x, this.y, this.size);
    this.p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

export class ParticleSystem {
  constructor(p) {
    this.p = p;
    this.particles = [];
  }

  createBurst(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(this.p, x, y, color));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    for (const particle of this.particles) {
      particle.draw();
    }
  }
}