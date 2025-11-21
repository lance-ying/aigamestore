// bubble.js - Bubble entity class

import { BUBBLE_RADIUS, ROCK_COLOR } from './globals.js';

export class Bubble {
  constructor(x, y, color, type = "normal") {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type; // "normal", "rock", "bomb", "beam"
    this.radius = BUBBLE_RADIUS;
    this.gridRow = -1;
    this.gridCol = -1;
    this.active = true;
    this.markedForPop = false;
    this.popAnimation = 0;
    this.attached = false;
  }

  update() {
    if (this.markedForPop && this.popAnimation < 1) {
      this.popAnimation += 0.1;
      if (this.popAnimation >= 1) {
        this.active = false;
      }
    }
  }

  render(p) {
    if (!this.active) return;

    p.push();
    
    if (this.markedForPop) {
      const scale = 1 - this.popAnimation;
      const alpha = 255 * (1 - this.popAnimation);
      p.fill(...this.color, alpha);
      p.stroke(255, 255, 255, alpha);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, this.radius * 2 * scale);
      
      // Particle effect
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + this.popAnimation * Math.PI;
        const dist = this.popAnimation * 20;
        p.fill(...this.color, alpha * 0.5);
        p.noStroke();
        p.ellipse(
          this.x + Math.cos(angle) * dist,
          this.y + Math.sin(angle) * dist,
          5
        );
      }
    } else {
      p.fill(...this.color);
      p.stroke(255);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, this.radius * 2);
      
      // Special bubble indicators
      if (this.type === "rock") {
        p.fill(60, 60, 60);
        p.noStroke();
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          p.ellipse(
            this.x + Math.cos(angle) * 5,
            this.y + Math.sin(angle) * 5,
            4
          );
        }
      }
    }
    
    p.pop();
  }

  isRock() {
    return this.type === "rock";
  }

  colorsMatch(other) {
    if (this.isRock() || other.isRock()) return false;
    return this.color[0] === other.color[0] &&
           this.color[1] === other.color[1] &&
           this.color[2] === other.color[2];
  }
}

export class FallingBubble extends Bubble {
  constructor(x, y, color, type = "normal") {
    super(x, y, color, type);
    this.vy = 0;
    this.vx = 0;
    this.gravity = 0.5;
  }

  update() {
    super.update();
    if (!this.markedForPop) {
      this.vy += this.gravity;
      this.y += this.vy;
      this.x += this.vx;
    }
  }

  isOffScreen() {
    return this.y > 500;
  }
}