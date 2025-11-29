// player.js - Player entity and controls
import { gameState } from './globals.js';

export class Player {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle; // viewing direction in radians
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.turnSpeed = 0.05;
    this.radius = 10;
    this.isSprinting = false;
  }
  
  move(dx, dy, walls) {
    const speed = this.isSprinting && gameState.stamina > 0 ? this.sprintSpeed : this.speed;
    
    // Calculate movement based on viewing angle
    const moveX = dx * Math.cos(this.angle) - dy * Math.sin(this.angle);
    const moveY = dx * Math.sin(this.angle) + dy * Math.cos(this.angle);
    
    const newX = this.x + moveX * speed;
    const newY = this.y + moveY * speed;
    
    // Check collision with walls
    if (!this.checkWallCollision(newX, this.y, walls)) {
      this.x = newX;
    }
    if (!this.checkWallCollision(this.x, newY, walls)) {
      this.y = newY;
    }
    
    // Deplete stamina when sprinting
    if (this.isSprinting && (dx !== 0 || dy !== 0)) {
      gameState.stamina = Math.max(0, gameState.stamina - 0.5);
    }
  }
  
  turn(direction) {
    this.angle += direction * this.turnSpeed;
  }
  
  checkWallCollision(x, y, walls) {
    for (let wall of walls) {
      const collide = window.gameInstance.collideCircleRect(
        x, y, this.radius * 2,
        wall.x, wall.y, wall.w, wall.h
      );
      if (collide) return true;
    }
    return false;
  }
  
  update(p) {
    // Regenerate stamina when not sprinting
    if (!this.isSprinting || gameState.stamina === 0) {
      gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 0.3);
    }
  }
  
  render(p) {
    p.push();
    p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    
    // Draw simple player indicator (triangle pointing forward)
    p.fill(100, 200, 255);
    p.noStroke();
    p.triangle(0, -15, -10, 10, 10, 10);
    
    p.pop();
  }
}