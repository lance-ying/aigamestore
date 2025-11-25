// player.js - Player entity and mechanics

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, CARD_TYPES } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 30;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.jumpPower = -8;
    this.gravity = 0.4;
    this.grounded = false;
    this.health = 100;
    this.maxHealth = 100;
    this.inventory = [];
    this.currentCardIndex = 0;
    this.aimAngle = 0;
    this.hasDoubleJump = false;
    this.doubleJumpUsed = false;
    this.dashCooldown = 0;
    this.shootCooldown = 0;
    this.invincible = 0;
  }

  update() {
    // Apply gravity
    this.vy += this.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Friction
    this.vx *= 0.85;
    
    // Check ground collision
    this.checkPlatformCollisions();
    
    // Bounds
    if (this.x < 0) this.x = 0;
    if (this.x > CANVAS_WIDTH - this.w) this.x = CANVAS_WIDTH - this.w;
    if (this.y > CANVAS_HEIGHT) {
      this.health = 0;
    }
    
    // Update cooldowns
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invincible > 0) this.invincible--;
    
    // Reset double jump when grounded
    if (this.grounded) {
      this.doubleJumpUsed = false;
    }
  }

  checkPlatformCollisions() {
    this.grounded = false;
    
    for (let platform of gameState.platforms) {
      if (this.p.collideRectRect(this.x, this.y, this.w, this.h, 
                                   platform.x, platform.y, platform.w, platform.h)) {
        // Check if falling onto platform
        if (this.vy > 0 && this.y + this.h - this.vy < platform.y + 5) {
          this.y = platform.y - this.h;
          this.vy = 0;
          this.grounded = true;
        }
        // Check horizontal collisions
        else if (this.x + this.w > platform.x && this.x < platform.x + platform.w) {
          if (this.vx > 0) {
            this.x = platform.x - this.w;
          } else if (this.vx < 0) {
            this.x = platform.x + platform.w;
          }
          this.vx = 0;
        }
      }
    }
  }

  moveLeft() {
    this.vx = -this.speed;
  }

  moveRight() {
    this.vx = this.speed;
  }

  jump() {
    if (this.grounded) {
      this.vy = this.jumpPower;
      this.grounded = false;
    } else if (this.hasDoubleJump && !this.doubleJumpUsed) {
      this.vy = this.jumpPower * 0.8;
      this.doubleJumpUsed = true;
      this.createJumpParticles();
    }
  }

  dash() {
    if (this.dashCooldown <= 0) {
      const dashSpeed = 15;
      const angle = this.aimAngle;
      this.vx = this.p.cos(angle) * dashSpeed;
      this.vy = this.p.sin(angle) * dashSpeed * 0.5;
      this.dashCooldown = 30;
      this.createDashParticles();
    }
  }

  shoot() {
    if (this.shootCooldown <= 0 && this.inventory.length > 0) {
      const card = this.inventory[this.currentCardIndex];
      if (card.type.ability === "SHOOT") {
        const bullet = new Bullet(this.p, 
          this.x + this.w / 2, 
          this.y + this.h / 2, 
          this.aimAngle
        );
        gameState.entities.push(bullet);
        this.shootCooldown = 15;
        return true;
      }
    }
    return false;
  }

  useCardAbility() {
    if (this.inventory.length > 0) {
      const card = this.inventory[this.currentCardIndex];
      
      if (card.type.ability === "SHOOT") {
        return this.shoot();
      } else if (card.type.ability === "DASH") {
        this.dash();
        this.removeCurrentCard();
        return true;
      } else if (card.type.ability === "DOUBLE_JUMP") {
        this.hasDoubleJump = true;
        this.removeCurrentCard();
        return true;
      }
    }
    return false;
  }

  addCard(cardType) {
    this.inventory.push({ type: cardType, pickedUpAt: this.p.frameCount });
    if (this.inventory.length === 1) {
      this.currentCardIndex = 0;
    }
  }

  removeCurrentCard() {
    if (this.inventory.length > 0) {
      this.inventory.splice(this.currentCardIndex, 1);
      if (this.currentCardIndex >= this.inventory.length && this.inventory.length > 0) {
        this.currentCardIndex = this.inventory.length - 1;
      }
    }
  }

  getCurrentCard() {
    if (this.inventory.length > 0 && this.currentCardIndex < this.inventory.length) {
      return this.inventory[this.currentCardIndex];
    }
    return null;
  }

  takeDamage(amount) {
    if (this.invincible <= 0) {
      this.health -= amount;
      this.invincible = 60;
      if (this.health <= 0) {
        this.health = 0;
      }
    }
  }

  createJumpParticles() {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * this.p.TWO_PI;
      gameState.particles.push(new Particle(
        this.p,
        this.x + this.w / 2,
        this.y + this.h,
        this.p.cos(angle) * 2,
        this.p.sin(angle) * 2 - 1,
        [100, 150, 255],
        20
      ));
    }
  }

  createDashParticles() {
    for (let i = 0; i < 12; i++) {
      gameState.particles.push(new Particle(
        this.p,
        this.x + this.w / 2,
        this.y + this.h / 2,
        (this.p.random() - 0.5) * 4,
        (this.p.random() - 0.5) * 4,
        [100, 255, 150],
        30
      ));
    }
  }

  render() {
    this.p.push();
    
    // Draw player body with glow effect
    if (this.invincible > 0 && this.p.frameCount % 6 < 3) {
      this.p.noFill();
    } else {
      // Outer glow
      this.p.fill(200, 220, 255, 100);
      this.p.noStroke();
      this.p.rect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
      
      // Main body
      this.p.fill(255, 255, 255);
      this.p.stroke(150, 200, 255);
      this.p.strokeWeight(2);
    }
    this.p.rect(this.x, this.y, this.w, this.h);
    
    // Draw face
    this.p.fill(50, 150, 255);
    this.p.noStroke();
    this.p.rect(this.x + 4, this.y + 8, 4, 4);
    this.p.rect(this.x + 12, this.y + 8, 4, 4);
    
    // Draw aim indicator
    const aimLength = 30;
    const endX = this.x + this.w / 2 + this.p.cos(this.aimAngle) * aimLength;
    const endY = this.y + this.h / 2 + this.p.sin(this.aimAngle) * aimLength;
    this.p.stroke(255, 200, 100);
    this.p.strokeWeight(2);
    this.p.line(this.x + this.w / 2, this.y + this.h / 2, endX, endY);
    
    this.p.pop();
  }
}

