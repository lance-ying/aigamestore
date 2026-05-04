// portal.js - Exit portal entity

import { gameState } from './globals.js';

export class Portal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.active = false;
    this.rotation = 0;
  }
  
  update() {
    this.rotation += 0.03;
    
    // Check if player enters
    if (this.active && gameState.player && !gameState.player.isDead) {
      const dist = this.p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.radius + 15) {
        return true; // Level complete
      }
    }
    
    return false;
  }
  
  activate() {
    this.active = true;
  }
  
  render() {
    const p = this.p;
    
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Outer ring
    p.noFill();
    p.stroke(100, 200, 255, 150);
    p.strokeWeight(3);
    p.circle(0, 0, this.radius * 2.5);
    
    // Rotating rings
    for (let i = 0; i < 3; i++) {
      p.push();
      p.rotate(this.rotation + i * p.TWO_PI / 3);
      p.stroke(150, 220, 255, 100 - i * 30);
      p.strokeWeight(2);
      p.circle(0, 0, this.radius * (2 - i * 0.3));
      p.pop();
    }
    
    // Center
    p.noStroke();
    p.fill(120, 200, 255, 180);
    p.circle(0, 0, this.radius * 1.2);
    
    p.fill(180, 230, 255, 220);
    p.circle(0, 0, this.radius * 0.8);
    
    // Pulse
    const pulseSize = this.radius * (0.5 + p.sin(p.frameCount * 0.1) * 0.2);
    p.fill(255, 255, 255, 100);
    p.circle(0, 0, pulseSize);
    
    p.pop();
  }
}