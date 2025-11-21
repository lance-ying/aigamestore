// dice.js - Dice class and related functions

export class Dice {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.value = 1;
    this.rotation = 0;
    this.isSelected = false;
    this.isScoring = false;
    this.animX = x;
    this.animY = y;
    this.animRotation = 0;
  }

  roll(p) {
    this.value = Math.floor(p.random(1, 7));
    this.isSelected = false;
    this.isScoring = false;
  }

  draw(p, isHighlighted) {
    p.push();
    p.translate(this.animX, this.animY);
    p.rotate(this.animRotation);
    
    // Draw die background
    if (this.isSelected) {
      p.fill(100, 255, 100);
      p.strokeWeight(3);
      p.stroke(0, 200, 0);
    } else if (isHighlighted) {
      p.fill(255, 255, 200);
      p.strokeWeight(2);
      p.stroke(200, 200, 100);
    } else {
      p.fill(255);
      p.strokeWeight(2);
      p.stroke(50);
    }
    
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size, this.size, 5);
    
    // Draw pips
    p.fill(0);
    p.noStroke();
    const pipSize = this.size * 0.12;
    const offset = this.size * 0.25;
    
    if (this.value === 1) {
      p.circle(0, 0, pipSize);
    } else if (this.value === 2) {
      p.circle(-offset, -offset, pipSize);
      p.circle(offset, offset, pipSize);
    } else if (this.value === 3) {
      p.circle(-offset, -offset, pipSize);
      p.circle(0, 0, pipSize);
      p.circle(offset, offset, pipSize);
    } else if (this.value === 4) {
      p.circle(-offset, -offset, pipSize);
      p.circle(offset, -offset, pipSize);
      p.circle(-offset, offset, pipSize);
      p.circle(offset, offset, pipSize);
    } else if (this.value === 5) {
      p.circle(-offset, -offset, pipSize);
      p.circle(offset, -offset, pipSize);
      p.circle(0, 0, pipSize);
      p.circle(-offset, offset, pipSize);
      p.circle(offset, offset, pipSize);
    } else if (this.value === 6) {
      p.circle(-offset, -offset, pipSize);
      p.circle(offset, -offset, pipSize);
      p.circle(-offset, 0, pipSize);
      p.circle(offset, 0, pipSize);
      p.circle(-offset, offset, pipSize);
      p.circle(offset, offset, pipSize);
    }
    
    p.pop();
  }
}

export function createDice(p) {
  const dice = [];
  const diceSize = 50;
  const spacing = 70;
  const startX = 150;
  const startY = 200;
  
  for (let i = 0; i < 6; i++) {
    const x = startX + (i % 3) * spacing;
    const y = startY + Math.floor(i / 3) * spacing;
    dice.push(new Dice(x, y, diceSize));
  }
  
  return dice;
}