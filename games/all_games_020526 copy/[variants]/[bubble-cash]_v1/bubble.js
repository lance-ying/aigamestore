// bubble.js - Bubble class and related functions

import { BUBBLE_RADIUS, BUBBLE_COLORS } from './globals.js';

export class Bubble {
  constructor(x, y, colorIndex, gridRow = -1, gridCol = -1, isLight = false) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
    this.color = BUBBLE_COLORS[colorIndex];
    this.radius = BUBBLE_RADIUS;
    this.gridRow = gridRow;
    this.gridCol = gridCol;
    this.popping = false;
    this.popProgress = 0;
    this.falling = false;
    this.velocityY = 0;
    this.isLight = isLight; // Light bubbles are bouncier/lighter
  }

  update() {
    if (this.popping) {
      this.popProgress += 0.1;
      if (this.popProgress >= 1) {
        return true; // Mark for removal
      }
    }
    if (this.falling) {
      // Light bubbles fall slower (less gravity)
      const gravity = this.isLight ? 0.25 : 0.5;
      this.velocityY += gravity;
      this.y += this.velocityY;
      if (this.y > 500) {
        return true; // Mark for removal
      }
    }
    return false;
  }

  draw(p) {
    p.push();
    if (this.popping) {
      const scale = 1 - this.popProgress;
      const alpha = 255 * (1 - this.popProgress);
      p.fill(...this.color, alpha);
      p.noStroke();
      p.ellipse(this.x, this.y, this.radius * 2 * scale);
    } else {
      // Light bubbles have a glow effect
      if (this.isLight) {
        // Outer glow
        p.fill(...this.color, 80);
        p.noStroke();
        p.ellipse(this.x, this.y, this.radius * 2.4);
      }
      
      p.fill(...this.color);
      p.stroke(this.isLight ? [255, 255, 255, 220] : [255, 255, 255, 150]);
      p.strokeWeight(this.isLight ? 3 : 2);
      p.ellipse(this.x, this.y, this.radius * 2);
      
      // Extra sparkle for light bubbles
      if (this.isLight) {
        p.fill(255, 255, 255, 150);
        p.noStroke();
        p.ellipse(this.x - this.radius * 0.4, this.y - this.radius * 0.4, this.radius * 0.3);
      }
    }
    p.pop();
  }

  startPop() {
    this.popping = true;
    this.popProgress = 0;
  }

  startFall() {
    this.falling = true;
    this.velocityY = 0;
  }
}

export function createBubble(x, y, colorIndex, gridRow = -1, gridCol = -1, isLight = false) {
  return new Bubble(x, y, colorIndex, gridRow, gridCol, isLight);
}