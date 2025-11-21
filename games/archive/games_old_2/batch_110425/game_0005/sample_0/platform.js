// platform.js - Platform entity

import { gameState, PLATFORM_HEIGHT, COLOR_PINK, COLOR_YELLOW } from './globals.js';

export class Platform {
  constructor(p, x, y, width, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = PLATFORM_HEIGHT;
    this.color = color;
  }

  render() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;

    p.push();
    p.strokeWeight(2);
    p.stroke(0);
    
    if (this.color === COLOR_PINK) {
      p.fill(255, 100, 150);
    } else {
      p.fill(255, 220, 50);
    }
    
    p.rect(screenX, this.y, this.width, this.height);
    
    // Add pattern
    p.noStroke();
    if (this.color === COLOR_PINK) {
      p.fill(255, 150, 200, 100);
    } else {
      p.fill(255, 240, 100, 100);
    }
    
    for (let i = 0; i < this.width; i += 15) {
      p.ellipse(screenX + i, this.y + this.height / 2, 6, 6);
    }
    
    p.pop();
  }

  isPlayerOn(player) {
    return player.x + player.size / 2 > this.x &&
           player.x - player.size / 2 < this.x + this.width &&
           player.y + player.size / 2 >= this.y &&
           player.y + player.size / 2 <= this.y + this.height + 10 &&
           player.vy >= 0;
  }
}