// wheel.js - Wheel spinning logic

import { gameState, CATEGORIES, CROWN_SEGMENT } from './globals.js';

export class Wheel {
  constructor(p, x, y, radius) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.segments = [...CATEGORIES, CROWN_SEGMENT];
    this.segmentAngle = (2 * this.p.PI) / this.segments.length;
  }

  spin() {
    if (gameState.wheelSpinning) return;
    
    gameState.wheelSpinning = true;
    gameState.wheelSpinSpeed = this.p.random(15, 25);
    
    // Randomly select target segment
    const targetSegmentIndex = Math.floor(Math.random() * this.segments.length);
    const baseRotation = targetSegmentIndex * this.segmentAngle;
    const randomOffset = this.p.random(-this.segmentAngle * 0.3, this.segmentAngle * 0.3);
    
    // Add multiple full rotations for effect
    const fullRotations = this.p.random(3, 5) * 2 * this.p.PI;
    gameState.wheelTargetRotation = gameState.wheelRotation + fullRotations + baseRotation + randomOffset;
    
    gameState.selectedSegment = null;
  }

  update() {
    if (!gameState.wheelSpinning) return;
    
    const diff = gameState.wheelTargetRotation - gameState.wheelRotation;
    
    if (Math.abs(diff) < 0.01) {
      gameState.wheelRotation = gameState.wheelTargetRotation;
      gameState.wheelSpinning = false;
      gameState.wheelSpinSpeed = 0;
      
      // Determine selected segment
      const normalizedRotation = (gameState.wheelRotation % (2 * this.p.PI) + 2 * this.p.PI) % (2 * this.p.PI);
      const segmentIndex = Math.floor(normalizedRotation / this.segmentAngle) % this.segments.length;
      gameState.selectedSegment = this.segments[segmentIndex];
    } else {
      // Deceleration
      gameState.wheelSpinSpeed *= 0.96;
      gameState.wheelRotation += gameState.wheelSpinSpeed * 0.01;
    }
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.rotate(gameState.wheelRotation);
    
    // Draw segments
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const startAngle = i * this.segmentAngle - this.p.PI / 2;
      const endAngle = startAngle + this.segmentAngle;
      
      this.p.fill(...segment.color);
      this.p.stroke(255);
      this.p.strokeWeight(2);
      this.p.arc(0, 0, this.radius * 2, this.radius * 2, startAngle, endAngle, this.p.PIE);
      
      // Draw icon
      const midAngle = startAngle + this.segmentAngle / 2;
      const iconX = Math.cos(midAngle) * this.radius * 0.6;
      const iconY = Math.sin(midAngle) * this.radius * 0.6;
      
      this.p.push();
      this.p.translate(iconX, iconY);
      this.p.rotate(midAngle + this.p.PI / 2);
      this.p.fill(255);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(24);
      this.p.text(segment.icon, 0, 0);
      this.p.pop();
    }
    
    // Center circle
    this.p.fill(40);
    this.p.stroke(255);
    this.p.strokeWeight(2);
    this.p.circle(0, 0, 20);
    
    this.p.pop();
    
    // Draw pointer
    this.p.fill(255, 0, 0);
    this.p.noStroke();
    this.p.triangle(
      this.x, this.y - this.radius - 15,
      this.x - 10, this.y - this.radius - 5,
      this.x + 10, this.y - this.radius - 5
    );
  }
}