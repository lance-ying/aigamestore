// wheel.js
import { gameState } from './globals.js';

export class Wheel {
  constructor() {
    this.x = 500;
    this.y = 80;
    this.radius = 50;
    this.segments = 6;
    this.values = [1, 2, 3, 4, 5, 6];
    this.colors = [
      [255, 100, 100],
      [100, 255, 100],
      [100, 100, 255],
      [255, 255, 100],
      [255, 100, 255],
      [100, 255, 255]
    ];
  }
  
  spin() {
    if (!gameState.wheelSpinning && !gameState.moving && !gameState.minigameActive) {
      gameState.wheelSpinning = true;
      gameState.wheelSpeed = 0.3 + Math.random() * 0.2;
      gameState.wheelValue = 0;
    }
  }
  
  update(p) {
    if (gameState.wheelSpinning) {
      gameState.wheelAngle += gameState.wheelSpeed;
      gameState.wheelSpeed *= 0.97; // Deceleration
      
      if (gameState.wheelSpeed < 0.01) {
        gameState.wheelSpinning = false;
        
        // Calculate final value
        const normalizedAngle = (gameState.wheelAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const segmentAngle = (Math.PI * 2) / this.segments;
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle);
        gameState.wheelValue = this.values[segmentIndex];
        
        // Start moving
        gameState.targetSpace = Math.min(gameState.currentSpace + gameState.wheelValue, gameState.boardPath.length - 1);
        gameState.moving = true;
        gameState.moveProgress = 0;
      }
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Wheel base
    p.fill(50);
    p.stroke(30);
    p.strokeWeight(3);
    p.circle(0, 0, this.radius * 2 + 10);
    
    // Segments
    const segmentAngle = (Math.PI * 2) / this.segments;
    for (let i = 0; i < this.segments; i++) {
      p.push();
      p.rotate(gameState.wheelAngle + i * segmentAngle);
      
      p.fill(...this.colors[i]);
      p.stroke(255);
      p.strokeWeight(2);
      p.arc(0, 0, this.radius * 2, this.radius * 2, 0, segmentAngle);
      
      // Number
      p.push();
      p.translate(this.radius * 0.6, 0);
      p.rotate(-gameState.wheelAngle - i * segmentAngle);
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(this.values[i], 0, 0);
      p.pop();
      
      p.pop();
    }
    
    // Center hub
    p.fill(255, 215, 0);
    p.stroke(255, 165, 0);
    p.strokeWeight(2);
    p.circle(0, 0, 20);
    
    // Pointer
    p.fill(255, 0, 0);
    p.noStroke();
    p.triangle(0, -this.radius - 5, -8, -this.radius - 15, 8, -this.radius - 15);
    
    p.pop();
    
    // Result display
    if (!gameState.wheelSpinning && gameState.wheelValue > 0 && !gameState.moving) {
      p.push();
      p.fill(255, 215, 0);
      p.stroke(255, 165, 0);
      p.strokeWeight(3);
      p.rect(this.x - 40, this.y + 60, 80, 30, 5);
      p.fill(0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text(`Move ${gameState.wheelValue}`, this.x, this.y + 75);
      p.pop();
    }
  }
}