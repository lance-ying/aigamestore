// player.js - Player (Jelly) class
import { CANVAS_HEIGHT, SHAPE_TALL, SHAPE_SHORT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.shape = SHAPE_TALL;
    
    // Tall shape dimensions
    this.tallWidth = 30;
    this.tallHeight = 60;
    
    // Short shape dimensions
    this.shortWidth = 60;
    this.shortHeight = 30;
    
    // Current dimensions (interpolated)
    this.currentWidth = this.tallWidth;
    this.currentHeight = this.tallHeight;
    
    // Target dimensions
    this.targetWidth = this.tallWidth;
    this.targetHeight = this.tallHeight;
    
    // Transition speed
    this.transitionSpeed = 0.2;
    
    // Visual properties
    this.baseColor = [100, 200, 255];
    this.jellyFeverColor = [255, 100, 200];
    this.wobblePhase = 0;
    this.wobbleSpeed = 0.1;
  }
  
  setShape(shape) {
    this.shape = shape;
    if (shape === SHAPE_TALL) {
      this.targetWidth = this.tallWidth;
      this.targetHeight = this.tallHeight;
    } else {
      this.targetWidth = this.shortWidth;
      this.targetHeight = this.shortHeight;
    }
  }
  
  update(jellyFeverActive) {
    // Smooth transition to target dimensions
    this.currentWidth += (this.targetWidth - this.currentWidth) * this.transitionSpeed;
    this.currentHeight += (this.targetHeight - this.currentHeight) * this.transitionSpeed;
    
    // Update wobble animation
    this.wobblePhase += this.wobbleSpeed;
    
    // Keep player vertically centered
    this.y = CANVAS_HEIGHT / 2;
  }
  
  draw(jellyFeverActive) {
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Wobble effect
    const wobbleAmount = p.sin(this.wobblePhase) * 2;
    
    // Choose color based on jelly fever state
    const color = jellyFeverActive ? this.jellyFeverColor : this.baseColor;
    
    // Draw jelly body with gradient effect
    p.noStroke();
    
    // Main body
    p.fill(...color, 180);
    p.ellipse(wobbleAmount, 0, this.currentWidth, this.currentHeight);
    
    // Highlight
    p.fill(255, 255, 255, 100);
    p.ellipse(wobbleAmount - this.currentWidth * 0.15, -this.currentHeight * 0.15, 
              this.currentWidth * 0.4, this.currentHeight * 0.4);
    
    // Inner glow
    p.fill(...color, 50);
    p.ellipse(wobbleAmount, 0, this.currentWidth * 0.7, this.currentHeight * 0.7);
    
    // Eyes
    const eyeY = -this.currentHeight * 0.15;
    const eyeSpacing = this.currentWidth * 0.25;
    
    p.fill(0, 0, 0, 200);
    p.ellipse(-eyeSpacing, eyeY, 4, 6);
    p.ellipse(eyeSpacing, eyeY, 4, 6);
    
    // Shine on eyes
    p.fill(255, 255, 255, 180);
    p.ellipse(-eyeSpacing - 1, eyeY - 1, 2, 2);
    p.ellipse(eyeSpacing - 1, eyeY - 1, 2, 2);
    
    p.pop();
  }
  
  getBounds() {
    return {
      x: this.x - this.currentWidth / 2,
      y: this.y - this.currentHeight / 2,
      width: this.currentWidth,
      height: this.currentHeight
    };
  }
}