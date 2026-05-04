import { gameState } from './globals.js';

export class Collectible {
  constructor(p, x, y, type = 'energy') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type; // 'energy', 'health'
    this.radius = 8;
    this.active = true;
    this.animFrame = 0;
  }

  update() {
    this.animFrame = (this.animFrame + 0.2) % (Math.PI * 2);
  }

  draw() {
    if (!this.active) return;
    
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    const float = Math.sin(this.animFrame) * 3;
    p.translate(0, float);
    
    if (this.type === 'energy') {
      // Blue crystal
      p.fill(100, 200, 255, 200);
      p.noStroke();
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const r = i % 2 === 0 ? this.radius : this.radius * 0.6;
        p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
      
      p.fill(200, 230, 255, 100);
      p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    } else if (this.type === 'health') {
      // Red cross
      p.fill(255, 100, 100);
      p.rect(-2, -6, 4, 12, 1);
      p.rect(-6, -2, 12, 4, 1);
      
      p.fill(255, 200, 200, 100);
      p.ellipse(0, 0, this.radius * 2.5, this.radius * 2.5);
    }
    
    p.pop();
  }
}