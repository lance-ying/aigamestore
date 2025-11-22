// distractions.js - Distraction objects (bugs)
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Distraction {
  constructor(p, speed) {
    this.p = p;
    this.size = p.random(10, 20);
    this.speed = speed;
    this.reset();
  }

  reset() {
    const side = this.p.random() < 0.5 ? 0 : 1;
    if (side === 0) {
      this.x = -this.size;
      this.y = this.p.random(CANVAS_HEIGHT * 0.3, CANVAS_HEIGHT * 0.7);
      this.vx = this.speed;
      this.vy = this.p.random(-0.5, 0.5);
    } else {
      this.x = CANVAS_WIDTH + this.size;
      this.y = this.p.random(CANVAS_HEIGHT * 0.3, CANVAS_HEIGHT * 0.7);
      this.vx = -this.speed;
      this.vy = this.p.random(-0.5, 0.5);
    }
    this.wingAngle = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.wingAngle += 0.3;

    // Reset if off screen
    if (this.x < -this.size * 2 || this.x > CANVAS_WIDTH + this.size * 2) {
      this.reset();
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(50, 50, 50);
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size * 0.6);
    
    // Wings
    p.push();
    p.rotate(p.sin(this.wingAngle) * 0.3);
    p.fill(100, 100, 150, 150);
    p.ellipse(-this.size * 0.4, 0, this.size * 0.8, this.size * 0.4);
    p.pop();
    
    p.push();
    p.rotate(-p.sin(this.wingAngle) * 0.3);
    p.fill(100, 100, 150, 150);
    p.ellipse(this.size * 0.4, 0, this.size * 0.8, this.size * 0.4);
    p.pop();
    
    p.pop();
  }
}