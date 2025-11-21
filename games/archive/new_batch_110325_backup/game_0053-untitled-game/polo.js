// polo.js - Polo character class

import { POLO_IDLE, POLO_WALKING, POLO_DEAD, POLO_SUCCESS } from './globals.js';

export class Polo {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.state = POLO_IDLE;
    this.animationFrame = 0;
    this.walkCycle = 0;
    this.facingRight = true;
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  update(frameCount) {
    this.animationFrame = frameCount;
    if (this.state === POLO_WALKING) {
      this.walkCycle = (this.walkCycle + 0.2) % (Math.PI * 2);
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    if (this.state === POLO_DEAD) {
      p.fill(150, 50, 50);
    } else if (this.state === POLO_SUCCESS) {
      p.fill(100, 255, 100);
    } else {
      p.fill(100, 150, 255);
    }
    
    // Main body
    p.noStroke();
    p.ellipse(0, -15, 18, 24);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(0, -28, 16, 16);
    
    // Eyes
    p.fill(50, 50, 50);
    p.ellipse(-4, -29, 3, 3);
    p.ellipse(4, -29, 3, 3);
    
    // Legs (animated when walking)
    p.fill(100, 150, 255);
    if (this.state === POLO_WALKING) {
      const legOffset = Math.sin(this.walkCycle) * 3;
      p.ellipse(-4, -5 + legOffset, 4, 8);
      p.ellipse(4, -5 - legOffset, 4, 8);
    } else {
      p.ellipse(-4, -5, 4, 8);
      p.ellipse(4, -5, 4, 8);
    }
    
    // Arms
    const armOffset = this.state === POLO_WALKING ? Math.sin(this.walkCycle * 0.5) * 2 : 0;
    p.ellipse(-8, -15 + armOffset, 4, 6);
    p.ellipse(8, -15 - armOffset, 4, 6);
    
    p.pop();
  }
}