export class Bullet {
  constructor(p, x, y, angle) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.cos(angle) * 10;
    this.vy = this.p.sin(angle) * 10;
    this.radius = 4;
    this.lifetime = 120;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.x < 0 || this.x > CANVAS_WIDTH || 
        this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
    
    // Check collision with platforms
    for (let platform of gameState.platforms) {
      if (this.p.collideCircleRect(this.x, this.y, this.radius * 2, 
                                     platform.x, platform.y, platform.w, platform.h)) {
        this.active = false;
        this.createImpactParticles();
      }
    }
    
    // Check collision with demons
    for (let demon of gameState.demons) {
      if (demon.active && this.p.dist(this.x, this.y, demon.x, demon.y) < this.radius + demon.radius) {
        demon.takeDamage(50);
        this.active = false;
        this.createHitParticles();
      }
    }
  }

  createImpactParticles() {
    for (let i = 0; i < 5; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      gameState.particles.push(new Particle(
        this.p, this.x, this.y,
        this.p.cos(angle) * 2,
        this.p.sin(angle) * 2,
        [255, 200, 100],
        15
      ));
    }
  }

  createHitParticles() {
    for (let i = 0; i < 8; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      gameState.particles.push(new Particle(
        this.p, this.x, this.y,
        this.p.cos(angle) * 3,
        this.p.sin(angle) * 3,
        [255, 50, 50],
        20
      ));
    }
  }

  render() {
    this.p.push();
    this.p.fill(255, 255, 100);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Trail effect
    this.p.fill(255, 255, 100, 100);
    this.p.circle(this.x - this.vx * 0.3, this.y - this.vy * 0.3, this.radius);
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, lifetime) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  render() {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    this.p.push();
    this.p.fill(...this.color, alpha);
    this.p.noStroke();
    this.p.circle(this.x, this.y, 4);
    this.p.pop();
  }
}