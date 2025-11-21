// obstacle.js - Obstacle entity

import { gameState } from './globals.js';

export class Obstacle {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;

    p.push();
    p.fill(30, 30, 40);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Add danger stripes
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    for (let i = 0; i < this.width; i += 10) {
      p.line(screenX + i, this.y, screenX + i + 5, this.y + this.height);
    }
    p.pop();
  }

  checkCollision(player) {
    return player.x + player.size / 2 > this.x &&
           player.x - player.size / 2 < this.x + this.width &&
           player.y + player.size / 2 > this.y &&
           player.y - player.size / 2 < this.y + this.height;
  }
}