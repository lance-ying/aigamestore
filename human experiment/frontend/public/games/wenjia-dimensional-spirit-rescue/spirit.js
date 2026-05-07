// spirit.js
import { SPIRIT_SIZE } from './globals.js';

export class Spirit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = SPIRIT_SIZE;
    this.pulsePhase = 0;
  }

  update() {
    this.pulsePhase += 0.05;
  }

  render(p) {
    p.push();
    
    const pulse = Math.sin(this.pulsePhase) * 5;
    const currentSize = this.size + pulse;
    
    // Outer aura
    for (let i = 4; i >= 0; i--) {
      const alpha = 60 - i * 12;
      p.fill(255, 220, 100, alpha);
      p.noStroke();
      p.circle(this.x, this.y, currentSize + i * 8);
    }
    
    // Bright core
    p.fill(255, 240, 150, 220);
    p.circle(this.x, this.y, currentSize);
    
    // Inner bright spot
    p.fill(255, 255, 200);
    p.circle(this.x, this.y, currentSize * 0.5);
    
    // Sparkles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.pulsePhase * 2;
      const dist = currentSize / 2 + 10;
      const sx = this.x + Math.cos(angle) * dist;
      const sy = this.y + Math.sin(angle) * dist;
      p.fill(255, 230, 120, 200);
      p.circle(sx, sy, 3);
    }
    
    p.pop();
  }
}