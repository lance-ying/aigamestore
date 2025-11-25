// island.js - Floating island class

import { CANVAS_HEIGHT } from './globals.js';

export class Island {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 20;
    this.type = type; // 'fish' or 'plant'
    this.active = true;
    this.resourceCount = 3;
    this.floatOffset = Math.random() * 100;
    this.floatSpeed = 0.02;
  }

  update() {
    this.floatOffset += this.floatSpeed;
    this.y = this.y + Math.sin(this.floatOffset) * 0.5;
    
    // Deactivate if no resources
    if (this.resourceCount <= 0) {
      this.active = false;
    }
  }

  harvest() {
    if (this.resourceCount > 0) {
      this.resourceCount--;
      return true;
    }
    return false;
  }

  draw(p) {
    if (!this.active) return;
    
    p.push();
    
    // Island platform
    p.fill(100, 150, 100);
    p.rect(this.x, this.y, this.width, this.height, 5);
    p.fill(80, 120, 80);
    p.rect(this.x, this.y + this.height - 5, this.width, 5, 0, 0, 5, 5);
    
    // Resources
    if (this.type === 'fish') {
      // Water with fish
      p.fill(60, 120, 180, 150);
      p.ellipse(this.x + this.width / 2, this.y + 10, 50, 30);
      
      for (let i = 0; i < this.resourceCount; i++) {
        const fx = this.x + 20 + i * 20;
        const fy = this.y + 10 + Math.sin(this.floatOffset + i) * 3;
        this.drawFish(p, fx, fy);
      }
    } else if (this.type === 'plant') {
      // Plants
      for (let i = 0; i < this.resourceCount; i++) {
        const px = this.x + 15 + i * 25;
        const py = this.y - 5;
        this.drawPlant(p, px, py);
      }
    }
    
    p.pop();
  }

  drawFish(p, x, y) {
    p.fill(200, 100, 50);
    p.ellipse(x, y, 12, 8);
    p.triangle(x - 6, y, x - 10, y - 3, x - 10, y + 3);
  }

  drawPlant(p, x, y) {
    p.fill(50, 150, 50);
    p.rect(x - 1, y, 2, 15);
    p.fill(100, 200, 100);
    p.ellipse(x, y - 5, 10, 10);
  }
}