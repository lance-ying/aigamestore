// player.js - Player class

import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.size = 30;
    this.color = [100, 150, 255];
    this.type = 'player';
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
  }

  update() {
    // Player position is managed by hotspot navigation
  }

  draw(p) {
    p.push();
    // Draw player as a simple character
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    // Body
    p.ellipse(this.x, this.y, this.size, this.size * 1.5);
    // Head
    p.fill(255, 220, 180);
    p.ellipse(this.x, this.y - 25, this.size * 0.8);
    // Eyes
    p.fill(0);
    p.noStroke();
    p.ellipse(this.x - 5, this.y - 27, 3);
    p.ellipse(this.x + 5, this.y - 27, 3);
    p.pop();
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}