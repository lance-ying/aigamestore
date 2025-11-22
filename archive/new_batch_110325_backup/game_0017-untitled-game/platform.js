import { gameState } from './globals.js';

export class Platform {
  constructor(p, x, y, width, height, type = 'normal') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    
    if (this.type === 'normal') {
      // Metal platform
      p.fill(80, 90, 100);
      p.rect(screenX, screenY, this.width, this.height, 2);
      
      // Highlight
      p.fill(120, 130, 140);
      p.rect(screenX, screenY, this.width, 3);
      
      // Grid pattern
      p.stroke(60, 70, 80);
      p.strokeWeight(1);
      for (let i = 0; i < this.width; i += 20) {
        p.line(screenX + i, screenY, screenX + i, screenY + this.height);
      }
    } else if (this.type === 'ground') {
      // Ground
      p.fill(60, 70, 80);
      p.rect(screenX, screenY, this.width, this.height);
      
      // Top layer
      p.fill(70, 80, 90);
      p.rect(screenX, screenY, this.width, 5);
    }
    
    p.pop();
  }
}