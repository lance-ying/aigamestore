// player.js - Player character implementation

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 4;
    this.jumpPower = -12;
    this.gravity = 0.6;
    this.onGround = false;
    this.health = 100;
    this.maxHealth = 100;
    this.shootCooldown = 0;
    this.shootDelay = 8;
    this.dashCooldown = 0;
    this.dashDelay = 40;
    this.dashDuration = 12;
    this.dashTimer = 0;
    this.isDashing = false;
    this.invulnerable = false;
    this.hitCooldown = 0;
    this.facing = 1; // 1 = right, -1 = left
    
    // Animation
    this.bobOffset = 0;
    this.armAngle = 0;
  }

  update() {
    const p = this.p;
    
    // Update cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.hitCooldown > 0) this.hitCooldown--;
    
    // Dash logic
    if (this.dashTimer > 0) {
      this.dashTimer--;
      this.isDashing = true;
      this.invulnerable = true;
      this.velocityX = this.facing * 8;
    } else {
      this.isDashing = false;
      this.invulnerable = false;
    }
    
    // Apply gravity
    this.velocityY += this.gravity;
    
    // Update position
    this.y += this.velocityY;
    this.x += this.velocityX;
    
    // Ground collision
    if (this.y >= gameState.groundY - this.height) {
      this.y = gameState.groundY - this.height;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    
    // Boundary checks
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH - this.width) this.x = CANVAS_WIDTH - this.width;
    
    // Friction when not dashing
    if (!this.isDashing) {
      this.velocityX *= 0.8;
    }
    
    // Animation updates
    this.bobOffset = Math.sin(p.frameCount * 0.15) * 2;
    this.armAngle = Math.sin(p.frameCount * 0.2) * 0.1;
  }

  move(direction) {
    if (!this.isDashing) {
      this.velocityX = direction * this.speed;
      if (direction !== 0) {
        this.facing = direction;
      }
    }
  }

  jump() {
    if (this.onGround && !this.isDashing) {
      this.velocityY = this.jumpPower;
      this.onGround = false;
    }
  }

  shoot() {
    if (this.shootCooldown <= 0) {
      this.shootCooldown = this.shootDelay;
      return true;
    }
    return false;
  }

  dash() {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      this.dashCooldown = this.dashDelay;
      this.dashTimer = this.dashDuration;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (!this.invulnerable && this.hitCooldown <= 0) {
      this.health -= amount;
      this.hitCooldown = 30;
      if (this.health < 0) this.health = 0;
      return true;
    }
    return false;
  }

  render() {
    const p = this.p;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + this.bobOffset;
    
    p.push();
    
    // Flash when hit
    if (this.hitCooldown > 0 && p.frameCount % 4 < 2) {
      p.tint(255, 100, 100);
    }
    
    // Dash effect
    if (this.isDashing) {
      p.push();
      p.noStroke();
      p.fill(255, 255, 255, 100);
      for (let i = 0; i < 3; i++) {
        p.ellipse(centerX - this.facing * i * 10, centerY, 
                  this.width - i * 5, this.height - i * 5);
      }
      p.pop();
    }
    
    // Draw Cuphead character
    p.push();
    p.translate(centerX, centerY);
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Body (cup)
    p.fill(220, 220, 220);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-12, -5, 24, 20, 2);
    
    // Liquid in cup (red)
    p.fill(200, 50, 50);
    p.noStroke();
    p.rect(-10, -3, 20, 8);
    
    // Head (round)
    p.fill(255, 220, 200);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(0, -15, 28, 28);
    
    // Eyes
    p.fill(0);
    p.noStroke();
    p.ellipse(-6, -15, 6, 8);
    p.ellipse(6, -15, 6, 8);
    
    // Nose
    p.fill(255, 100, 100);
    p.ellipse(0, -10, 4, 6);
    
    // Straw
    p.stroke(255, 200, 0);
    p.strokeWeight(3);
    p.line(5, -25, 8, -35);
    p.fill(255, 200, 0);
    p.noStroke();
    p.rect(6, -37, 4, 4);
    
    // Handle
    p.noFill();
    p.stroke(180, 180, 180);
    p.strokeWeight(2);
    p.arc(15, 5, 12, 15, -p.PI/2, p.PI/2);
    
    // Arms
    p.stroke(0);
    p.strokeWeight(2);
    p.fill(255, 255, 255);
    // Left arm
    p.push();
    p.rotate(this.armAngle);
    p.ellipse(-15, 2, 8, 14);
    // Hand
    p.fill(255, 220, 200);
    p.ellipse(-15, 8, 10, 10);
    p.pop();
    
    // Right arm (shooting arm)
    p.push();
    p.rotate(-this.armAngle);
    p.ellipse(15, 2, 8, 14);
    // Hand with finger gun
    p.fill(255, 220, 200);
    p.ellipse(15, 8, 10, 10);
    p.fill(255, 220, 200);
    p.rect(17, 6, 5, 3);
    p.pop();
    
    // Legs
    p.fill(255, 255, 255);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(-6, 20, 8, 16);
    p.ellipse(6, 20, 8, 16);
    
    // Shoes
    p.fill(50, 50, 50);
    p.ellipse(-6, 27, 12, 8);
    p.ellipse(6, 27, 12, 8);
    
    p.pop();
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}