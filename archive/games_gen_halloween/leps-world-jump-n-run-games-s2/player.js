// player.js - Player entity
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
    this.health = 3;
    this.maxHealth = 3;
    this.grounded = false;
    this.jumpPower = -11;
    this.gravity = 0.5;
    this.maxSpeed = 4;
    this.acceleration = 0.6;
    this.friction = 0.8;
    this.jumpHoldTime = 0;
    this.maxJumpHoldTime = 12;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 90;
    this.facing = 1; // 1 = right, -1 = left
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(inputs) {
    const p = this.p;
    
    // Horizontal movement
    if (inputs.left) {
      this.vx -= this.acceleration;
      this.facing = -1;
    }
    if (inputs.right) {
      this.vx += this.acceleration;
      this.facing = 1;
    }
    
    // Apply friction
    if (!inputs.left && !inputs.right) {
      this.vx *= this.friction;
    }
    
    // Limit speed
    this.vx = p.constrain(this.vx, -this.maxSpeed, this.maxSpeed);
    
    // Jump mechanics
    if (inputs.jump && this.grounded) {
      this.vy = this.jumpPower;
      this.grounded = false;
      this.jumpHoldTime = 0;
    }
    
    // Variable jump height
    if (inputs.jump && this.jumpHoldTime < this.maxJumpHoldTime && this.vy < 0) {
      this.vy += this.jumpPower * 0.05;
      this.jumpHoldTime++;
    }
    
    // Gravity
    if (!this.grounded) {
      this.vy += this.gravity;
    }
    
    // Terminal velocity
    this.vy = p.constrain(this.vy, -15, 15);
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Animation
    if (p.abs(this.vx) > 0.5) {
      this.animTimer++;
      if (this.animTimer > 8) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
    
    // Invincibility
    if (this.invincible) {
      this.invincibleTimer++;
      if (this.invincibleTimer >= this.invincibleDuration) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }
    
    // Reset grounded status
    this.grounded = false;
  }

  takeDamage(amount) {
    if (!this.invincible) {
      this.health -= amount;
      this.invincible = true;
      this.invincibleTimer = 0;
      
      // Knockback
      this.vy = -6;
      
      return true;
    }
    return false;
  }

  heal(amount) {
    this.health = this.p.min(this.health + amount, this.maxHealth);
  }

  render() {
    const p = this.p;
    const camX = gameState.camera.x;
    const screenX = this.x - camX;
    const screenY = this.y;
    
    p.push();
    
    // Invincibility flicker
    if (this.invincible && p.frameCount % 8 < 4) {
      p.pop();
      return;
    }
    
    // Draw Lep (leprechaun character)
    p.translate(screenX + this.width / 2, screenY + this.height / 2);
    if (this.facing === -1) {
      p.scale(-1, 1);
    }
    
    // Body (green suit)
    p.fill(34, 139, 34);
    p.noStroke();
    p.rect(-8, -4, 16, 14, 2);
    
    // Head (skin tone)
    p.fill(255, 220, 177);
    p.ellipse(0, -12, 14, 14);
    
    // Hat (green with gold buckle)
    p.fill(0, 100, 0);
    p.triangle(-8, -16, 8, -16, 0, -24);
    p.rect(-6, -17, 12, 3);
    p.fill(255, 215, 0);
    p.rect(-2, -17, 4, 3);
    
    // Beard (orange)
    p.fill(255, 140, 0);
    p.ellipse(-3, -7, 4, 6);
    p.ellipse(3, -7, 4, 6);
    p.ellipse(0, -5, 5, 4);
    
    // Eyes
    p.fill(0);
    p.ellipse(-3, -12, 2, 3);
    p.ellipse(3, -12, 2, 3);
    
    // Legs (walking animation)
    p.fill(34, 139, 34);
    const legOffset = p.sin(this.animFrame * p.PI / 2) * 3;
    p.rect(-5, 10, 4, 6 + legOffset, 2);
    p.rect(1, 10, 4, 6 - legOffset, 2);
    
    // Arms
    p.rect(-10, 0, 4, 8, 2);
    p.rect(6, 0, 4, 8, 2);
    
    p.pop();
  }

  getScreenPosition() {
    return {
      x: this.x - gameState.camera.x,
      y: this.y
    };
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}