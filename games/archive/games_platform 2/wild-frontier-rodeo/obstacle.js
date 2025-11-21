// obstacle.js - Obstacle entities

import { CANVAS_WIDTH } from './globals.js';

export class Obstacle {
  constructor(type, x, y, speedMultiplier) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.velocityX = -2 * speedMultiplier;
    this.isActive = true;

    if (type === 'ROCK') {
      this.width = 30;
      this.height = 30;
      this.color = [100, 100, 100];
    } else if (type === 'TREE') {
      this.width = 20;
      this.height = 60;
      this.color = [34, 139, 34];
    } else if (type === 'FENCE') {
      this.width = 15;
      this.height = 50;
      this.color = [139, 90, 43];
    }
  }

  update() {
    this.x += this.velocityX;

    if (this.x < -this.width - 50) {
      this.isActive = false;
    }
  }

  draw(p) {
    p.push();
    p.rectMode(p.CORNER);
    
    if (this.type === 'ROCK') {
      p.fill(...this.color);
      p.ellipse(this.x, this.y, this.width, this.height);
      p.fill(80, 80, 80);
      p.ellipse(this.x - 5, this.y - 5, 15, 15);
    } else if (this.type === 'TREE') {
      // Trunk
      p.fill(101, 67, 33);
      p.rect(this.x - 8, this.y - 20, 16, 40);
      // Foliage
      p.fill(...this.color);
      p.ellipse(this.x, this.y - 35, 40, 40);
      p.ellipse(this.x - 15, this.y - 25, 30, 30);
      p.ellipse(this.x + 15, this.y - 25, 30, 30);
    } else if (this.type === 'FENCE') {
      p.fill(...this.color);
      p.rect(this.x - this.width / 2, this.y - this.height, this.width, this.height);
      // Horizontal bars
      p.fill(120, 80, 50);
      p.rect(this.x - this.width / 2 - 10, this.y - this.height + 10, this.width + 20, 5);
      p.rect(this.x - this.width / 2 - 10, this.y - this.height + 30, this.width + 20, 5);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height,
      bottom: this.y
    };
  }
}