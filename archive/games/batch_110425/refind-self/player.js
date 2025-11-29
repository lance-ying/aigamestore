// player.js - Player character class and logic

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.vx = 0;
    this.vy = 0;
    
    // Visual properties
    this.color = [80, 150, 255];
    this.angle = 0;
    this.targetAngle = 0;
    
    // Animation
    this.walkPhase = 0;
    this.isMoving = false;
  }
  
  update(p) {
    // Smooth rotation
    const angleDiff = this.targetAngle - this.angle;
    this.angle += angleDiff * 0.2;
    
    // Apply velocity
    const newX = this.x + this.vx;
    const newY = this.y + this.vy;
    
    // Boundary check
    if (newX >= 16 && newX <= CANVAS_WIDTH - 16) {
      this.x = newX;
    }
    if (newY >= 16 && newY <= CANVAS_HEIGHT - 16) {
      this.y = newY;
    }
    
    // Update walk animation
    if (this.isMoving) {
      this.walkPhase += 0.2;
    } else {
      this.walkPhase = 0;
    }
    
    // Reset velocity
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
  }
  
  move(dx, dy, isSprinting = false) {
    if (dx !== 0 || dy !== 0) {
      const speed = isSprinting ? this.sprintSpeed : this.speed;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      this.vx = (dx / magnitude) * speed;
      this.vy = (dy / magnitude) * speed;
      this.isMoving = true;
      
      // Update target angle based on movement direction
      this.targetAngle = Math.atan2(dy, dx);
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Body (rectangle with rounded corners)
    p.fill(...this.color);
    p.stroke(60, 120, 200);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 4);
    
    // Eye indicator
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(6, 0, 6);
    
    // Walking animation - leg indicators
    if (this.isMoving) {
      const legOffset = Math.sin(this.walkPhase) * 3;
      p.fill(60, 120, 200);
      p.circle(-4, 8 + legOffset, 4);
      p.circle(-4, -8 - legOffset, 4);
    }
    
    p.pop();
  }
  
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}