// entities.js - Game entities (Player, Rings, Obstacles)

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  NUM_LANES,
  LANE_WIDTH,
  LANE_Y,
  PLAYER_SIZE,
  NECK_SEGMENT_HEIGHT,
  SEGMENT_WIDTH,
  PLAYER_COLORS
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lane = 1; // 0, 1, 2 (left, center, right)
    this.targetX = this.getLaneX(this.lane);
    this.velocityY = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.size = PLAYER_SIZE;
    this.jumpPower = -8;
    this.gravity = 0.4;
  }

  getLaneX(lane) {
    const startX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    return startX + lane * LANE_WIDTH + LANE_WIDTH / 2;
  }

  moveLeft() {
    if (this.lane > 0) {
      this.lane--;
      this.targetX = this.getLaneX(this.lane);
    }
  }

  moveRight() {
    if (this.lane < NUM_LANES - 1) {
      this.lane++;
      this.targetX = this.getLaneX(this.lane);
    }
  }

  jump() {
    if (!this.isJumping && !this.isDucking) {
      this.velocityY = this.jumpPower;
      this.isJumping = true;
    }
  }

  duck() {
    if (!this.isJumping) {
      this.isDucking = true;
    }
  }

  stopDucking() {
    this.isDucking = false;
  }

  update() {
    // Smooth horizontal movement
    const dx = this.targetX - this.x;
    this.x += dx * 0.2;

    // Vertical movement
    this.velocityY += this.gravity;
    this.y += this.velocityY;

    // Ground collision
    const groundY = LANE_Y;
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isJumping = false;
    }
  }

  getHeadY(neckLength) {
    const duckOffset = this.isDucking ? 15 : 0;
    return this.y - neckLength * NECK_SEGMENT_HEIGHT + duckOffset;
  }

  getCollisionBox(neckLength) {
    const headY = this.getHeadY(neckLength);
    return {
      x: this.x - this.size / 2,
      y: headY - this.size / 2,
      width: this.size,
      height: this.y - headY + this.size / 2
    };
  }
}

export class Ring {
  constructor(x, y, lane, colorIndex) {
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.colorIndex = colorIndex;
    this.radius = 15;
    this.collected = false;
    this.thickness = 4;
    this.rotation = 0;
  }

  update(speed) {
    this.x -= speed;
    this.rotation += 0.05;
  }

  isOffScreen() {
    return this.x < -50;
  }

  checkCollision(player, neckLength) {
    if (this.collected) return false;
    
    const headY = player.getHeadY(neckLength);
    const dist = Math.sqrt(
      Math.pow(this.x - player.x, 2) + 
      Math.pow(this.y - headY, 2)
    );
    
    return dist < this.radius + player.size / 2;
  }
}

export class Obstacle {
  constructor(x, lane, type, minNeckHeight = 0) {
    this.x = x;
    this.lane = lane;
    this.type = type; // "barrier", "zipline", "low_barrier"
    this.minNeckHeight = minNeckHeight;
    this.width = 40;
    this.height = this.getHeight();
    this.y = this.getY();
    this.passed = false;
  }

  getHeight() {
    switch(this.type) {
      case "barrier":
        return 80;
      case "zipline":
        return 5;
      case "low_barrier":
        return 40;
      default:
        return 60;
    }
  }

  getY() {
    switch(this.type) {
      case "barrier":
        return LANE_Y - this.height;
      case "zipline":
        return LANE_Y - 100;
      case "low_barrier":
        return LANE_Y - this.height;
      default:
        return LANE_Y - this.height;
    }
  }

  update(speed) {
    this.x -= speed;
  }

  isOffScreen() {
    return this.x < -this.width - 20;
  }

  checkCollision(player, neckLength) {
    if (this.passed) return false;
    
    // Check if player is in the same lane
    const playerLane = player.lane;
    if (playerLane !== this.lane) return false;

    // Check horizontal overlap
    const playerLeft = player.x - player.size / 2;
    const playerRight = player.x + player.size / 2;
    const obsLeft = this.x;
    const obsRight = this.x + this.width;

    if (playerRight < obsLeft || playerLeft > obsRight) {
      return false;
    }

    // Type-specific collision
    if (this.type === "zipline") {
      // Must reach the zipline with head
      const headY = player.getHeadY(neckLength);
      if (headY > this.y + 10) {
        // Head is below zipline - collision
        if (neckLength < this.minNeckHeight) {
          return true;
        }
      }
    } else if (this.type === "low_barrier") {
      // Can duck under it
      if (player.isDucking) {
        return false;
      }
      const headY = player.getHeadY(neckLength);
      if (headY < this.y + this.height) {
        return true;
      }
    } else if (this.type === "barrier") {
      // Must jump over or have tall neck
      const headY = player.getHeadY(neckLength);
      const bodyBottom = player.y;
      
      if (bodyBottom > this.y && headY < this.y + this.height) {
        return true;
      }
    }

    return false;
  }
}