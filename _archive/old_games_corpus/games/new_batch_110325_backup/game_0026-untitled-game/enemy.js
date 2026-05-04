// enemy.js
import { ENEMY_SIZE } from './globals.js';

export class Enemy {
  constructor(x, y, world, moveRange = 0) {
    this.x = x;
    this.y = y;
    this.size = ENEMY_SIZE;
    this.world = world;
    this.startX = x;
    this.moveRange = moveRange;
    this.speed = 1;
    this.direction = 1;
  }

  update() {
    if (this.moveRange > 0) {
      this.x += this.speed * this.direction;
      
      if (this.x > this.startX + this.moveRange) {
        this.x = this.startX + this.moveRange;
        this.direction = -1;
      } else if (this.x < this.startX) {
        this.x = this.startX;
        this.direction = 1;
      }
    }
  }

  render(p, currentWorld) {
    if (this.world === currentWorld) {
      p.push();
      
      if (this.world === 'MATERIAL') {
        // Material world enemy - spiky hazard
        p.fill(180, 50, 50);
        p.stroke(120, 30, 30);
        p.strokeWeight(2);
        
        // Body
        p.circle(this.x + this.size / 2, this.y + this.size / 2, this.size);
        
        // Spikes
        p.noStroke();
        p.fill(200, 60, 60);
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i++) {
          const angle = (i / spikeCount) * Math.PI * 2 + p.frameCount * 0.05;
          const spikeX = this.x + this.size / 2 + Math.cos(angle) * (this.size / 2 + 4);
          const spikeY = this.y + this.size / 2 + Math.sin(angle) * (this.size / 2 + 4);
          p.triangle(
            this.x + this.size / 2 + Math.cos(angle) * (this.size / 2),
            this.y + this.size / 2 + Math.sin(angle) * (this.size / 2),
            spikeX, spikeY,
            this.x + this.size / 2 + Math.cos(angle + 0.3) * (this.size / 2),
            this.y + this.size / 2 + Math.sin(angle + 0.3) * (this.size / 2)
          );
        }
      } else {
        // Energy world enemy - electric hazard
        p.noStroke();
        
        // Electric glow
        for (let i = 3; i >= 0; i--) {
          const alpha = 60 - i * 12;
          p.fill(255, 100, 200, alpha);
          p.circle(this.x + this.size / 2, this.y + this.size / 2, this.size + i * 6);
        }
        
        // Core
        p.fill(255, 150, 220, 200);
        p.circle(this.x + this.size / 2, this.y + this.size / 2, this.size);
        
        // Lightning bolts
        p.stroke(255, 200, 240, 180);
        p.strokeWeight(2);
        const boltCount = 6;
        for (let i = 0; i < boltCount; i++) {
          const angle = (i / boltCount) * Math.PI * 2 + p.frameCount * 0.08;
          const boltLength = this.size / 2 + 6 + Math.sin(p.frameCount * 0.2 + i) * 3;
          const x1 = this.x + this.size / 2;
          const y1 = this.y + this.size / 2;
          const x2 = x1 + Math.cos(angle) * boltLength;
          const y2 = y1 + Math.sin(angle) * boltLength;
          p.line(x1, y1, x2, y2);
        }
      }
      
      p.pop();
    }
  }
}