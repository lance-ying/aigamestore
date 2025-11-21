// Player entity
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 3;
    this.size = 20;
    this.targetX = x;
    this.targetY = y;
    this.animFrame = 0;
  }

  update() {
    // Smooth movement towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1) {
      this.x += (dx / dist) * Math.min(this.speed, dist);
      this.y += (dy / dist) * Math.min(this.speed, dist);
      this.animFrame += 0.15;
    }

    // Keep within bounds
    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x));
    this.y = Math.max(100 + this.size, Math.min(CANVAS_HEIGHT - this.size, this.y));
  }

  moveUp() {
    this.targetY = Math.max(120, this.y - 60);
  }

  moveDown() {
    this.targetY = Math.min(CANVAS_HEIGHT - 40, this.y + 60);
  }

  moveLeft() {
    this.targetX = Math.max(40, this.x - 80);
  }

  moveRight() {
    this.targetX = Math.min(CANVAS_WIDTH - 40, this.x + 80);
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.ellipse(0, 12, this.size * 1.5, this.size * 0.5);
    
    // Body
    p.fill(80, 120, 200);
    p.ellipse(0, 0, this.size, this.size * 1.4);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(0, -8, this.size * 0.7);
    
    // Eyes
    p.fill(0);
    p.ellipse(-4, -8, 3);
    p.ellipse(4, -8, 3);
    
    // Simple animation bob
    const bob = Math.sin(this.animFrame) * 2;
    p.translate(0, bob);
    
    // Arms
    p.stroke(80, 120, 200);
    p.strokeWeight(3);
    p.line(-8, 2, -12, 8);
    p.line(8, 2, 12, 8);
    p.noStroke();
    
    p.pop();
  }
}