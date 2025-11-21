// player.js - Player entity

import { gameState, PLAYER_SIZE, PLAYER_JUMP_FORCE, GRAVITY, COLOR_PINK, COLOR_YELLOW, GROUND_Y } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.color = COLOR_PINK;
    this.size = PLAYER_SIZE;
    this.isGrounded = false;
    this.isJumping = false;
    this.trail = [];
  }

  jump() {
    if (this.isGrounded && !this.isJumping) {
      this.vy = PLAYER_JUMP_FORCE;
      this.isJumping = true;
      this.isGrounded = false;
    }
  }

  switchColor(newColor) {
    if (newColor === COLOR_PINK || newColor === COLOR_YELLOW) {
      this.color = newColor;
    }
  }

  update() {
    // Apply gravity
    this.vy += GRAVITY;
    this.y += this.vy;

    // Add to trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) {
      this.trail.shift();
    }

    // Check if landed
    if (this.isJumping && this.vy > 0) {
      this.isJumping = false;
    }

    // Prevent falling through floor (safety)
    if (this.y > GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.isGrounded = true;
    }
  }

  render() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;

    // Draw trail
    p.push();
    p.noStroke();
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = p.map(i, 0, this.trail.length - 1, 0, 100);
      const trailScreenX = t.x - gameState.cameraX;
      
      if (this.color === COLOR_PINK) {
        p.fill(255, 100, 150, alpha);
      } else {
        p.fill(255, 220, 50, alpha);
      }
      p.ellipse(trailScreenX, t.y, this.size * 0.6);
    }
    p.pop();

    // Draw player body
    p.push();
    p.strokeWeight(2);
    p.stroke(0);
    
    if (this.color === COLOR_PINK) {
      p.fill(255, 100, 150);
    } else {
      p.fill(255, 220, 50);
    }
    
    // Main body
    p.ellipse(screenX, this.y, this.size, this.size);
    
    // Eyes
    p.fill(255);
    p.ellipse(screenX - 6, this.y - 4, 8, 10);
    p.ellipse(screenX + 6, this.y - 4, 8, 10);
    p.fill(0);
    p.ellipse(screenX - 6, this.y - 3, 4, 6);
    p.ellipse(screenX + 6, this.y - 3, 4, 6);
    
    // Smile
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.arc(screenX, this.y + 3, 12, 8, 0, this.p.PI);
    
    p.pop();
  }

  getGameX() {
    return this.x;
  }

  getGameY() {
    return this.y;
  }

  getScreenX() {
    return this.x - gameState.cameraX;
  }

  getScreenY() {
    return this.y;
  }
}