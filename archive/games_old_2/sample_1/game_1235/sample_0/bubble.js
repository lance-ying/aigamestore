// bubble.js - Bubble entity class

import { BUBBLE_RADIUS, BUBBLE_COLORS } from './globals.js';

export class Bubble {
  constructor(x, y, colorIndex, gridRow = -1, gridCol = -1) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
    this.color = BUBBLE_COLORS[colorIndex];
    this.radius = BUBBLE_RADIUS;
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    this.gridRow = gridRow;
    this.gridCol = gridCol;
    this.markedForRemoval = false;
    this.popAnimation = 0;
    this.floating = false;
  }

  update() {
    if (this.isMoving) {
      this.x += this.vx;
      this.y += this.vy;
    }
    
    if (this.popAnimation > 0) {
      this.popAnimation += 0.1;
    }
  }

  draw(p) {
    p.push();
    
    if (this.popAnimation > 0 && this.popAnimation < 1) {
      const scale = 1 + this.popAnimation * 0.5;
      const alpha = 255 * (1 - this.popAnimation);
      p.fill(...this.color, alpha);
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 2 * scale);
    } else if (this.popAnimation >= 1) {
      // Don't draw
    } else {
      // Normal bubble
      p.fill(...this.color);
      p.stroke(255, 255, 255, 100);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.radius * 2);
      
      // Highlight
      p.noStroke();
      p.fill(255, 255, 255, 80);
      p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.6);
    }
    
    p.pop();
  }

  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
    this.isMoving = true;
  }

  startPopAnimation() {
    this.popAnimation = 0.01;
    this.markedForRemoval = true;
  }

  isAnimationComplete() {
    return this.popAnimation >= 1;
  }
}