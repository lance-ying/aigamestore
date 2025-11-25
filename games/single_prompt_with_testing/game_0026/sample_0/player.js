// player.js - Player character class

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.jumpPower = -8;
    this.gravity = 0.4;
    this.onGround = false;
    this.facingRight = true;
    this.health = 1;
    this.alive = true;
    
    // Dash
    this.dashSpeed = 12;
    this.dashDuration = 10;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashInvincible = false;
    
    // Slash
    this.slashActive = false;
    this.slashTimer = 0;
    this.slashDuration = 8;
    this.slashCooldown = 0;
    this.slashDirection = { x: 1, y: 0 };
    this.slashRange = 40;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Crouching
    this.crouching = false;
  }
  
  update() {
    if (!this.alive) return;
    
    const p = this.p;
    
    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
    }
    
    // Update dash
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.dashInvincible = false;
        this.vx = this.facingRight ? this.speed : -this.speed;
      }
    }
    
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
    }
    
    // Update slash
    if (this.slashActive) {
      this.slashTimer--;
      if (this.slashTimer <= 0) {
        this.slashActive = false;
      }
    }
    
    if (this.slashCooldown > 0) {
      this.slashCooldown--;
    }
    
    // Terminal velocity
    if (this.vy > 15) this.vy = 15;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    const groundY = CANVAS_HEIGHT - 50;
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    
    // Wall collision
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    // Deceleration when not dashing
    if (!this.isDashing && this.onGround) {
      this.vx *= 0.85;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
  }
  
  move(direction) {
    if (this.isDashing || !this.alive) return;
    
    if (direction === 'left') {
      this.vx = -this.speed;
      this.facingRight = false;
    } else if (direction === 'right') {
      this.vx = this.speed;
      this.facingRight = true;
    }
  }
  
  jump() {
    if (this.onGround && !this.isDashing && this.alive && !this.crouching) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }
  
  dash() {
    if (this.dashCooldown <= 0 && !this.isDashing && this.alive) {
      this.isDashing = true;
      this.dashInvincible = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = 40;
      this.vx = this.facingRight ? this.dashSpeed : -this.dashSpeed;
      this.slashActive = false;
    }
  }
  
  slash(dirX = null, dirY = null) {
    if (this.slashCooldown <= 0 && !this.slashActive && this.alive && !this.isDashing) {
      this.slashActive = true;
      this.slashTimer = this.slashDuration;
      this.slashCooldown = 20;
      
      // Determine slash direction
      if (dirX !== null && dirY !== null) {
        const mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag > 0) {
          this.slashDirection = { x: dirX / mag, y: dirY / mag };
        }
      } else {
        this.slashDirection = { x: this.facingRight ? 1 : -1, y: 0 };
      }
    }
  }
  
  getSlashHitbox() {
    if (!this.slashActive) return null;
    
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    return {
      x: centerX + this.slashDirection.x * this.slashRange / 2,
      y: centerY + this.slashDirection.y * this.slashRange / 2,
      width: Math.abs(this.slashDirection.x) * this.slashRange || 20,
      height: Math.abs(this.slashDirection.y) * this.slashRange || 20
    };
  }
  
  takeDamage() {
    if (this.dashInvincible || !this.alive) return false;
    
    this.health--;
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }
  
  setCrouch(crouching) {
    if (this.onGround && !this.isDashing) {
      this.crouching = crouching;
    }
  }
  
  render() {
    const p = this.p;
    
    if (!this.alive) {
      // Death animation
      p.push();
      p.fill(255, 0, 0, 150);
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        p.ellipse(this.x + this.width / 2, this.y + this.height / 2, 40 - i * 5, 40 - i * 5);
      }
      p.pop();
      return;
    }
    
    p.push();
    p.translate(this.x + this.width / 2, this.y + this.height / 2);
    if (!this.facingRight) p.scale(-1, 1);
    
    // Body
    const bodyHeight = this.crouching ? this.height * 0.6 : this.height;
    p.fill(this.isDashing ? p.color(100, 200, 255) : p.color(40, 40, 60));
    p.noStroke();
    p.rect(-this.width / 2, -bodyHeight / 2, this.width, bodyHeight);
    
    // Head
    p.fill(220, 200, 180);
    p.ellipse(0, -bodyHeight / 2 - 5, 12, 12);
    
    // Katana
    if (!this.crouching) {
      p.stroke(200, 200, 220);
      p.strokeWeight(2);
      const katanaLength = 25;
      if (this.slashActive) {
        p.stroke(255, 100, 100);
        p.strokeWeight(3);
        const angle = Math.atan2(this.slashDirection.y, this.slashDirection.x * (this.facingRight ? 1 : -1));
        p.push();
        p.rotate(angle);
        p.line(5, 0, 5 + katanaLength, 0);
        p.pop();
      } else {
        p.line(this.width / 2, 0, this.width / 2 + katanaLength, -5);
      }
    }
    
    // Eyes
    p.fill(255, 50, 50);
    p.noStroke();
    p.ellipse(3, -bodyHeight / 2 - 5, 3, 3);
    
    p.pop();
    
    // Slash effect
    if (this.slashActive) {
      const hitbox = this.getSlashHitbox();
      if (hitbox) {
        p.push();
        p.noFill();
        p.stroke(255, 100, 100, 200 - this.slashTimer * 20);
        p.strokeWeight(3);
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const endX = centerX + this.slashDirection.x * this.slashRange;
        const endY = centerY + this.slashDirection.y * this.slashRange;
        p.line(centerX, centerY, endX, endY);
        
        // Slash trail
        for (let i = 0; i < 3; i++) {
          p.stroke(255, 100, 100, 100 - i * 30);
          const offset = i * 5;
          p.line(centerX - this.slashDirection.x * offset, centerY - this.slashDirection.y * offset,
                 endX - this.slashDirection.x * offset, endY - this.slashDirection.y * offset);
        }
        p.pop();
      }
    }
    
    // Dash effect
    if (this.isDashing) {
      p.push();
      p.fill(100, 200, 255, 100);
      p.noStroke();
      for (let i = 1; i <= 3; i++) {
        const trailX = this.x - (this.facingRight ? i * 8 : -i * 8);
        p.rect(trailX, this.y, this.width, this.height);
      }
      p.pop();
    }
  }
}