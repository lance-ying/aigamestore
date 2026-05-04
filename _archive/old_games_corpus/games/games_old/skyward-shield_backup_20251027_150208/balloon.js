import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Balloon {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 28;
    this.pulsePhase = 0;
  }

  update(speed) {
    this.y -= speed;
    this.pulsePhase += 0.05;
    
    gameState.balloonY = this.y;
    gameState.balloonX = this.x;
  }

  draw(scrollOffset) {
    const p = this.p;
    const screenY = this.y + scrollOffset;
    
    p.push();
    
    const pulseSize = this.radius + Math.sin(this.pulsePhase) * 2;
    
    // Balloon body
    p.fill(220, 240, 255);
    p.stroke(180, 200, 220);
    p.strokeWeight(2);
    p.circle(this.x, screenY, pulseSize * 2);
    
    // Highlight
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(this.x - 8, screenY - 8, 10);
    
    // String
    p.stroke(100);
    p.strokeWeight(1);
    p.line(this.x, screenY + pulseSize, this.x, screenY + pulseSize + 15);
    
    // Basket
    p.fill(80, 60, 40);
    p.stroke(60, 40, 20);
    p.strokeWeight(1);
    p.rect(this.x - 6, screenY + pulseSize + 15, 12, 8);
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }
}