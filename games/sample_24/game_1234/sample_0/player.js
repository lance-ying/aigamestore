// player.js - Player class and related functions

import { PLAYER_STATES, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.width = 30;
    this.height = 50;
    this.state = PLAYER_STATES.RUNNING;
    this.velocityY = 0;
    this.gravity = 0.8;
    this.jumpForce = -15;
    this.groundY = y;
    this.jumpDuration = 0;
    this.slideDuration = 0;
    this.slideTimer = 0;
    this.jumpTimer = 0;
    this.lane = 0; // -1 = left, 0 = center, 1 = right
    this.targetX = x;
    this.laneWidth = 100;
  }

  jump() {
    if (this.state === PLAYER_STATES.RUNNING) {
      this.state = PLAYER_STATES.JUMPING;
      this.velocityY = this.jumpForce;
      this.jumpTimer = 0;
    }
  }

  slide() {
    if (this.state === PLAYER_STATES.RUNNING) {
      this.state = PLAYER_STATES.SLIDING;
      this.slideTimer = 0;
    }
  }

  turnLeft() {
    if (this.lane > -1) {
      this.lane--;
      this.targetX = CANVAS_WIDTH / 2 + this.lane * this.laneWidth;
    }
  }

  turnRight() {
    if (this.lane < 1) {
      this.lane++;
      this.targetX = CANVAS_WIDTH / 2 + this.lane * this.laneWidth;
    }
  }

  update() {
    // Update lane position smoothly
    const lerpSpeed = 0.15;
    this.x += (this.targetX - this.x) * lerpSpeed;

    // Handle jumping
    if (this.state === PLAYER_STATES.JUMPING) {
      this.velocityY += this.gravity;
      this.y += this.velocityY;
      this.jumpTimer++;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.velocityY = 0;
        this.state = PLAYER_STATES.RUNNING;
        this.jumpTimer = 0;
      }
    }

    // Handle sliding
    if (this.state === PLAYER_STATES.SLIDING) {
      this.slideTimer++;
      if (this.slideTimer > 30) {
        this.state = PLAYER_STATES.RUNNING;
        this.slideTimer = 0;
      }
    }
  }

  getCollisionBox() {
    if (this.state === PLAYER_STATES.SLIDING) {
      return {
        x: this.x - this.width / 2,
        y: this.y + 20,
        width: this.width,
        height: this.height - 20
      };
    }
    return {
      x: this.x - this.width / 2,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  render(p) {
    p.push();
    
    // Draw player based on state
    const box = this.getCollisionBox();
    
    if (this.state === PLAYER_STATES.JUMPING) {
      p.fill(100, 255, 100);
    } else if (this.state === PLAYER_STATES.SLIDING) {
      p.fill(255, 100, 100);
    } else if (this.state === PLAYER_STATES.DEAD) {
      p.fill(150, 50, 50);
    } else {
      p.fill(100, 150, 255);
    }

    p.rect(box.x, box.y, box.width, box.height);
    
    // Draw a simple face
    p.fill(255);
    p.ellipse(this.x - 7, this.y + 15, 5, 5);
    p.ellipse(this.x + 7, this.y + 15, 5, 5);
    
    p.pop();
  }
}