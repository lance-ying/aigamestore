// player.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.speed = 3;
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    // Smooth movement towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  moveTo(x, y) {
    this.targetX = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, x));
    this.targetY = Math.max(this.height / 2, Math.min(CANVAS_HEIGHT - this.height / 2, y));
  }

  render(p) {
    p.push();
    
    // Body
    p.fill(80, 120, 160);
    p.noStroke();
    p.rect(this.x - this.width / 2, this.y - this.height / 2 + 10, this.width, this.height - 10);
    
    // Head
    p.fill(200, 160, 130);
    p.ellipse(this.x, this.y - this.height / 2 + 5, 20, 20);
    
    // Eyes
    p.fill(50);
    p.ellipse(this.x - 4, this.y - this.height / 2 + 3, 3, 3);
    p.ellipse(this.x + 4, this.y - this.height / 2 + 3, 3, 3);
    
    // Arms
    p.stroke(80, 120, 160);
    p.strokeWeight(4);
    p.line(this.x - this.width / 2, this.y - 5, this.x - this.width / 2 - 8, this.y + 5);
    p.line(this.x + this.width / 2, this.y - 5, this.x + this.width / 2 + 8, this.y + 5);
    
    p.pop();
  }
}