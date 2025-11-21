// player.js - Player entity
import { TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, MAX_FALL_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE - 4;
    this.height = TILE_SIZE - 4;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.interacting = false;
    this.animFrame = 0;
    this.animCounter = 0;
  }

  update(platforms, movableBlocks) {
    // Apply gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL_SPEED) {
      this.vy = MAX_FALL_SPEED;
    }

    // Apply horizontal movement
    this.x += this.vx;
    this.checkHorizontalCollisions(platforms, movableBlocks);

    // Apply vertical movement
    this.y += this.vy;
    this.onGround = false;
    this.checkVerticalCollisions(platforms, movableBlocks);

    // Animation
    this.animCounter++;
    if (this.animCounter > 8) {
      this.animCounter = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Boundary check
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;
  }

  checkHorizontalCollisions(platforms, movableBlocks) {
    const allColliders = [...platforms, ...movableBlocks];
    
    for (let obj of allColliders) {
      if (this.collidesWith(obj)) {
        if (this.vx > 0) {
          this.x = obj.x - this.width;
        } else if (this.vx < 0) {
          this.x = obj.x + obj.width;
        }
        this.vx = 0;
      }
    }
  }

  checkVerticalCollisions(platforms, movableBlocks) {
    const allColliders = [...platforms, ...movableBlocks];
    
    for (let obj of allColliders) {
      if (this.collidesWith(obj)) {
        if (this.vy > 0) {
          this.y = obj.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = obj.y + obj.height;
          this.vy = 0;
        }
      }
    }
  }

  collidesWith(obj) {
    return this.x < obj.x + obj.width &&
           this.x + this.width > obj.x &&
           this.y < obj.y + obj.height &&
           this.y + this.height > obj.y;
  }

  moveLeft() {
    this.vx = -MOVE_SPEED;
    this.facing = -1;
  }

  moveRight() {
    this.vx = MOVE_SPEED;
    this.facing = 1;
  }

  stopMove() {
    this.vx = 0;
  }

  jump() {
    if (this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    }
  }

  render(p, currentWorld) {
    p.push();
    
    // Player body with world-specific tint
    if (currentWorld === 'NORMAL') {
      p.fill(100, 150, 255);
      p.stroke(70, 120, 225);
    } else {
      p.fill(200, 100, 255);
      p.stroke(170, 70, 225);
    }
    
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 3);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    const eyeOffset = this.facing === 1 ? 6 : 4;
    p.circle(this.x + eyeOffset, this.y + 6, 4);
    p.circle(this.x + eyeOffset + 6, this.y + 6, 4);
    
    // Pupils
    p.fill(0);
    p.circle(this.x + eyeOffset + this.facing, this.y + 6, 2);
    p.circle(this.x + eyeOffset + 6 + this.facing, this.y + 6, 2);
    
    // Animation - moving legs
    if (Math.abs(this.vx) > 0 && this.onGround) {
      p.stroke(currentWorld === 'NORMAL' ? 70 : 170, currentWorld === 'NORMAL' ? 120 : 70, 225);
      p.strokeWeight(2);
      const legOffset = this.animFrame % 2 === 0 ? 2 : -2;
      p.line(this.x + 4, this.y + this.height, this.x + 4 + legOffset, this.y + this.height + 4);
      p.line(this.x + this.width - 4, this.y + this.height, this.x + this.width - 4 - legOffset, this.y + this.height + 4);
    }
    
    p.pop();
  }
}