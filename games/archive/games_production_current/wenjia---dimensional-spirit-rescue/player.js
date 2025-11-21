// player.js
import { gameState, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_JUMP_FORCE, GRAVITY, MAX_FALL_SPEED, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpBuffer = 0;
    this.coyoteTime = 0;
  }

  update(p) {
    // Apply gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL_SPEED) {
      this.vy = MAX_FALL_SPEED;
    }

    // Horizontal movement
    this.vx = 0;
    if (gameState.keys.left) {
      this.vx = -PLAYER_SPEED;
    }
    if (gameState.keys.right) {
      this.vx = PLAYER_SPEED;
    }

    // Jump buffer and coyote time
    if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
    }
    if (this.coyoteTime > 0) {
      this.coyoteTime--;
    }

    // Jump logic
    if (gameState.keys.jump && (this.onGround || this.coyoteTime > 0) && this.jumpBuffer === 0) {
      this.vy = -PLAYER_JUMP_FORCE;
      this.jumpBuffer = 10;
      this.coyoteTime = 0;
      this.onGround = false;
    }

    // Store previous onGround state
    const wasOnGround = this.onGround;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Check platform collisions
    this.onGround = false;
    for (const platform of gameState.platforms) {
      if (platform.world === gameState.currentWorld || platform.world === 'BOTH') {
        if (this.checkPlatformCollision(platform, p)) {
          this.onGround = true;
        }
      }
    }

    // Update coyote time
    if (wasOnGround && !this.onGround) {
      this.coyoteTime = 5;
    }

    // Screen bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > 600) this.x = 600 - this.width;

    // Fall detection
    if (this.y > CANVAS_HEIGHT + 50) {
      return 'FALL';
    }

    return null;
  }

  checkPlatformCollision(platform, p) {
    const colliding = p.collideRectRect(
      this.x, this.y, this.width, this.height,
      platform.x, platform.y, platform.width, platform.height
    );

    if (colliding) {
      // Determine collision side
      const overlapLeft = (this.x + this.width) - platform.x;
      const overlapRight = (platform.x + platform.width) - this.x;
      const overlapTop = (this.y + this.height) - platform.y;
      const overlapBottom = (platform.y + platform.height) - this.y;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop && this.vy > 0) {
        // Landing on top
        this.y = platform.y - this.height;
        this.vy = 0;
        return true;
      } else if (minOverlap === overlapBottom && this.vy < 0) {
        // Hitting bottom
        this.y = platform.y + platform.height;
        this.vy = 0;
      } else if (minOverlap === overlapLeft) {
        // Hitting from left
        this.x = platform.x - this.width;
        this.vx = 0;
      } else if (minOverlap === overlapRight) {
        // Hitting from right
        this.x = platform.x + platform.width;
        this.vx = 0;
      }
    }

    return false;
  }

  checkEnemyCollision(enemy, p) {
    return p.collideRectRect(
      this.x, this.y, this.width, this.height,
      enemy.x, enemy.y, enemy.size, enemy.size
    );
  }

  checkSpiritCollision(spirit, p) {
    return p.collideRectCircle(
      this.x, this.y, this.width, this.height,
      spirit.x, spirit.y, spirit.size
    );
  }

  render(p) {
    p.push();
    
    // Draw based on current world
    if (gameState.currentWorld === 'MATERIAL') {
      // Material world - solid cat shape
      p.fill(255, 180, 100);
      p.stroke(200, 140, 60);
      p.strokeWeight(2);
      
      // Body
      p.rect(this.x + 4, this.y + 8, this.width - 8, this.height - 8, 4);
      
      // Head
      p.circle(this.x + this.width / 2, this.y + 6, 12);
      
      // Ears
      p.triangle(
        this.x + 6, this.y + 2,
        this.x + 9, this.y - 2,
        this.x + 10, this.y + 4
      );
      p.triangle(
        this.x + this.width - 6, this.y + 2,
        this.x + this.width - 9, this.y - 2,
        this.x + this.width - 10, this.y + 4
      );
      
      // Eyes
      p.fill(50);
      p.noStroke();
      p.circle(this.x + 9, this.y + 6, 3);
      p.circle(this.x + 15, this.y + 6, 3);
      
      // Tail
      p.stroke(200, 140, 60);
      p.strokeWeight(3);
      p.noFill();
      const tailX = this.x + this.width - 4;
      const tailY = this.y + 16;
      p.bezier(
        tailX, tailY,
        tailX + 6, tailY - 8,
        tailX + 8, tailY - 4,
        tailX + 10, tailY - 10
      );
    } else {
      // Energy world - ethereal energy creature
      p.noStroke();
      
      // Outer glow
      for (let i = 4; i > 0; i--) {
        const alpha = 50 - i * 10;
        p.fill(100, 200, 255, alpha);
        const offset = i * 2;
        p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 
                  this.width + offset, this.height + offset);
      }
      
      // Core energy body
      p.fill(150, 220, 255, 200);
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 
                this.width, this.height);
      
      // Bright center
      p.fill(200, 240, 255, 250);
      p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 
                this.width * 0.6, this.height * 0.6);
      
      // Energy particles
      const frameOffset = p.frameCount * 0.1;
      for (let i = 0; i < 3; i++) {
        const angle = frameOffset + i * 2.1;
        const particleX = this.x + this.width / 2 + Math.cos(angle) * 15;
        const particleY = this.y + this.height / 2 + Math.sin(angle) * 12;
        p.fill(180, 230, 255, 150);
        p.circle(particleX, particleY, 4);
      }
    }
    
    p.pop();
  }
}