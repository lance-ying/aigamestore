// customer.js - Customer entities for serving phase

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Customer {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.satisfied = false;
    this.waitTime = 0;
    this.animOffset = 0;
  }

  update() {
    this.waitTime++;
    this.animOffset += 0.05;
  }

  serve() {
    this.satisfied = true;
  }

  render(p) {
    p.push();
    
    const bobOffset = Math.sin(this.animOffset) * 2;
    const currentY = this.y + bobOffset;
    
    // Customer body
    if (this.satisfied) {
      p.fill(100, 200, 100);
    } else {
      p.fill(150, 150, 180);
    }
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.ellipse(this.x, currentY + 10, 30, 35);
    
    // Head
    const skinTone = [255, 220, 177];
    p.fill(...skinTone);
    p.stroke(200, 180, 150);
    p.ellipse(this.x, currentY - 5, 20, 20);
    
    // Eyes
    p.fill(50);
    p.noStroke();
    if (this.satisfied) {
      // Happy eyes (closed)
      p.arc(this.x - 4, currentY - 6, 6, 4, 0, p.PI);
      p.arc(this.x + 4, currentY - 6, 6, 4, 0, p.PI);
    } else {
      // Open eyes
      p.ellipse(this.x - 4, currentY - 6, 3, 4);
      p.ellipse(this.x + 4, currentY - 6, 3, 4);
    }
    
    // Mouth
    p.noFill();
    p.stroke(100, 50, 50);
    p.strokeWeight(1);
    if (this.satisfied) {
      // Smile
      p.arc(this.x, currentY - 2, 10, 8, 0, p.PI);
    } else {
      // Neutral
      p.line(this.x - 4, currentY + 2, this.x + 4, currentY + 2);
    }
    
    // Speech bubble if waiting
    if (!this.satisfied && this.waitTime > 30) {
      p.fill(255, 255, 255, 200);
      p.stroke(150);
      p.strokeWeight(1);
      p.ellipse(this.x + 20, currentY - 20, 20, 15);
      p.noStroke();
      p.triangle(this.x + 12, currentY - 15, this.x + 15, currentY - 10, this.x + 10, currentY - 12);
      
      // Coffee cup icon in bubble
      p.fill(101, 67, 33);
      p.ellipse(this.x + 20, currentY - 20, 6, 8);
    }
    
    p.pop();
  }
}