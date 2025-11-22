import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 4;
    this.jumpPower = -10;
    this.gravity = 0.5;
    this.onGround = false;
    this.health = 100;
    this.maxHealth = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.energyRegenRate = 0.5;
    this.dashCost = 30;
    this.shootCooldown = 0;
    this.shootDelay = 10;
    this.dashCooldown = 0;
    this.invincible = 0;
    this.jumpsLeft = 2;
    this.facingRight = true;
    this.aimAngle = 0;
    this.dashVelocity = 0;
    this.animFrame = 0;
  }

  update(platforms) {
    const p = this.p;
    
    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.invincible > 0) this.invincible--;
    
    // Energy regeneration
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate);
    }
    
    // Apply dash velocity
    if (this.dashVelocity !== 0) {
      this.vx = this.dashVelocity;
      this.dashVelocity *= 0.85;
      if (Math.abs(this.dashVelocity) < 0.5) this.dashVelocity = 0;
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
      this.vy = Math.min(this.vy, 15);
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    this.onGround = false;
    for (let platform of platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.onGround = true;
        this.jumpsLeft = 2;
      }
    }
    
    // Boundary constraints
    const prevX = this.x;
    this.x = Math.max(this.width / 2, Math.min(gameState.stageWidth - this.width / 2, this.x));
    // If boundary constraint was applied, stop horizontal velocity
    if (this.x !== prevX) {
      this.vx = 0;
      this.dashVelocity = 0;
    }
    
    if (this.y > CANVAS_HEIGHT + 50) {
      this.takeDamage(this.health); // Fall death
    }
    
    // Apply friction when on ground
    if (this.onGround && this.dashVelocity === 0) {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
    
    // Animation
    this.animFrame = (this.animFrame + 0.2) % 4;
  }

  checkPlatformCollision(platform) {
    const p = this.p;
    
    if (p.collideRectRect(
      this.x - this.width / 2, this.y - this.height / 2,
      this.width, this.height,
      platform.x, platform.y,
      platform.width, platform.height
    )) {
      // Check if this is a vertical collision (from above)
      if (this.vy > 0 && this.y - this.height / 2 < platform.y + 10) {
        this.y = platform.y - this.height / 2;
        this.vy = 0;
        return true;
      }
      // Check if this is a vertical collision (from below)
      if (this.vy < 0 && this.y + this.height / 2 > platform.y + platform.height - 10) {
        this.y = platform.y + platform.height + this.height / 2;
        this.vy = 0;
        return false;
      }
      
      // Side collisions - only apply if the player is actually beside the platform
      // Check if player's vertical center is within the platform's vertical range
      const playerBottom = this.y + this.height / 2;
      const playerTop = this.y - this.height / 2;
      const platformTop = platform.y;
      const platformBottom = platform.y + platform.height;
      
      // Only do side collision if player is beside the platform (not above or below)
      if (playerBottom > platformTop + 5 && playerTop < platformBottom - 5) {
        // Determine which side based on player position relative to platform
        const playerRight = this.x + this.width / 2;
        const playerLeft = this.x - this.width / 2;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        // Check if collision is on left or right side
        if (this.vx > 0 && playerRight > platformLeft && playerLeft < platformLeft) {
          // Colliding with left side of platform while moving right
          this.x = platformLeft - this.width / 2 - 1;
          this.vx = 0;
          this.dashVelocity = 0;
        } else if (this.vx < 0 && playerLeft < platformRight && playerRight > platformRight) {
          // Colliding with right side of platform while moving left
          this.x = platformRight + this.width / 2 + 1;
          this.vx = 0;
          this.dashVelocity = 0;
        }
      }
    }
    return false;
  }

  moveLeft() {
    if (this.dashVelocity === 0) {
      this.vx = -this.maxSpeed;
      this.facingRight = false;
    }
  }

  moveRight() {
    if (this.dashVelocity === 0) {
      this.vx = this.maxSpeed;
      this.facingRight = true;
    }
  }

  jump() {
    if (this.jumpsLeft > 0) {
      this.vy = this.jumpPower;
      this.jumpsLeft--;
      this.onGround = false;
    }
  }

  dash() {
    if (this.energy >= this.dashCost && this.dashCooldown === 0) {
      this.energy -= this.dashCost;
      this.dashVelocity = this.facingRight ? 12 : -12;
      this.dashCooldown = 30;
      this.invincible = 15;
    }
  }

  shoot() {
    if (this.shootCooldown === 0) {
      this.shootCooldown = this.shootDelay;
      return true;
    }
    return false;
  }

  aimUp() {
    this.aimAngle = -45;
  }

  aimDown() {
    this.aimAngle = 45;
  }

  aimNormal() {
    this.aimAngle = 0;
  }

  takeDamage(amount) {
    if (this.invincible > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.invincible = 60;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Invincibility flicker
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
      p.pop();
      return;
    }
    
    // Draw player
    if (this.facingRight) {
      p.scale(1, 1);
    } else {
      p.scale(-1, 1);
    }
    
    // Body (blue armor)
    p.fill(20, 100, 200);
    p.rect(-8, -12, 16, 24, 2);
    
    // Helmet
    p.fill(30, 120, 230);
    p.rect(-10, -16, 20, 8, 3);
    
    // Visor
    p.fill(100, 200, 255);
    p.rect(-8, -15, 16, 4);
    
    // Weapon arm
    p.fill(40, 140, 220);
    p.rect(8, -8, 6, 12, 2);
    
    // Legs
    p.fill(20, 100, 200);
    const legOffset = Math.sin(this.animFrame) * 3;
    p.rect(-6, 12 + legOffset, 5, 10, 2);
    p.rect(1, 12 - legOffset, 5, 10, 2);
    
    // Energy effect during dash
    if (this.dashVelocity !== 0) {
      p.fill(100, 200, 255, 100);
      p.ellipse(0, 0, 40, 40);
    }
    
    p.pop();
  }
}