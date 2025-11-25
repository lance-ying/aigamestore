// player.js
import { gameState, GRAVITY, JUMP_STRENGTH, MOVE_SPEED, DASH_SPEED, DASH_DURATION, GROUND_POUND_SPEED } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.velX = 0;
    this.velY = 0;
    this.onGround = false;
    this.facing = 1; // 1 for right, -1 for left
    this.dashing = false;
    this.dashTimer = 0;
    this.groundPounding = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(p) {
    // Handle dashing
    if (this.dashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.dashing = false;
      }
    }

    // Apply gravity
    if (!this.onGround && !this.groundPounding) {
      this.velY += GRAVITY;
    }

    // Ground pound
    if (this.groundPounding) {
      this.velY = GROUND_POUND_SPEED;
      this.velX *= 0.95;
    }

    // Apply velocity
    this.x += this.velX;
    this.y += this.velY;

    // Limit fall speed
    if (this.velY > 20) this.velY = 20;

    // Animation
    this.animTimer++;
    if (this.animTimer > 6) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Check if fell off bottom
    if (this.y > gameState.cameraY + 500) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  moveLeft() {
    if (this.dashing) return;
    this.velX = -MOVE_SPEED;
    this.facing = -1;
  }

  moveRight() {
    if (this.dashing) return;
    this.velX = MOVE_SPEED;
    this.facing = 1;
  }

  jump() {
    if (this.onGround && !this.dashing) {
      this.velY = JUMP_STRENGTH;
      this.onGround = false;
    }
  }

  dash() {
    if (!this.dashing && !this.groundPounding) {
      this.dashing = true;
      this.dashTimer = DASH_DURATION;
      this.velX = DASH_SPEED * this.facing;
      this.velY = 0;
    }
  }

  groundPound() {
    if (!this.onGround && !this.groundPounding) {
      this.groundPounding = true;
      this.velY = 0;
    }
  }

  stopGroundPound() {
    this.groundPounding = false;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y - gameState.cameraY);
    
    // Draw player (Peppino-inspired character)
    if (this.dashing) {
      // Dashing effect
      p.fill(255, 200, 100);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        p.ellipse(-this.facing * i * 8, this.height / 2, this.width - i * 4, this.height - i * 4);
      }
    }

    // Body
    p.fill(255, 220, 180);
    p.noStroke();
    p.ellipse(0, this.height / 2, this.width, this.height);

    // Chef hat
    p.fill(255);
    p.rect(-this.width / 4, 2, this.width / 2, 8);
    p.ellipse(0, 6, this.width * 0.7, 12);

    // Eyes
    p.fill(0);
    const eyeOffset = this.dashing ? 3 : 0;
    p.ellipse(-4 * this.facing + eyeOffset * this.facing, this.height / 2 - 4, 4, 6);
    p.ellipse(2 * this.facing + eyeOffset * this.facing, this.height / 2 - 4, 4, 6);

    // Mustache
    p.fill(50, 30, 20);
    p.arc(0, this.height / 2 + 4, 12, 8, 0, p.PI);

    // Arms (animated)
    p.fill(255, 220, 180);
    const armSwing = p.sin(this.animFrame * p.PI / 2) * 10;
    p.ellipse(-this.width / 2 - 2, this.height / 2 + 4 + armSwing, 8, 12);
    p.ellipse(this.width / 2 + 2, this.height / 2 + 4 - armSwing, 8, 12);

    // Ground pound effect
    if (this.groundPounding) {
      p.stroke(255, 100, 100);
      p.strokeWeight(3);
      p.noFill();
      p.ellipse(0, this.height, this.width * 1.5, 10);
    }

    p.pop();
  }
}