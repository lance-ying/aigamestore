// particles.js - Particle effects

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addEnemyDefeatEffect(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(p) {
    for (const particle of this.particles) {
      const alpha = 255 * (particle.life / particle.maxLife);
      p.fill(...particle.color, alpha);
      p.noStroke();
      p.circle(particle.x, particle.y, particle.size);
    }
  }

  clear() {
    this.particles = [];
  }
}