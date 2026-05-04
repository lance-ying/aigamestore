// terrain.js - Destructible terrain system

import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT } from './globals.js';

export class Terrain {
  constructor(p) {
    this.p = p;
    this.heightMap = [];
    this.destroyed = [];
    this.segmentWidth = 5;
    this.numSegments = Math.ceil(CANVAS_WIDTH / this.segmentWidth);
    
    this.initializeTerrain();
  }
  
  initializeTerrain() {
    // Create initial terrain with hills
    const noiseScale = 0.02;
    for (let i = 0; i < this.numSegments; i++) {
      const x = i * this.segmentWidth;
      const noiseVal = this.p.noise(x * noiseScale);
      const height = GROUND_HEIGHT - 50 + noiseVal * 60;
      this.heightMap[i] = height;
      this.destroyed[i] = false;
    }
  }
  
  getHeightAt(x) {
    const index = Math.floor(x / this.segmentWidth);
    if (index < 0 || index >= this.numSegments) {
      return GROUND_HEIGHT;
    }
    return this.heightMap[index] || GROUND_HEIGHT;
  }
  
  isDestroyed(x) {
    const index = Math.floor(x / this.segmentWidth);
    if (index < 0 || index >= this.numSegments) return false;
    return this.destroyed[index] || false;
  }
  
  explode(x, y, radius) {
    // Destroy terrain in explosion radius
    const startIndex = Math.max(0, Math.floor((x - radius) / this.segmentWidth));
    const endIndex = Math.min(this.numSegments - 1, Math.floor((x + radius) / this.segmentWidth));
    
    for (let i = startIndex; i <= endIndex; i++) {
      const segmentX = i * this.segmentWidth;
      const dist = Math.abs(segmentX - x);
      
      if (dist < radius) {
        const segmentY = this.heightMap[i];
        const vertDist = Math.abs(segmentY - y);
        const totalDist = Math.sqrt(dist * dist + vertDist * vertDist);
        
        if (totalDist < radius) {
          // Lower the terrain or mark as destroyed
          const damage = (1 - totalDist / radius) * radius * 0.5;
          this.heightMap[i] = Math.min(CANVAS_HEIGHT, this.heightMap[i] + damage);
          
          if (this.heightMap[i] > CANVAS_HEIGHT - 10) {
            this.destroyed[i] = true;
          }
        }
      }
    }
  }
  
  render(p) {
    p.push();
    p.fill(101, 67, 33);
    p.stroke(80, 50, 20);
    p.strokeWeight(1);
    
    p.beginShape();
    p.vertex(0, CANVAS_HEIGHT);
    
    for (let i = 0; i < this.numSegments; i++) {
      if (!this.destroyed[i]) {
        const x = i * this.segmentWidth;
        const y = this.heightMap[i];
        p.vertex(x, y);
      }
    }
    
    p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.endShape(p.CLOSE);
    
    // Draw grass on top
    p.stroke(34, 139, 34);
    p.strokeWeight(2);
    for (let i = 0; i < this.numSegments - 1; i++) {
      if (!this.destroyed[i] && !this.destroyed[i + 1]) {
        const x1 = i * this.segmentWidth;
        const y1 = this.heightMap[i];
        const x2 = (i + 1) * this.segmentWidth;
        const y2 = this.heightMap[i + 1];
        p.line(x1, y1, x2, y2);
      }
    }
    
    p.pop();
  }
}