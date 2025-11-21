import { GRAVITY, GROUND_Y, gameState, CANVAS_WIDTH } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 20;
    this.height = 40;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 4;
    this.jumpPower = -12;
    this.grounded = false;
    this.facing = 1; // 1 = right, -1 = left
    
    // Combat
    this.attacking = false;
    this.attackType = null; // "light", "heavy"
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.damage = 10;
    this.heavyDamage = 25;
    this.comboWindow = 30; // frames to continue combo
    
    // Dash
    this.dashing = false;
    this.dashTimer = 0;
    this.dashDuration = 15;
    this.dashCooldown = 0;
    this.dashSpeed = 12;
    this.invincible = false;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Input tracking
    this.lastMoveDirection = 0;
  }
  
  update() {
    const p = this.p;
    
    // Apply gravity
    if (this.y < GROUND_Y) {
      this.vy += GRAVITY;
      this.grounded = false;
    } else {
      this.y = GROUND_Y;
      this.vy = 0;
      this.grounded = true;
    }
    
    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    this.animTimer++;
    
    // Dash mechanics
    if (this.dashing) {
      this.dashTimer++;
      this.vx = this.dashSpeed * this.facing;
      this.invincible = true;
      
      if (this.dashTimer >= this.dashDuration) {
        this.dashing = false;
        this.dashTimer = 0;
        this.invincible = false;
      }
    }
    
    // Attack mechanics
    if (this.attacking) {
      this.attackTimer++;
      const duration = this.attackType === "light" ? 15 : 25;
      
      if (this.attackTimer >= duration) {
        this.attacking = false;
        this.attackTimer = 0;
        this.attackType = null;
      }
    }
    
    // Movement (only if not attacking or dashing)
    if (!this.attacking && !this.dashing) {
      this.vx *= 0.8; // Friction
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // World bounds with hidden areas
    if (this.x < gameState.worldBounds.left) {
      this.x = gameState.worldBounds.left;
      if (!gameState.secrets.exploredBoundaries) {
        gameState.secrets.exploredBoundaries = true;
        gameState.score += 100;
      }
    }
    if (this.x > gameState.worldBounds.right) {
      this.x = gameState.worldBounds.right;
      if (!gameState.secrets.foundHiddenArea) {
        gameState.secrets.foundHiddenArea = true;
        gameState.score += 200;
      }
    }
    
    // Animation
    if (this.animTimer % 8 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  
  moveLeft() {
    if (!this.attacking && !this.dashing) {
      this.vx = -this.speed;
      this.facing = -1;
      this.lastMoveDirection = -1;
    }
  }
  
  moveRight() {
    if (!this.attacking && !this.dashing) {
      this.vx = this.speed;
      this.facing = 1;
      this.lastMoveDirection = 1;
    }
  }
  
  jump() {
    if (this.grounded && !this.attacking && !this.dashing) {
      this.vy = this.jumpPower;
      this.grounded = false;
    }
  }
  
  lightAttack() {
    if (!this.attacking && this.attackCooldown === 0 && !this.dashing) {
      this.attacking = true;
      this.attackType = "light";
      this.attackTimer = 0;
      this.attackCooldown = 20;
      this.vx = 0;
    }
  }
  
  heavyAttack() {
    if (!this.attacking && this.attackCooldown === 0 && !this.dashing) {
      this.attacking = true;
      this.attackType = "heavy";
      this.attackTimer = 0;
      this.attackCooldown = 40;
      this.vx = 0;
    }
  }
  
  dash() {
    if (!this.dashing && this.dashCooldown === 0) {
      this.dashing = true;
      this.dashTimer = 0;
      this.dashCooldown = 60;
      this.vx = 0;
    }
  }
  
  takeDamage(amount) {
    if (!this.invincible) {
      this.health -= amount;
      if (this.health < 0) this.health = 0;
      
      // Reset combo when hit
      gameState.combo = 0;
      
      return true;
    }
    return false;
  }
  
  getAttackBox() {
    if (!this.attacking) return null;
    
    const offset = this.attackType === "heavy" ? 35 : 25;
    const width = this.attackType === "heavy" ? 30 : 20;
    const height = this.attackType === "heavy" ? 35 : 25;
    
    return {
      x: this.x + (this.facing * offset),
      y: this.y - 20,
      width: width,
      height: height,
      damage: this.attackType === "heavy" ? this.heavyDamage : this.damage
    };
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Draw player body
    if (this.invincible && p.frameCount % 4 < 2) {
      p.fill(100, 200, 255, 150); // Flashing when invincible
    } else {
      p.fill(100, 200, 255);
    }
    
    // Body
    p.noStroke();
    p.rect(-this.width/2, -this.height, this.width, this.height);
    
    // Head
    p.fill(80, 180, 235);
    p.ellipse(0, -this.height - 8, 16, 16);
    
    // Eyes
    p.fill(255);
    p.ellipse(this.facing * 3, -this.height - 8, 4, 4);
    
    // Attack effects
    if (this.attacking) {
      p.fill(255, 100, 100, 150);
      const box = this.getAttackBox();
      if (box) {
        const localX = (box.x - this.x) + box.width/2;
        const localY = box.y - this.y + box.height/2;
        p.ellipse(localX, localY, box.width * 1.5, box.height * 1.5);
      }
    }
    
    // Dash trail
    if (this.dashing) {
      for (let i = 1; i <= 3; i++) {
        p.fill(100, 200, 255, 100 - i * 30);
        p.rect(-this.width/2 - (this.facing * i * 8), -this.height, this.width, this.height);
      }
    }
    
    p.pop();
    
    // Health bar
    p.push();
    p.fill(50);
    p.noStroke();
    p.rect(screenX - 20, this.y - this.height - 20, 40, 4);
    p.fill(100, 255, 100);
    p.rect(screenX - 20, this.y - this.height - 20, 40 * (this.health / this.maxHealth), 4);
    p.pop();
  }
}