// player.js - Player entity

import { TILE_SIZE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 0.8;
    this.height = TILE_SIZE * 0.8;
    this.speed = 2;
    this.direction = 0; // 0: down, 1: right, 2: up, 3: left
    this.moving = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }
  
  update() {
    if (this.moving) {
      this.animTimer++;
      if (this.animTimer >= 10) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }
  
  move(dx, dy, worldWidth, worldHeight) {
    const newX = this.x + dx;
    const newY = this.y + dy;
    
    // Simple boundary check
    if (newX >= 0 && newX <= worldWidth - this.width &&
        newY >= 0 && newY <= worldHeight - this.height) {
      this.x = newX;
      this.y = newY;
      this.moving = true;
      
      // Update direction
      if (dx > 0) this.direction = 1;
      else if (dx < 0) this.direction = 3;
      else if (dy > 0) this.direction = 0;
      else if (dy < 0) this.direction = 2;
    }
  }
  
  stopMoving() {
    this.moving = false;
  }
  
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}