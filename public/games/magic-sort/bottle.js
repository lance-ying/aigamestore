// bottle.js - Bottle class and utilities

import { COLORS } from './globals.js';

export class Bottle {
  constructor(x, y, capacity, contents = []) {
    this.x = x;
    this.y = y;
    this.capacity = capacity;
    this.contents = [...contents];
    this.width = 60;
    this.height = 180;
    this.targetX = x;
    this.targetY = y;
  }

  get isFull() {
    return this.contents.length >= this.capacity;
  }

  get isEmpty() {
    return this.contents.length === 0;
  }

  getTopColor() {
    if (this.isEmpty) return null;
    return this.contents[this.contents.length - 1];
  }

  getTopColorCount() {
    if (this.isEmpty) return 0;
    const topColor = this.getTopColor();
    let count = 0;
    for (let i = this.contents.length - 1; i >= 0; i--) {
      if (this.contents[i] === topColor) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  canPourInto(otherBottle) {
    if (this.isEmpty) return false;
    if (otherBottle.isFull) return false;
    
    const myTopColor = this.getTopColor();
    const otherTopColor = otherBottle.getTopColor();
    
    if (otherBottle.isEmpty) return true;
    if (myTopColor === otherTopColor) {
      const myTopCount = this.getTopColorCount();
      const availableSpace = otherBottle.capacity - otherBottle.contents.length;
      return availableSpace > 0;
    }
    
    return false;
  }

  pourInto(otherBottle) {
    if (!this.canPourInto(otherBottle)) return 0;
    
    const topColor = this.getTopColor();
    const topCount = this.getTopColorCount();
    const availableSpace = otherBottle.capacity - otherBottle.contents.length;
    const amountToPour = Math.min(topCount, availableSpace);
    
    return amountToPour;
  }

  draw(p, isSelected, isHighlighted, isValidDestination) {
    // Update position smoothly
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;

    p.push();
    
    // Selection glow
    if (isSelected) {
      p.stroke(255, 255, 0);
      p.strokeWeight(4);
      p.noFill();
      const glowSize = 8 + Math.sin(p.frameCount * 0.15) * 3;
      p.rect(this.x - glowSize/2, this.y - glowSize/2, this.width + glowSize, this.height + glowSize, 5);
    }
    
    // Highlight for keyboard navigation
    if (isHighlighted && !isSelected) {
      p.stroke(150, 150, 255);
      p.strokeWeight(3);
      p.noFill();
      p.rect(this.x - 4, this.y - 4, this.width + 8, this.height + 8, 5);
    }
    
    // Valid destination highlight
    if (isValidDestination) {
      p.stroke(50, 255, 50);
      p.strokeWeight(3);
      p.noFill();
      p.rect(this.x - 4, this.y - 4, this.width + 8, this.height + 8, 5);
    }
    
    // Bottle outline
    p.stroke(200, 220, 255, 200);
    p.strokeWeight(2);
    p.noFill();
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw water segments
    const segmentHeight = this.height / this.capacity;
    for (let i = 0; i < this.contents.length; i++) {
      const color = this.contents[i];
      const colorValues = COLORS[color];
      p.noStroke();
      p.fill(...colorValues);
      const segmentY = this.y + this.height - (i + 1) * segmentHeight;
      p.rect(this.x + 2, segmentY, this.width - 4, segmentHeight - 1, 2);
    }
    
    p.pop();
  }

  isUniform() {
    if (this.isEmpty) return true;
    if (this.contents.length < this.capacity) return false;
    
    const firstColor = this.contents[0];
    return this.contents.every(c => c === firstColor);
  }
}