// player.js - Player entity and logic

import {
  gameState,
  LANE_Y_POSITIONS,
  NUM_LANES,
  STATE_RUNNING,
  STATE_JUMPING,
  STATE_SLIDING,
  STATE_INVULNERABLE,
  PENGUIN_WIDTH,
  PENGUIN_HEIGHT,
  PENGUIN_SLIDE_HEIGHT,
  JUMP_DURATION,
  SLIDE_DURATION,
  CANVAS_WIDTH
} from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.lane = 1;
    this.x = 150;
    this.y = LANE_Y_POSITIONS[this.lane];
    this.baseY = this.y;
    this.width = PENGUIN_WIDTH;
    this.height = PENGUIN_HEIGHT;
    this.state = STATE_RUNNING;
    this.actionTimer = 0;
    this.jumpStartY = 0;
    this.legAnimation = 0;
    this.flashTimer = 0;
  }

  update() {
    // Update action timers
    if (this.actionTimer > 0) {
      this.actionTimer--;
      
      if (this.state === STATE_JUMPING) {
        const progress = 1 - (this.actionTimer / JUMP_DURATION);
        const jumpHeight = 80;
        this.y = this.jumpStartY - Math.sin(progress * Math.PI) * jumpHeight;
      }
      
      if (this.actionTimer === 0) {
        if (this.state === STATE_JUMPING) {
          this.y = this.baseY;
        }
        this.state = STATE_RUNNING;
        this.height = PENGUIN_HEIGHT;
      }
    }

    // Update leg animation for running
    if (this.state === STATE_RUNNING) {
      this.legAnimation += 0.2;
    }

    // Update flash timer for invulnerability
    if (gameState.invulnerabilityTimer > 0) {
      this.flashTimer++;
    } else {
      this.flashTimer = 0;
    }
  }

  jump() {
    if (this.state === STATE_RUNNING) {
      this.state = STATE_JUMPING;
      this.actionTimer = JUMP_DURATION;
      this.jumpStartY = this.baseY;
    }
  }

  slide() {
    if (this.state === STATE_RUNNING) {
      this.state = STATE_SLIDING;
      this.actionTimer = SLIDE_DURATION;
      this.height = PENGUIN_SLIDE_HEIGHT;
    }
  }

  changeLane(direction) {
    const newLane = this.lane + direction;
    if (newLane >= 0 && newLane < NUM_LANES) {
      this.lane = newLane;
      this.baseY = LANE_Y_POSITIONS[this.lane];
      if (this.state !== STATE_JUMPING) {
        this.y = this.baseY;
      }
    }
  }

  draw() {
    this.p.push();
    
    // Flash effect during invulnerability
    const isInvulnerable = gameState.invulnerabilityTimer > 0;
    const shouldShow = !isInvulnerable || Math.floor(this.flashTimer / 10) % 2 === 0;
    
    if (!shouldShow) {
      this.p.pop();
      return;
    }

    // Shield effect
    if (gameState.powerUp.active && gameState.powerUp.type === 'shield') {
      this.p.noFill();
      this.p.stroke(100, 200, 255, 150);
      this.p.strokeWeight(3);
      this.p.ellipse(this.x, this.y, this.width + 20, this.height + 20);
    }

    // Magnet effect
    if (gameState.powerUp.active && gameState.powerUp.type === 'magnet') {
      for (let i = 0; i < 8; i++) {
        const angle = (this.p.frameCount * 0.05 + i * Math.PI / 4);
        const radius = 25 + Math.sin(this.p.frameCount * 0.1 + i) * 5;
        const px = this.x + Math.cos(angle) * radius;
        const py = this.y + Math.sin(angle) * radius;
        this.p.fill(255, 200, 0, 200);
        this.p.noStroke();
        this.p.ellipse(px, py, 4, 4);
      }
    }

    // Penguin body
    this.p.fill(20, 20, 40);
    this.p.noStroke();
    
    if (this.state === STATE_SLIDING) {
      // Flattened sliding pose
      this.p.ellipse(this.x, this.y + 5, this.width * 1.3, this.height * 0.6);
      this.p.fill(255, 255, 255);
      this.p.ellipse(this.x, this.y + 5, this.width * 0.8, this.height * 0.4);
    } else {
      // Normal body
      let rotation = 0;
      if (this.state === STATE_JUMPING) {
        const progress = 1 - (this.actionTimer / JUMP_DURATION);
        rotation = Math.sin(progress * Math.PI) * 0.2;
      }
      
      this.p.push();
      this.p.translate(this.x, this.y);
      this.p.rotate(rotation);
      
      this.p.ellipse(0, 0, this.width, this.height);
      
      // Belly
      this.p.fill(255, 255, 255);
      this.p.ellipse(0, 5, this.width * 0.6, this.height * 0.7);
      
      // Eyes
      this.p.fill(255);
      this.p.ellipse(-6, -8, 6, 8);
      this.p.ellipse(6, -8, 6, 8);
      this.p.fill(0);
      this.p.ellipse(-6, -6, 3, 4);
      this.p.ellipse(6, -6, 3, 4);
      
      // Beak
      this.p.fill(255, 140, 0);
      this.p.triangle(-3, -2, 3, -2, 0, 3);
      
      // Feet (animated when running)
      if (this.state === STATE_RUNNING) {
        const footOffset = Math.sin(this.legAnimation) * 3;
        this.p.fill(255, 140, 0);
        this.p.ellipse(-8 + footOffset, this.height / 2 - 2, 8, 5);
        this.p.ellipse(8 - footOffset, this.height / 2 - 2, 8, 5);
      }
      
      this.p.pop();
    }

    this.p.pop();
  }

  getCollisionBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}