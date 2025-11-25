// player.js - Player character implementation
import { GRAVITY, JUMP_FORCE, DOUBLE_JUMP_FORCE, MOVE_SPEED, SPRINT_MULTIPLIER, LADDER_CLIMB_SPEED, HAT_TYPE, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.canDoubleJump = true;
    this.facing = 1; // 1 = right, -1 = left
    this.onLadder = false;
    this.climbing = false;
    this.currentLadder = null;
    this.health = 3;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.animFrame = 0;
  }

  update(p, gameState) {
    // Handle invincibility
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Animation
    if (Math.abs(this.vx) > 0.5 || this.climbing) {
      this.animFrame += 0.2;
    }

    // Check ladder collision
    this.onLadder = false;
    this.currentLadder = null;
    for (let ladder of gameState.ladders) {
      if (this.x + this.width / 2 > ladder.x && 
          this.x + this.width / 2 < ladder.x + ladder.width &&
          this.y + this.height > ladder.y &&
          this.y < ladder.y + ladder.height) {
        this.onLadder = true;
        this.currentLadder = ladder;
        break;
      }
    }

    // Ladder climbing
    if (this.climbing && this.onLadder) {
      this.vy = 0;
      this.vx = 0;
    } else {
      this.climbing = false;
      // Apply gravity
      if (!this.onGround) {
        this.vy += GRAVITY;
      }
    }

    // Cap fall speed
    if (this.vy > 15) this.vy = 15;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    this.onGround = false;
    for (let platform of gameState.platforms) {
      if (this.vx > 0) { // Moving right
        if (this.x + this.width > platform.x &&
            this.x < platform.x &&
            this.y + this.height > platform.y + 5 &&
            this.y < platform.y + platform.height - 5) {
          this.x = platform.x - this.width;
          this.vx = 0;
        }
      } else if (this.vx < 0) { // Moving left
        if (this.x < platform.x + platform.width &&
            this.x + this.width > platform.x + platform.width &&
            this.y + this.height > platform.y + 5 &&
            this.y < platform.y + platform.height - 5) {
          this.x = platform.x + platform.width;
          this.vx = 0;
        }
      }

      // Vertical collision
      if (this.vy > 0) { // Falling
        if (this.x + this.width > platform.x + 2 &&
            this.x < platform.x + platform.width - 2 &&
            this.y + this.height > platform.y &&
            this.y + this.height < platform.y + platform.height &&
            this.y < platform.y) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.onGround = true;
          this.canDoubleJump = true;
        }
      } else if (this.vy < 0) { // Jumping up
        if (this.x + this.width > platform.x + 2 &&
            this.x < platform.x + platform.width - 2 &&
            this.y < platform.y + platform.height &&
            this.y > platform.y) {
          this.y = platform.y + platform.height;
          this.vy = 0;
        }
      }
    }

    // World boundaries
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > gameState.worldWidth) {
      this.x = gameState.worldWidth - this.width;
    }

    // Check for pit death
    if (this.y > CANVAS_HEIGHT + 50) {
      this.health = 0;
    }

    // Friction
    if (this.onGround && !this.climbing) {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
  }

  jump() {
    if (this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    } else if (this.canDoubleJump) {
      this.vy = DOUBLE_JUMP_FORCE;
      this.canDoubleJump = false;
    }
  }

  moveLeft(sprint = false) {
    const speed = sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    this.vx = -speed;
    this.facing = -1;
  }

  moveRight(sprint = false) {
    const speed = sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    this.vx = speed;
    this.facing = 1;
  }

  climbUp() {
    if (this.onLadder) {
      this.climbing = true;
      this.vy = -LADDER_CLIMB_SPEED;
      this.y += this.vy;
    }
  }

  climbDown() {
    if (this.onLadder) {
      this.climbing = true;
      this.vy = LADDER_CLIMB_SPEED;
      this.y += this.vy;
    }
  }

  takeDamage() {
    if (!this.invincible && this.health > 0) {
      this.health--;
      this.invincible = true;
      this.invincibleTimer = 120; // 2 seconds at 60fps
      return true;
    }
    return false;
  }

  draw(p, camera) {
    p.push();
    
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Invincibility flicker
    if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      p.pop();
      return;
    }

    // Body (purple dress)
    p.fill(138, 43, 226);
    p.noStroke();
    p.rect(screenX + 6, screenY + 18, 12, 18, 0, 0, 5, 5);

    // Head (skin tone)
    p.fill(255, 220, 177);
    p.ellipse(screenX + 12, screenY + 12, 14, 16);

    // Hat (current hat type)
    this.drawHat(p, screenX + 12, screenY + 6);

    // Eyes
    p.fill(0);
    const eyeOffset = Math.sin(this.animFrame) * 0.5;
    p.ellipse(screenX + 9, screenY + 11 + eyeOffset, 2, 3);
    p.ellipse(screenX + 15, screenY + 11 + eyeOffset, 2, 3);

    // Legs
    p.fill(138, 43, 226);
    const legSwing = Math.abs(this.vx) > 0.5 ? Math.sin(this.animFrame * 2) * 2 : 0;
    p.rect(screenX + 7, screenY + 32, 4, 6);
    p.rect(screenX + 13, screenY + 32, 4, 6);

    // Cape
    p.fill(200, 100, 255, 150);
    p.beginShape();
    p.vertex(screenX + 12, screenY + 20);
    p.vertex(screenX + 4, screenY + 22);
    p.vertex(screenX + 6, screenY + 32);
    p.vertex(screenX + 18, screenY + 32);
    p.vertex(screenX + 20, screenY + 22);
    p.endShape(p.CLOSE);

    p.pop();
  }

  drawHat(p, x, y) {
    p.push();
    p.fill(100, 50, 150);
    
    // Different hat styles
    if (this.currentHat === HAT_TYPE.SPRINT) {
      // Sprint hat - sleek cap
      p.fill(255, 69, 0);
      p.ellipse(x, y, 16, 8);
      p.triangle(x - 6, y, x + 6, y, x + 10, y - 4);
    } else if (this.currentHat === HAT_TYPE.BREWING) {
      // Brewing hat - witch hat
      p.fill(75, 0, 130);
      p.triangle(x - 8, y, x + 8, y, x, y - 12);
      p.ellipse(x, y, 18, 6);
    } else if (this.currentHat === HAT_TYPE.DIMENSION) {
      // Dimension hat - mask
      p.fill(139, 69, 19);
      p.rect(x - 8, y - 4, 16, 8, 2);
      p.fill(0);
      p.ellipse(x - 4, y, 3, 4);
      p.ellipse(x + 4, y, 3, 4);
    } else {
      // Default top hat
      p.fill(100, 50, 150);
      p.rect(x - 6, y - 8, 12, 8);
      p.ellipse(x, y, 16, 6);
    }
    
    p.pop();
  }

  getScreenPosition(camera) {
    return {
      x: this.x - camera.x,
      y: this.y - camera.y
    };
  }
}