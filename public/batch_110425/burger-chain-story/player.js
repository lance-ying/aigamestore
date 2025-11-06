// player.js - Player/Shop entity

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.color = [255, 180, 50];
    this.efficiency = 1.0;
  }
  
  update() {
    // Player updates happen through game state
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw chef character
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, -10, 25, 25); // head
    
    p.fill(255);
    p.rect(-15, 0, 30, 35, 5); // body (chef coat)
    
    // Chef hat
    p.fill(255);
    p.rect(-12, -25, 24, 15, 3);
    p.ellipse(0, -25, 30, 15);
    
    // Eyes
    p.fill(0);
    p.ellipse(-5, -12, 3, 3);
    p.ellipse(5, -12, 3, 3);
    
    // Mouth
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, -8, 8, 6, 0, p.PI);
    
    p.pop();
  }
}