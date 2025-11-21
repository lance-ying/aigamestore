// player.js - Player character class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 36;
    this.speed = 2.5;
    this.direction = 0; // 0=down, 1=right, 2=up, 3=left
    this.walkFrame = 0;
    this.walkSpeed = 0.15;
    this.isMoving = false;
  }

  update(keys, gameState) {
    this.isMoving = false;
    const oldX = this.x;
    const oldY = this.y;

    if (keys.left) {
      this.x -= this.speed;
      this.direction = 3;
      this.isMoving = true;
    }
    if (keys.right) {
      this.x += this.speed;
      this.direction = 1;
      this.isMoving = true;
    }
    if (keys.up) {
      this.y -= this.speed;
      this.direction = 2;
      this.isMoving = true;
    }
    if (keys.down) {
      this.y += this.speed;
      this.direction = 0;
      this.isMoving = true;
    }

    // Boundary checking
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = this.p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);

    // Check collision with obstacles in current area
    const area = gameState.areas?.[gameState.currentArea];
    if (area && area.obstacles) {
      for (let obs of area.obstacles) {
        if (this.checkCollision(obs)) {
          this.x = oldX;
          this.y = oldY;
          break;
        }
      }
    }

    if (this.isMoving) {
      this.walkFrame += this.walkSpeed;
      if (this.walkFrame >= 4) this.walkFrame = 0;
    } else {
      this.walkFrame = 0;
    }
  }

  checkCollision(obstacle) {
    return this.p.collideRectRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height
    );
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);

    // Draw Professor Layton
    // Body (brown coat)
    this.p.fill(101, 67, 33);
    this.p.rect(-10, 0, 20, 18);

    // Head
    this.p.fill(255, 220, 180);
    this.p.ellipse(0, -10, 16, 18);

    // Hat (iconic top hat)
    this.p.fill(40, 20, 10);
    this.p.rect(-8, -24, 16, 8);
    this.p.rect(-10, -28, 20, 4);

    // Eyes
    this.p.fill(0);
    this.p.ellipse(-3, -12, 2, 2);
    this.p.ellipse(3, -12, 2, 2);

    // Legs (simple animation)
    const legOffset = this.isMoving ? this.p.sin(this.walkFrame * this.p.PI) * 3 : 0;
    this.p.fill(50, 40, 30);
    this.p.rect(-6, 18, 5, 10 + legOffset);
    this.p.rect(1, 18, 5, 10 - legOffset);

    this.p.pop();
  }
}