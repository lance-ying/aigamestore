// player.js - Player character class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 100;
    
    // Animation state
    this.handY = 0; // Relative to body, 0 = resting, negative = drawing
    this.handSpeed = 0;
    this.isDrawing = false;
    this.hasDrawn = false;
    
    // Visual
    this.hatColor = [101, 67, 33];
    this.shirtColor = [70, 130, 180];
    this.skinColor = [255, 220, 177];
  }
  
  startDraw() {
    if (!this.hasDrawn) {
      this.isDrawing = true;
      this.handSpeed = -15;
    }
  }
  
  update() {
    if (this.isDrawing) {
      this.handY += this.handSpeed;
      this.handSpeed *= 0.85; // Deceleration
      
      if (this.handY <= -50) {
        this.handY = -50;
        this.hasDrawn = true;
        this.isDrawing = false;
      }
    }
  }
  
  reset() {
    this.handY = 0;
    this.handSpeed = 0;
    this.isDrawing = false;
    this.hasDrawn = false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(0, 60, 70, 15);
    
    // Legs
    p.fill(...this.shirtColor);
    p.rect(-15, 20, 12, 40);
    p.rect(3, 20, 12, 40);
    
    // Body
    p.fill(...this.shirtColor);
    p.rect(-20, -20, 40, 45);
    
    // Belt
    p.fill(80, 60, 40);
    p.rect(-20, 20, 40, 8);
    
    // Holster (right side)
    p.fill(60, 40, 20);
    p.rect(8, 22, 12, 25);
    
    // Gun in holster or drawn
    if (this.hasDrawn) {
      // Gun drawn up
      p.fill(40, 40, 40);
      p.rect(-8, -25 + this.handY, 16, 6);
      p.rect(8, -25 + this.handY, 15, 4);
      
      // Flash effect when just drawn
      if (this.handY <= -45) {
        p.fill(255, 255, 0, 180);
        p.ellipse(23, -23 + this.handY, 20, 20);
        p.fill(255, 200, 0, 150);
        p.ellipse(23, -23 + this.handY, 12, 12);
      }
    } else {
      p.fill(40, 40, 40);
      p.rect(10, 28, 8, 15);
    }
    
    // Arms
    p.fill(...this.skinColor);
    
    // Left arm (stationary)
    p.rect(-25, -15, 8, 30);
    
    // Right arm (moves when drawing)
    p.push();
    p.translate(17, -10);
    p.rotate(this.handY * 0.02); // Slight rotation
    p.rect(0, 0, 8, 30 + this.handY * 0.3);
    p.pop();
    
    // Head
    p.fill(...this.skinColor);
    p.ellipse(0, -40, 30, 35);
    
    // Hat
    p.fill(...this.hatColor);
    p.ellipse(0, -52, 45, 15);
    p.rect(-12, -60, 24, 15);
    p.ellipse(0, -60, 24, 10);
    
    // Face details
    p.fill(50, 30, 20);
    p.ellipse(-6, -42, 3, 4); // Left eye
    p.ellipse(6, -42, 3, 4);  // Right eye
    
    // Determined expression
    p.noFill();
    p.stroke(50, 30, 20);
    p.strokeWeight(2);
    p.line(-4, -32, 4, -32);
    
    p.pop();
  }
}