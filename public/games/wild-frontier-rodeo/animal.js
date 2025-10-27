// animal.js - Animal entities

import { ANIMAL_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Animal {
  constructor(type, x, y, speedMultiplier) {
    const config = ANIMAL_TYPES[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = config.width;
    this.height = config.height;
    this.ridingDuration = config.ridingDuration;
    this.jumpHeight = config.jumpHeight;
    this.color = config.color;
    this.velocityX = -2 * config.speedMultiplier * speedMultiplier;
    this.isActive = true;
    this.animationOffset = Math.random() * 100;
  }

  update(frameCount) {
    this.x += this.velocityX;

    // Remove if off screen
    if (this.x < -this.width - 50) {
      this.isActive = false;
    }
  }

  draw(p, frameCount) {
    p.push();
    p.rectMode(p.CORNER);
    
    // Body
    p.fill(...this.color);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 5);
    
    // Type-specific features
    if (this.type === 'ZEBRA') {
      // Stripes
      p.fill(0);
      for (let i = 0; i < 4; i++) {
        p.rect(this.x - this.width / 2 + i * 20, this.y - this.height / 2, 10, this.height);
      }
    } else if (this.type === 'GIRAFFE') {
      // Neck
      p.fill(...this.color);
      p.rect(this.x - 10, this.y - this.height / 2 - 20, 20, 20);
      // Head
      p.ellipse(this.x, this.y - this.height / 2 - 30, 20, 20);
      // Spots
      p.fill(160, 110, 40);
      p.ellipse(this.x - 15, this.y - 10, 12, 12);
      p.ellipse(this.x + 10, this.y - 5, 10, 10);
      p.ellipse(this.x, this.y + 8, 11, 11);
    } else if (this.type === 'ELEPHANT') {
      // Trunk
      p.fill(...this.color);
      p.rect(this.x - this.width / 2 - 15, this.y, 15, 20, 5);
      // Ears
      p.ellipse(this.x - this.width / 4, this.y - this.height / 2 + 5, 25, 35);
      p.ellipse(this.x + this.width / 4, this.y - this.height / 2 + 5, 25, 35);
    } else if (this.type === 'COW') {
      // Spots
      p.fill(101, 67, 33);
      p.ellipse(this.x - 15, this.y - 10, 20, 15);
      p.ellipse(this.x + 15, this.y + 5, 18, 18);
    }
    
    // Legs (simple animation)
    const legOffset = Math.sin((frameCount + this.animationOffset) * 0.2) * 3;
    p.fill(60, 40, 20);
    // Front left leg
    p.rect(this.x - this.width / 3 - 3, this.y + this.height / 2, 6, 15 + legOffset);
    // Front right leg
    p.rect(this.x - this.width / 3 + 10 - 3, this.y + this.height / 2, 6, 15 - legOffset);
    // Back left leg
    p.rect(this.x + this.width / 3 - 10 - 3, this.y + this.height / 2, 6, 15 - legOffset);
    // Back right leg
    p.rect(this.x + this.width / 3 - 3, this.y + this.height / 2, 6, 15 + legOffset);
    
    p.pop();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
}