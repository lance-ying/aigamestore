// player.js - Player character class
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.speed = 2.5;
    this.sprintMultiplier = 1.6;
    this.vx = 0;
    this.vy = 0;
    this.color = [100, 150, 255];
    this.isSprinting = false;
    this.facing = 1; // 1 = right, -1 = left
    this.animationFrame = 0;
    this.invulnerableFrames = 0;
  }

  update(keys) {
    // Reset velocity
    this.vx = 0;
    this.vy = 0;

    // Movement
    if (keys.left) {
      this.vx = -this.speed;
      this.facing = -1;
    }
    if (keys.right) {
      this.vx = this.speed;
      this.facing = 1;
    }
    if (keys.up) {
      this.vy = -this.speed;
    }
    if (keys.down) {
      this.vy = this.speed;
    }

    // Sprint
    this.isSprinting = keys.shift && (this.vx !== 0 || this.vy !== 0);
    if (this.isSprinting) {
      this.vx *= this.sprintMultiplier;
      this.vy *= this.sprintMultiplier;
    }

    // Normalize diagonal movement
    if (this.vx !== 0 && this.vy !== 0) {
      const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.vx = (this.vx / mag) * (this.isSprinting ? this.speed * this.sprintMultiplier : this.speed);
      this.vy = (this.vy / mag) * (this.isSprinting ? this.speed * this.sprintMultiplier : this.speed);
    }

    // Apply movement
    this.x += this.vx;
    this.y += this.vy;

    // Boundary constraints
    this.x = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(CANVAS_HEIGHT - this.height / 2, this.y));

    // Animation
    if (this.vx !== 0 || this.vy !== 0) {
      this.animationFrame += 0.2;
    }

    // Update invulnerability
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames--;
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Draw invulnerability effect
    const isInvulnerable = this.invulnerableFrames > 0;
    if (isInvulnerable && Math.floor(this.animationFrame) % 2 === 0) {
      p.pop();
      return; // Flashing effect
    }

    // Body
    p.fill(...this.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 4);

    // Head
    p.fill(255, 220, 180);
    p.ellipse(0, -this.height / 2 + 8, 16, 16);

    // Lab coat details
    p.fill(255);
    p.rect(this.facing * 4, 4, 8, 20, 2);

    // Eyes
    p.fill(50);
    p.ellipse(this.facing * 3, -this.height / 2 + 7, 3, 3);

    // Sprint indicator
    if (this.isSprinting) {
      p.stroke(150, 200, 255, 100);
      p.strokeWeight(2);
      p.noFill();
      p.ellipse(0, 0, this.width + 8, this.height + 8);
    }

    p.pop();
  }

  takeDamage(amount) {
    if (this.invulnerableFrames > 0) return false;
    
    gameState.memoryIntegrity -= amount;
    this.invulnerableFrames = 60; // 1 second of invulnerability
    return true;
  }
}