// player.js - Player character class

import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;
  }

  update(boatY, islands) {
    // Apply gravity
    this.vy += GRAVITY;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision (boat deck)
    const deckY = boatY - 40;
    if (this.y + this.height >= deckY && this.y + this.height <= deckY + 20) {
      if (Math.abs(this.x - CANVAS_WIDTH / 2) < 150) {
        this.y = deckY - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    } else {
      this.onGround = false;
    }
    
    // Island collisions
    for (let island of islands) {
      if (island.active && this.checkIslandCollision(island)) {
        this.y = island.y - this.height;
        this.vy = 0;
        this.onGround = true;
      }
    }
    
    // Boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;
    if (this.y > CANVAS_HEIGHT) {
      this.y = deckY - this.height;
      this.vy = 0;
    }
    
    // Reset horizontal velocity
    this.vx = 0;
  }

  checkIslandCollision(island) {
    return this.x + this.width > island.x &&
           this.x < island.x + island.width &&
           this.y + this.height >= island.y &&
           this.y + this.height <= island.y + 20 &&
           this.vy >= 0;
  }

  moveLeft() {
    this.vx = -PLAYER_SPEED;
    this.facingRight = false;
  }

  moveRight() {
    this.vx = PLAYER_SPEED;
    this.facingRight = true;
  }

  jump() {
    if (this.onGround) {
      this.vy = PLAYER_JUMP_FORCE;
      this.onGround = false;
    }
  }

  draw(p) {
    p.push();
    
    // Body (dress-like shape)
    p.fill(100, 150, 200);
    p.triangle(
      this.x + this.width / 2, this.y + 8,
      this.x + 2, this.y + this.height,
      this.x + this.width - 2, this.y + this.height
    );
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(this.x + this.width / 2, this.y + 5, 12, 12);
    
    // Hair
    p.fill(80, 60, 40);
    p.arc(this.x + this.width / 2, this.y + 5, 14, 14, p.PI, p.TWO_PI);
    
    // Eyes
    p.fill(0);
    const eyeOffsetX = this.facingRight ? 2 : -2;
    p.ellipse(this.x + this.width / 2 + eyeOffsetX, this.y + 5, 2, 2);
    
    // Arms
    p.stroke(255, 220, 180);
    p.strokeWeight(2);
    p.line(this.x + this.width / 2 - 5, this.y + 12, this.x + this.width / 2 - 10, this.y + 20);
    p.line(this.x + this.width / 2 + 5, this.y + 12, this.x + this.width / 2 + 10, this.y + 20);
    p.noStroke();
    
    p.pop();
  }
}