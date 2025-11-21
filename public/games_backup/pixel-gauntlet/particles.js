import { gameState } from './globals.js';

export class Particle {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.random(-3, 3);
    this.vy = this.p.random(-5, -2);
    this.life = 30;
    this.maxLife = 30;
    this.color = color;
    this.size = this.p.random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3;
    this.life--;
  }

  render() {
    this.p.push();
    this.p.noStroke();
    const alpha = 255 * (this.life / this.maxLife);
    this.p.fill(...this.color, alpha);
    this.p.ellipse(this.x, this.y, this.size, this.size);
    this.p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

export function createParticles(p, x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const particle = new Particle(p, x, y, color);
    gameState.particles.push(particle);
  }
}