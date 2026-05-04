// player.js - Player character implementation

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 60;
    this.speed = 2;
    this.targetX = x;
    this.walkDirection = 0; // -1 left, 0 stop, 1 right
    this.animFrame = 0;
    this.animSpeed = 0.15;
    this.facingRight = true;
  }
  
  setTarget(targetX) {
    this.targetX = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, targetX));
  }
  
  update() {
    const dx = this.targetX - this.x;
    
    if (Math.abs(dx) > 1) {
      const moveX = Math.sign(dx) * Math.min(this.speed, Math.abs(dx));
      this.x += moveX;
      this.walkDirection = Math.sign(dx);
      this.facingRight = this.walkDirection > 0;
      this.animFrame += this.animSpeed;
    } else {
      this.x = this.targetX;
      this.walkDirection = 0;
      this.animFrame = 0;
    }
  }
  
  isMoving() {
    return this.walkDirection !== 0;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (!this.facingRight) {
      p.scale(-1, 1);
    }
    
    // Body
    p.fill(60, 80, 120);
    p.noStroke();
    p.rect(-this.width / 4, -this.height / 2 + 10, this.width / 2, this.height / 2);
    
    // Head
    p.fill(220, 180, 140);
    p.ellipse(0, -this.height / 2 + 5, this.width / 2, this.width / 2);
    
    // Legs with walking animation
    const legOffset = this.walkDirection !== 0 ? Math.sin(this.animFrame) * 5 : 0;
    p.fill(40, 50, 80);
    p.rect(-this.width / 5, -5, this.width / 5, this.height / 2 - 5 + legOffset);
    p.rect(0, -5, this.width / 5, this.height / 2 - 5 - legOffset);
    
    // Arms
    p.fill(220, 180, 140);
    const armSwing = this.walkDirection !== 0 ? Math.sin(this.animFrame) * 3 : 0;
    p.ellipse(-this.width / 3, -this.height / 4 + armSwing, 8, 20);
    p.ellipse(this.width / 3, -this.height / 4 - armSwing, 8, 20);
    
    p.pop();
  }
}