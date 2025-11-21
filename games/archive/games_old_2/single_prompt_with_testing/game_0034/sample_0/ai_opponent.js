// ai_opponent.js - AI opponent class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class AIOpponent {
  constructor(x, y, level) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.width = 60;
    this.height = 100;
    
    // Animation state
    this.handY = 0;
    this.handSpeed = 0;
    this.isDrawing = false;
    this.hasDrawn = false;
    
    // Visual variety based on level
    const hue = (level * 25) % 360;
    this.hatColor = this.getColorFromLevel(level, 0);
    this.shirtColor = this.getColorFromLevel(level, 1);
    this.skinColor = [245, 210, 170];
    
    // AI behavior
    this.reactionTime = 0;
    this.willFoul = false;
  }
  
  getColorFromLevel(level, variant) {
    const colors = [
      [[80, 60, 40], [150, 50, 50]],    // Brown hat, red shirt
      [[40, 40, 40], [60, 60, 60]],     // Black hat, gray shirt
      [[100, 80, 50], [80, 100, 60]],   // Tan hat, olive shirt
      [[60, 50, 40], [100, 70, 40]],    // Dark brown, orange
      [[90, 90, 90], [40, 40, 80]],     // Gray hat, navy shirt
      [[70, 50, 30], [120, 80, 50]],    // Brown variations
      [[50, 50, 50], [100, 50, 70]],    // Charcoal, maroon
      [[85, 65, 45], [60, 90, 60]],     // Leather, green
      [[40, 35, 30], [80, 40, 40]],     // Almost black, dark red
      [[95, 75, 55], [50, 50, 100]]     // Light brown, blue
    ];
    
    const colorSet = colors[Math.min(level - 1, colors.length - 1)];
    return colorSet[variant];
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
      this.handSpeed *= 0.85;
      
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
    this.reactionTime = 0;
    this.willFoul = false;
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
    
    // Holster (left side for opponent)
    p.fill(60, 40, 20);
    p.rect(-20, 22, 12, 25);
    
    // Gun
    if (this.hasDrawn) {
      p.fill(40, 40, 40);
      p.rect(-8, -25 + this.handY, 16, 6);
      p.rect(-23, -25 + this.handY, 15, 4);
      
      if (this.handY <= -45) {
        p.fill(255, 255, 0, 180);
        p.ellipse(-23, -23 + this.handY, 20, 20);
        p.fill(255, 200, 0, 150);
        p.ellipse(-23, -23 + this.handY, 12, 12);
      }
    } else {
      p.fill(40, 40, 40);
      p.rect(-18, 28, 8, 15);
    }
    
    // Arms
    p.fill(...this.skinColor);
    
    // Right arm (stationary)
    p.rect(17, -15, 8, 30);
    
    // Left arm (moves when drawing)
    p.push();
    p.translate(-17, -10);
    p.rotate(-this.handY * 0.02);
    p.rect(-8, 0, 8, 30 + this.handY * 0.3);
    p.pop();
    
    // Head
    p.fill(...this.skinColor);
    p.ellipse(0, -40, 30, 35);
    
    // Hat
    p.fill(...this.hatColor);
    p.ellipse(0, -52, 45, 15);
    p.rect(-12, -60, 24, 15);
    p.ellipse(0, -60, 24, 10);
    
    // Face
    p.fill(50, 30, 20);
    p.ellipse(-6, -42, 3, 4);
    p.ellipse(6, -42, 3, 4);
    
    // Menacing expression
    p.noFill();
    p.stroke(50, 30, 20);
    p.strokeWeight(2);
    p.arc(0, -30, 10, 8, 0, p.PI);
    
    // Level indicator on hat
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.level, 0, -56);
    
    p.pop();
  }
}