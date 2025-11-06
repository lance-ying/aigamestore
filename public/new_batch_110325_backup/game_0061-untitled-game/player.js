// player.js - Player entity and controls

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, KEY_CODES } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.worldX = x;
    this.worldY = y;
    this.angle = 0;
    this.speed = 2;
    this.runSpeed = 4;
    this.turnSpeed = 0.05;
    this.isRunning = false;
    this.viewDistance = 80;
  }

  update(p) {
    const currentSpeed = this.isRunning ? this.runSpeed : this.speed;
    
    // Forward/backward movement
    if (p.keyIsDown(KEY_CODES.UP_ARROW)) {
      this.worldX += Math.cos(this.angle) * currentSpeed;
      this.worldY += Math.sin(this.angle) * currentSpeed;
    }
    if (p.keyIsDown(KEY_CODES.DOWN_ARROW)) {
      this.worldX -= Math.cos(this.angle) * currentSpeed * 0.5;
      this.worldY -= Math.sin(this.angle) * currentSpeed * 0.5;
    }
    
    // Rotation
    if (p.keyIsDown(KEY_CODES.LEFT_ARROW)) {
      this.angle -= this.turnSpeed;
    }
    if (p.keyIsDown(KEY_CODES.RIGHT_ARROW)) {
      this.angle += this.turnSpeed;
    }
    
    // Update game state
    gameState.playerX = this.worldX;
    gameState.playerY = this.worldY;
    gameState.playerAngle = this.angle;
    gameState.isRunning = this.isRunning;
    
    // Keep angle normalized
    if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    if (this.angle < 0) this.angle += Math.PI * 2;
  }

  toggleRun() {
    this.isRunning = !this.isRunning;
  }

  getViewTarget() {
    return {
      x: this.worldX + Math.cos(this.angle) * this.viewDistance,
      y: this.worldY + Math.sin(this.angle) * this.viewDistance
    };
  }

  distanceToPoint(x, y) {
    const dx = x - this.worldX;
    const dy = y - this.worldY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isLookingAt(x, y, tolerance = 0.5) {
    const dx = x - this.worldX;
    const dy = y - this.worldY;
    const angleToTarget = Math.atan2(dy, dx);
    let diff = Math.abs(this.angle - angleToTarget);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff < tolerance;
  }
}