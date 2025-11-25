// spirit.js - Spirit character class

import { CANVAS_WIDTH, SPIRIT_STATE_WAITING, SPIRIT_STATE_ON_BOAT, SPIRIT_STATE_RELEASED } from './globals.js';

export class Spirit {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 0, 1, 2 for different spirits
    this.state = SPIRIT_STATE_WAITING;
    this.happiness = 0;
    this.maxHappiness = 100;
    this.width = 25;
    this.height = 35;
    this.floatOffset = 0;
    this.floatSpeed = 0.03;
    this.colors = this.getSpiritColors(type);
    this.boatX = 0; // Position on boat
    this.name = this.getSpiritName(type);
  }

  getSpiritColors(type) {
    switch (type) {
      case 0: return { body: [150, 100, 200], glow: [180, 130, 230] }; // Purple
      case 1: return { body: [100, 200, 150], glow: [130, 230, 180] }; // Green
      case 2: return { body: [200, 150, 100], glow: [230, 180, 130] }; // Orange
      default: return { body: [150, 150, 200], glow: [180, 180, 230] };
    }
  }

  getSpiritName(type) {
    const names = ["Willow", "River", "Ember"];
    return names[type] || "Spirit";
  }

  update(boatX, boatY) {
    this.floatOffset += this.floatSpeed;
    
    if (this.state === SPIRIT_STATE_ON_BOAT) {
      // Position on boat based on type
      const spacing = 50;
      this.boatX = boatX + (this.type - 1) * spacing;
      this.x = this.boatX;
      this.y = boatY - 50 + Math.sin(this.floatOffset) * 5;
    } else if (this.state === SPIRIT_STATE_WAITING) {
      this.y = this.y + Math.sin(this.floatOffset) * 2;
    }
  }

  feed() {
    if (this.state === SPIRIT_STATE_ON_BOAT) {
      this.happiness = Math.min(this.happiness + 25, this.maxHappiness);
      return true;
    }
    return false;
  }

  isReady() {
    return this.happiness >= this.maxHappiness;
  }

  pickUp() {
    if (this.state === SPIRIT_STATE_WAITING) {
      this.state = SPIRIT_STATE_ON_BOAT;
      return true;
    }
    return false;
  }

  release() {
    if (this.state === SPIRIT_STATE_ON_BOAT && this.isReady()) {
      this.state = SPIRIT_STATE_RELEASED;
      return true;
    }
    return false;
  }

  draw(p) {
    if (this.state === SPIRIT_STATE_RELEASED) return;
    
    p.push();
    
    // Glow effect
    p.fill(...this.colors.glow, 50);
    p.noStroke();
    p.ellipse(this.x, this.y, this.width + 20, this.height + 20);
    
    // Body
    p.fill(...this.colors.body, 200);
    p.ellipse(this.x, this.y, this.width, this.height);
    
    // Eyes
    p.fill(255, 255, 255, 180);
    p.ellipse(this.x - 6, this.y - 3, 6, 8);
    p.ellipse(this.x + 6, this.y - 3, 6, 8);
    p.fill(0, 0, 0, 150);
    p.ellipse(this.x - 6, this.y - 2, 3, 4);
    p.ellipse(this.x + 6, this.y - 2, 3, 4);
    
    // Mouth (smile if happy)
    if (this.happiness > 50) {
      p.noFill();
      p.stroke(...this.colors.body, 250);
      p.strokeWeight(2);
      p.arc(this.x, this.y + 5, 10, 8, 0, p.PI);
      p.noStroke();
    }
    
    // Happiness indicator (hearts when ready)
    if (this.state === SPIRIT_STATE_ON_BOAT) {
      p.fill(255, 100, 100, 200);
      const hearts = Math.floor(this.happiness / 25);
      for (let i = 0; i < hearts; i++) {
        const hx = this.x - 10 + i * 7;
        const hy = this.y - 25;
        this.drawHeart(p, hx, hy, 5);
      }
    }
    
    // Indicator when waiting
    if (this.state === SPIRIT_STATE_WAITING) {
      p.fill(255, 255, 100);
      p.textSize(16);
      p.textAlign(p.CENTER);
      p.text("!", this.x, this.y - 25);
    }
    
    p.pop();
  }

  drawHeart(p, x, y, size) {
    p.beginShape();
    p.vertex(x, y + size / 2);
    p.bezierVertex(x, y, x + size, y, x + size, y + size / 2);
    p.bezierVertex(x + size, y + size, x, y + size * 1.5, x, y + size * 1.5);
    p.bezierVertex(x, y + size * 1.5, x - size, y + size, x - size, y + size / 2);
    p.bezierVertex(x - size, y, x, y, x, y + size / 2);
    p.endShape();
  }

  drawNameTag(p) {
    if (this.state === SPIRIT_STATE_ON_BOAT) {
      p.push();
      p.fill(0, 0, 0, 150);
      p.rect(this.x - 25, this.y + 20, 50, 15, 3);
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.name, this.x, this.y + 27);
      p.pop();
    }
  }
}