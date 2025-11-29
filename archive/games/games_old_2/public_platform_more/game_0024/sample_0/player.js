// player.js - Player character class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.width = 30;
    this.height = 40;
    this.speed = 3;
    this.walkCycle = 0;
    this.facing = 1; // 1 = right, -1 = left
  }

  update() {
    // Move towards target
    if (this.p.abs(this.x - this.targetX) > 2) {
      const direction = this.targetX > this.x ? 1 : -1;
      this.x += this.speed * direction;
      this.facing = direction;
      this.walkCycle += 0.15;
    } else {
      this.x = this.targetX;
      this.walkCycle = 0;
    }

    // Keep player in bounds
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
  }

  moveTo(targetX) {
    this.targetX = targetX;
  }

  isMoving() {
    return this.p.abs(this.x - this.targetX) > 2;
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Can body - red cylinder
    this.p.fill(220, 40, 40);
    this.p.stroke(150, 20, 20);
    this.p.strokeWeight(2);
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
    
    // Top rim
    this.p.fill(180, 30, 30);
    this.p.ellipse(0, -this.height / 2, this.width, 8);
    
    // Bottom rim
    this.p.fill(180, 30, 30);
    this.p.ellipse(0, this.height / 2, this.width, 8);
    
    // Label area
    this.p.fill(255, 240, 220);
    this.p.noStroke();
    this.p.rect(-this.width / 2 + 4, -8, this.width - 8, 16, 2);
    
    // Simple face
    this.p.fill(40, 40, 50);
    // Eyes
    const eyeOffset = this.isMoving() ? this.p.sin(this.walkCycle * 2) * 2 : 0;
    this.p.ellipse(-6, -2 + eyeOffset, 4, 4);
    this.p.ellipse(6, -2 + eyeOffset, 4, 4);
    
    // Smile
    this.p.noFill();
    this.p.stroke(40, 40, 50);
    this.p.strokeWeight(1.5);
    this.p.arc(0, 2, 12, 8, 0, this.p.PI);
    
    // Walking animation - legs
    if (this.isMoving()) {
      this.p.stroke(150, 20, 20);
      this.p.strokeWeight(3);
      const legSwing = this.p.sin(this.walkCycle * 2) * 6;
      this.p.line(-6, this.height / 2, -6, this.height / 2 + 8 + legSwing);
      this.p.line(6, this.height / 2, 6, this.height / 2 + 8 - legSwing);
    }
    
    this.p.pop();
  }
}