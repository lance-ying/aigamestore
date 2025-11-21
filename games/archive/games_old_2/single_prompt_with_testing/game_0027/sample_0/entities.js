// entities.js - Game entities
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_START_HEALTH, PLAYER_START_SPEED, 
         PLAYER_START_DAMAGE, PLAYER_START_FIRE_RATE, PLAYER_DASH_SPEED, 
         PLAYER_DASH_DURATION, PLAYER_DASH_COOLDOWN, PLAYER_INVULN_FRAMES,
         BULLET_SPEED, BULLET_SIZE, BULLET_RANGE, ENEMY_BASE_SPEED, 
         ENEMY_BASE_HEALTH, ENEMY_BASE_DAMAGE, ENEMY_SIZE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.maxHealth = PLAYER_START_HEALTH;
    this.health = this.maxHealth;
    this.speed = PLAYER_START_SPEED;
    this.damage = PLAYER_START_DAMAGE;
    this.fireRate = PLAYER_START_FIRE_RATE;
    this.fireTimer = 0;
    this.size = 12;
    
    // Dash ability
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDirection = { x: 0, y: 0 };
    
    // Invulnerability
    this.invulnTimer = 0;
    
    // Stats for upgrades
    this.bonusSpeed = 0;
    this.bonusDamage = 0;
    this.bonusFireRate = 0;
    this.bonusMaxHealth = 0;
    this.projectileCount = 1;
    this.projectileSpread = 0;
  }

  update() {
    // Update timers
    if (this.fireTimer > 0) this.fireTimer--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.invulnTimer > 0) this.invulnTimer--;
    
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }
    
    // Movement
    let moveSpeed = this.speed + this.bonusSpeed;
    if (this.isDashing) {
      moveSpeed = PLAYER_DASH_SPEED;
      this.x += this.dashDirection.x * moveSpeed;
      this.y += this.dashDirection.y * moveSpeed;
    } else {
      this.x += this.vx * moveSpeed;
      this.y += this.vy * moveSpeed;
    }
    
    // Keep in bounds
    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y));
  }

  startDash(dx, dy) {
    if (this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = PLAYER_DASH_DURATION;
      this.dashCooldown = PLAYER_DASH_COOLDOWN;
      this.invulnTimer = PLAYER_INVULN_FRAMES;
      
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 0) {
        this.dashDirection.x = dx / mag;
        this.dashDirection.y = dy / mag;
      } else {
        this.dashDirection.x = 1;
        this.dashDirection.y = 0;
      }
    }
  }

  canShoot() {
    return this.fireTimer <= 0;
  }

  shoot(targetX, targetY) {
    this.fireTimer = Math.max(1, this.fireRate - this.bonusFireRate);
  }

  takeDamage(amount) {
    if (this.invulnTimer <= 0) {
      this.health -= amount;
      this.invulnTimer = 30; // Brief invulnerability after hit
      return true;
    }
    return false;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth + this.bonusMaxHealth, this.health + amount);
  }

  render(p) {
    p.push();
    
    // Draw health bar
    const barWidth = 40;
    const barHeight = 4;
    p.fill(60);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y - this.size - 8, barWidth, barHeight);
    
    const healthPercent = this.health / (this.maxHealth + this.bonusMaxHealth);
    p.fill(100, 255, 100);
    p.rect(this.x - barWidth/2, this.y - this.size - 8, barWidth * healthPercent, barHeight);
    
    // Draw player (invulnerability flashing)
    if (this.invulnTimer <= 0 || Math.floor(this.invulnTimer / 3) % 2 === 0) {
      // Body
      p.fill(this.isDashing ? 200 : 100, 150, 255);
      p.stroke(255);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.size * 2);
      
      // Eye indicator (facing direction)
      p.fill(255, 255, 100);
      p.noStroke();
      p.circle(this.x + this.size * 0.3, this.y - this.size * 0.2, 4);
    }
    
    p.pop();
  }
}

export class Bullet {
  constructor(x, y, vx, vy, damage) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.distanceTraveled = 0;
    this.maxDistance = BULLET_RANGE;
    this.size = BULLET_SIZE;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.distanceTraveled += Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    
    // Deactivate if out of range or off screen
    if (this.distanceTraveled > this.maxDistance || 
        this.x < 0 || this.x > CANVAS_WIDTH || 
        this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }

  render(p) {
    p.push();
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(this.x, this.y, this.size * 2);
    
    // Glow effect
    p.fill(255, 255, 150, 100);
    p.circle(this.x, this.y, this.size * 3);
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = ENEMY_BASE_SPEED;
    this.maxHealth = ENEMY_BASE_HEALTH;
    this.health = this.maxHealth;
    this.damage = ENEMY_BASE_DAMAGE;
    this.size = ENEMY_SIZE;
    this.active = true;
    this.hitFlash = 0;
    
    // Type variations
    if (type === 'fast') {
      this.speed *= 1.5;
      this.health *= 0.7;
      this.maxHealth = this.health;
      this.size *= 0.8;
      this.color = [255, 150, 150];
    } else if (type === 'tank') {
      this.speed *= 0.6;
      this.health *= 2;
      this.maxHealth = this.health;
      this.damage *= 1.5;
      this.size *= 1.3;
      this.color = [150, 255, 150];
    } else {
      this.color = [255, 100, 100];
    }
  }

  update(targetX, targetY) {
    // Move towards target
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
    
    if (this.hitFlash > 0) this.hitFlash--;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 5;
    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy died
    }
    return false;
  }

  render(p) {
    p.push();
    
    // Health bar
    const barWidth = this.size * 2;
    const barHeight = 3;
    p.fill(60);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y - this.size - 6, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    p.fill(255, 100, 100);
    p.rect(this.x - barWidth/2, this.y - this.size - 6, barWidth * healthPercent, barHeight);
    
    // Body
    const fillColor = this.hitFlash > 0 ? [255, 255, 255] : this.color;
    p.fill(...fillColor);
    p.stroke(100);
    p.strokeWeight(2);
    
    if (this.type === 'tank') {
      p.rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    } else {
      p.circle(this.x, this.y, this.size * 2);
    }
    
    // Eyes
    p.fill(50);
    p.noStroke();
    p.circle(this.x - this.size * 0.3, this.y - this.size * 0.2, 4);
    p.circle(this.x + this.size * 0.3, this.y - this.size * 0.2, 4);
    
    p.pop();
  }
}

export class XPGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.size = 6;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.pulseTimer = 0;
  }

  update(playerX, playerY, attractRange, attractSpeed) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < attractRange) {
      this.vx += (dx / dist) * attractSpeed * 0.1;
      this.vy += (dy / dist) * attractSpeed * 0.1;
    }
    
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    this.x += this.vx;
    this.y += this.vy;
    
    this.pulseTimer += 0.1;
  }

  render(p) {
    p.push();
    
    const pulse = Math.sin(this.pulseTimer) * 0.3 + 1;
    const size = this.size * pulse;
    
    // Outer glow
    p.fill(100, 255, 255, 100);
    p.noStroke();
    p.circle(this.x, this.y, size * 3);
    
    // Gem
    p.fill(50, 255, 255);
    p.stroke(150, 255, 255);
    p.strokeWeight(1);
    p.circle(this.x, this.y, size * 2);
    
    // Inner sparkle
    p.fill(200, 255, 255);
    p.noStroke();
    p.circle(this.x - size * 0.2, this.y - size * 0.2, size * 0.5);
    
    p.pop();
  }
}