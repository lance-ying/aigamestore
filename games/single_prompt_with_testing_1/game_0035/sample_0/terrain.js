// terrain.js - Terrain generation and destruction

import { CANVAS_WIDTH, GROUND_HEIGHT } from './globals.js';

export class Terrain {
  constructor(p) {
    this.p = p;
    this.heights = [];
    this.generate();
  }

  generate() {
    // Generate smooth terrain using noise
    const p = this.p;
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      const noiseVal = p.noise(x * 0.01);
      this.heights[x] = GROUND_HEIGHT - 40 + noiseVal * 60;
    }
  }

  getHeight(x) {
    const index = Math.floor(x);
    if (index < 0 || index >= this.heights.length) {
      return GROUND_HEIGHT;
    }
    return this.heights[index];
  }

  createCrater(centerX, centerY, radius) {
    const p = this.p;
    for (let x = Math.max(0, Math.floor(centerX - radius)); 
         x < Math.min(CANVAS_WIDTH, Math.ceil(centerX + radius)); 
         x++) {
      const dist = Math.abs(x - centerX);
      if (dist < radius) {
        const depth = Math.sqrt(radius * radius - dist * dist);
        const currentHeight = this.heights[x];
        
        // Only lower terrain if impact is above current height
        if (centerY < currentHeight) {
          const newHeight = p.max(currentHeight, centerY + depth);
          this.heights[x] = newHeight;
        }
      }
    }
  }

  draw() {
    const p = this.p;
    p.fill(101, 67, 33);
    p.noStroke();
    p.beginShape();
    p.vertex(0, CANVAS_WIDTH);
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      p.vertex(x, this.heights[x]);
    }
    p.vertex(CANVAS_WIDTH, CANVAS_WIDTH);
    p.endShape(p.CLOSE);

    // Draw grass on top
    p.stroke(34, 139, 34);
    p.strokeWeight(2);
    for (let x = 0; x < CANVAS_WIDTH; x += 2) {
      const h = this.heights[x];
      p.line(x, h, x, h - 3);
    }
  }
}