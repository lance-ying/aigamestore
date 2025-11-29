// particle.js - Particle effects for visual feedback

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Particle {
  constructor(p, x, y, hue, type = 'hit') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.hue = hue;
    this.type = type;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.size = p.random(3, 8);
    this.velocity = p.createVector(
      p.random(-3, 3),
      p.random(-3, 3)
    );
    this.alpha = 255;
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.mult(0.95);
    this.life -= 0.02;
    this.alpha = this.life * 255;
  }

  isDead() {
    return this.life <= 0;
  }

  render() {
    this.p.push();
    this.p.colorMode(this.p.HSB);
    this.p.noStroke();
    
    if (this.type === 'hit') {
      this.p.fill(this.hue, 80, 255, this.alpha);
      this.p.circle(this.x, this.y, this.size * this.life);
    } else if (this.type === 'miss') {
      this.p.fill(0, 0, 255, this.alpha * 0.5);
      this.p.circle(this.x, this.y, this.size * this.life);
    } else if (this.type === 'combo') {
      this.p.fill(this.hue, 90, 255, this.alpha);
      this.p.circle(this.x, this.y, this.size * (1 + (1 - this.life) * 0.5));
    }
    
    this.p.colorMode(this.p.RGB);
    this.p.pop();
  }
}