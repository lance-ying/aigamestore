// player.js - Player class and logic
import { gameState, PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, TILE_SIZE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.speed = PLAYER_SPEED;
    this.direction = 0; // 0: down, 1: right, 2: up, 3: left
    this.hiding = false;
    this.hidingSpot = null;
    this.animFrame = 0;
    this.isMoving = false;
    this.moveSpeed = 8; // Pixels per frame for smooth interpolation
  }

  update(p) {
    if (this.hiding) return;

    // Check for held keys and move continuously
    if (gameState.controlMode === "HUMAN" && gameState.keysPressed) {
      let dx = 0;
      let dy = 0;
      let moving = false;

      // Check arrow keys (support multiple keys for diagonal movement)
      if (gameState.keysPressed[37]) { // Left
        dx -= 1;
        this.direction = 3;
        moving = true;
      }
      if (gameState.keysPressed[39]) { // Right
        dx += 1;
        this.direction = 1;
        moving = true;
      }
      if (gameState.keysPressed[38]) { // Up
        dy -= 1;
        this.direction = 2;
        moving = true;
      }
      if (gameState.keysPressed[40]) { // Down
        dy += 1;
        this.direction = 0;
        moving = true;
      }

      if (moving) {
        // Normalize diagonal movement
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude > 0) {
          dx /= magnitude;
          dy /= magnitude;
        }

        // Apply speed multiplier
        const currentSpeed = gameState.isRunning ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
        dx *= currentSpeed;
        dy *= currentSpeed;

        // Calculate new position
        const newX = this.x + dx;
        const newY = this.y + dy;

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

        // Check door collisions (doors block movement when closed/locked)
        for (const door of gameState.doors) {
          if (!door.open) {
            if (this.checkCollision(newX, this.y, door)) {
              canMoveX = false;
            }
            if (this.checkCollision(this.x, newY, door)) {
              canMoveY = false;
            }
          }
        }

        // Apply movement
        if (canMoveX) this.x = newX;
        if (canMoveY) this.y = newY;

        // Update animation
        this.animFrame += 0.2;
        this.isMoving = true;
      } else {
        this.isMoving = false;
      }
    } else {
      // For automated testing, use the old tap-based movement
      // Smooth interpolation to target position
      if (this.isMoving) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) {
          // Reached target
          this.x = this.targetX;
          this.y = this.targetY;
          this.isMoving = false;
        } else {
          // Move towards target
          const moveAmount = Math.min(this.moveSpeed, dist);
          this.x += (dx / dist) * moveAmount;
          this.y += (dy / dist) * moveAmount;
          this.animFrame += 0.2;
        }
      }
    }

    // Clamp to canvas
    this.x = p.constrain(this.x, this.width / 2, p.width - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, p.height - this.height / 2);
  }

  // Tap-based movement: each tap moves a fixed distance with smooth animation
  // This is kept for automated testing
  moveByTap(direction, sprint, p) {
    if (this.hiding) return;
    if (this.isMoving) return; // Don't accept new commands until current movement finishes

    // Movement distance per tap (reduced for corridor navigation)
    const normalDistance = 16;   // Half a tile for precise control
    const sprintDistance = 24;   // 3/4 tile for faster movement
    const distance = sprint ? sprintDistance : normalDistance;

    let dx = 0;
    let dy = 0;

    // Set direction and calculate movement vector
    switch(direction) {
      case 'left':
        dx = -distance;
        this.direction = 3;
        break;
      case 'right':
        dx = distance;
        this.direction = 1;
        break;
      case 'up':
        dy = -distance;
        this.direction = 2;
        break;
      case 'down':
        dy = distance;
        this.direction = 0;
        break;
    }

    const newX = this.x + dx;
    const newY = this.y + dy;

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

    // Check door collisions (doors block movement when closed/locked)
    for (const door of gameState.doors) {
      if (!door.open) {
        if (this.checkCollision(newX, this.y, door)) {
          canMoveX = false;
        }
        if (this.checkCollision(this.x, newY, door)) {
          canMoveY = false;
        }
      }
    }

    // Set target position for smooth movement
    if (canMoveX) this.targetX = newX;
    if (canMoveY) this.targetY = newY;

    // Clamp target to canvas
    if (p) {
      this.targetX = p.constrain(this.targetX, this.width / 2, p.width - this.width / 2);
      this.targetY = p.constrain(this.targetY, this.height / 2, p.height - this.height / 2);
    }

    // Start moving if target changed
    if (this.targetX !== this.x || this.targetY !== this.y) {
      this.isMoving = true;
    }
  }

  checkCollision(x, y, obstacle) {
    return x - this.width / 2 < obstacle.x + obstacle.w &&
           x + this.width / 2 > obstacle.x &&
           y - this.height / 2 < obstacle.y + obstacle.h &&
           y + this.height / 2 > obstacle.y;
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