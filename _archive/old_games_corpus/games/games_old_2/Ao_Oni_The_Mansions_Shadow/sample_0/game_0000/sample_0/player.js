// player.js - Player class and logic
import { gameState, PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, TILE_SIZE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.speed = PLAYER_SPEED;
    this.direction = 0; // 0: down, 1: right, 2: up, 3: left
    this.hiding = false;
    this.hidingSpot = null;
    this.animFrame = 0;
  }

  update(p) {
    if (this.hiding) return;

    let dx = 0;
    let dy = 0;
    let moved = false;

    if (gameState.keysPressed[37]) { // Left
      dx = -1;
      this.direction = 3;
      moved = true;
    }
    if (gameState.keysPressed[39]) { // Right
      dx = 1;
      this.direction = 1;
      moved = true;
    }
    if (gameState.keysPressed[38]) { // Up
      dy = -1;
      this.direction = 2;
      moved = true;
    }
    if (gameState.keysPressed[40]) { // Down
      dy = 1;
      this.direction = 0;
      moved = true;
    }

    if (moved) {
      this.animFrame += 0.2;
    }

    const currentSpeed = gameState.isRunning ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    const newX = this.x + dx * currentSpeed;
    const newY = this.y + dy * currentSpeed;

    // Check wall collisions
    let canMoveX = true;
    let canMoveY = true;

    for (const wall of gameState.walls) {
      if (this.checkCollision(newX, this.y, wall)) {
        canMoveX = false;
      }
      if (this.checkCollision(this.x, newY, wall)) {
        canMoveY = false;
      }
    }

    if (canMoveX) this.x = newX;
    if (canMoveY) this.y = newY;

    // Clamp to canvas
    this.x = p.constrain(this.x, this.width / 2, p.width - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, p.height - this.height / 2);
  }

  checkCollision(x, y, wall) {
    return x - this.width / 2 < wall.x + wall.w &&
           x + this.width / 2 > wall.x &&
           y - this.height / 2 < wall.y + wall.h &&
           y + this.height / 2 > wall.y;
  }

  hide(spot) {
    this.hiding = true;
    this.hidingSpot = spot;
  }

  unhide() {
    this.hiding = false;
    this.hidingSpot = null;
  }

  render(p) {
    if (this.hiding) return;

    p.push();
    p.translate(this.x, this.y);
    
    // Player body
    p.fill(60, 60, 80);
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    // Direction indicator
    p.fill(200, 200, 220);
    p.noStroke();
    const dirX = [0, 6, 0, -6][this.direction];
    const dirY = [6, 0, -6, 0][this.direction];
    p.ellipse(dirX, dirY, 6, 6);
    
    // Eyes
    p.fill(255);
    p.ellipse(-3, -2, 4, 5);
    p.ellipse(3, -2, 4, 5);
    p.fill(0);
    p.ellipse(-3, -1, 2, 3);
    p.ellipse(3, -1, 2, 3);
    
    p.pop();
  }
}