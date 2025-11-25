// player.js - Player entity class

import { ROLES } from './globals.js';

export class Player {
  constructor(index, role, isPlayerControlled = false) {
    this.index = index;
    this.role = role;
    this.isPlayerControlled = isPlayerControlled;
    this.name = isPlayerControlled ? "You" : `Player ${index + 1}`;
    this.alive = true;
    this.x = 0;
    this.y = 0;
    
    // Visual properties
    this.color = this.getColorForRole(role);
    this.size = 40;
    this.animationOffset = 0;
  }
  
  getColorForRole(role) {
    switch(role) {
      case ROLES.TOWNIE: return [100, 150, 255];
      case ROLES.DOCTOR: return [100, 255, 100];
      case ROLES.SHERIFF: return [255, 200, 100];
      case ROLES.KILLER: return [255, 50, 50];
      default: return [200, 200, 200];
    }
  }
  
  update(frameCount) {
    this.animationOffset = Math.sin(frameCount * 0.05 + this.index) * 5;
  }
  
  render(p, x, y, highlighted = false, opacity = 255) {
    this.x = x;
    this.y = y;
    
    p.push();
    p.translate(x, y + this.animationOffset);
    
    // Highlight if selected
    if (highlighted) {
      p.fill(255, 255, 100, 100);
      p.noStroke();
      p.circle(0, 0, this.size + 20);
    }
    
    // Draw player
    if (!this.alive) {
      // Dead player - X mark
      p.stroke(150, 150, 150, opacity);
      p.strokeWeight(4);
      p.line(-15, -15, 15, 15);
      p.line(-15, 15, 15, -15);
    } else {
      // Alive player
      p.fill(...this.color, opacity);
      p.stroke(0, opacity);
      p.strokeWeight(2);
      p.circle(0, 0, this.size);
      
      // Eyes
      p.fill(255, opacity);
      p.circle(-8, -5, 8);
      p.circle(8, -5, 8);
      p.fill(0, opacity);
      p.circle(-8, -5, 4);
      p.circle(8, -5, 4);
    }
    
    p.pop();
    
    // Name
    p.fill(255, opacity);
    p.textAlign(p.CENTER);
    p.textSize(12);
    p.text(this.name, x, y + this.size + 10);
  }
}