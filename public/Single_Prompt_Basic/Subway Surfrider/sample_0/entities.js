import { LANE_POSITIONS, PLAYER_SIZE, GRAVITY, JUMP_FORCE, LANE_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Player class
export class Player {
  constructor() {
    this.laneIndex = 1; // Middle lane
    this.x = LANE_POSITIONS[this.laneIndex];
    this.y = CANVAS_HEIGHT - 80;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.isJumping = false;
    this.isSliding = false;
    this.velocity = 0;
    this.slideTimer = 0;
    this.movingToLane = false;
    this.targetX = this.x;
    this.moveSpeed = 10;
    this.normalHeight = PLAYER_SIZE;
    this.slideHeight = PLAYER_SIZE / 2;
  }

  moveLeft() {
    if (this.laneIndex > 0 && !this.movingToLane) {
      this.laneIndex--;
      this.targetX = LANE_POSITIONS[this.laneIndex];
      this.movingToLane = true;
    }
  }

  moveRight() {
    if (this.laneIndex < 2 && !this.movingToLane) {
      this.laneIndex++;
      this.targetX = LANE_POSITIONS[this.laneIndex];
      this.movingToLane = true;
    }
  }

  jump() {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.velocity = JUMP_FORCE;
    }
  }

  slide() {
    if (!this.isSliding && !this.isJumping) {
      this.isSliding = true;
      this.slideTimer = 30; // Slide duration in frames
      this.height = this.slideHeight;
      this.y += (this.normalHeight - this.slideHeight);
    }
  }

  update() {
    // Handle lane movement
    if (this.movingToLane) {
      const dx = this.targetX - this.x;
      if (Math.abs(dx) < this.moveSpeed) {
        this.x = this.targetX;
        this.movingToLane = false;
      } else {
        this.x += Math.sign(dx) * this.moveSpeed;
      }
    }

    // Handle jumping
    if (this.isJumping) {
      this.y += this.velocity;
      this.velocity += GRAVITY;

      // Check if landed
      if (this.y >= CANVAS_HEIGHT - 80) {
        this.y = CANVAS_HEIGHT - 80;
        this.isJumping = false;
        this.velocity = 0;
      }
    }

    // Handle sliding
    if (this.isSliding) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.y -= (this.normalHeight - this.slideHeight);
        this.height = this.normalHeight;
      }
    }
  }

  getCollisionRect() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

// Obstacle class
export class Obstacle {
  constructor(type, laneIndex) {
    this.type = type; // 'train', 'barrier', 'tunnel'
    this.laneIndex = laneIndex;
    this.x = LANE_POSITIONS[laneIndex];
    this.y = -50; // Start above the screen
    this.baseGroundY = CANVAS_HEIGHT - 80; // Player's ground level
    
    if (type === 'train') {
      this.width = LANE_WIDTH * 0.8;
      this.height = PLAYER_SIZE * 1.2;
      this.requiresJump = false;
      this.requiresSlide = false;
      this.groundY = this.baseGroundY; // Train at ground level
    } else if (type === 'barrier') {
      this.width = LANE_WIDTH * 0.7;
      this.height = PLAYER_SIZE / 2;
      this.requiresJump = true;
      this.requiresSlide = false;
      this.groundY = this.baseGroundY + PLAYER_SIZE / 4; // Barrier sits on ground
    } else if (type === 'tunnel') {
      this.width = LANE_WIDTH * 0.7;
      this.height = PLAYER_SIZE / 2;
      this.requiresJump = false;
      this.requiresSlide = true;
      this.groundY = this.baseGroundY - PLAYER_SIZE / 2; // Tunnel hangs above
    }
  }

  update(speed) {
    this.y += speed;
  }

  isVisible() {
    return this.y > -100 && this.y < CANVAS_HEIGHT + 50;
  }

  // Get the actual Y position for drawing/collision when obstacle is in play area
  getActualY() {
    // Calculate offset from the base ground to maintain relative position
    const offsetFromBase = this.groundY - this.baseGroundY;
    return this.y + offsetFromBase;
  }

  getCollisionRect() {
    const actualY = this.getActualY();
    return {
      x: this.x - this.width / 2,
      y: actualY - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

// Coin class
export class Coin {
  constructor(laneIndex) {
    this.laneIndex = laneIndex;
    this.x = LANE_POSITIONS[laneIndex];
    this.y = -30; // Start above the screen
    this.radius = 15;
    this.collected = false;
  }

  update(speed) {
    this.y += speed;
  }

  isVisible() {
    return this.y > -50 && this.y < CANVAS_HEIGHT + 50 && !this.collected;
  }
}