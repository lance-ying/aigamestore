// character.js - Character base class and Player/Enemy

import { CANVAS_WIDTH, CANVAS_HEIGHT, ARENA_CONFIG, PLAYER_DEFAULTS, KEY_CODES, gameState } from './globals.js';
import { clamp, distance } from './utils.js';
import { Projectile } from './projectile.js';
import { createExplosion, createHitEffect } from './particle.js';

export class Character {
  constructor(x, y, isPlayer = true) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 20;
    this.height = 30;
    this.isPlayer = isPlayer;
    
    // Stats
    this.maxHealth = PLAYER_DEFAULTS.maxHealth;
    this.health = this.maxHealth;
    this.moveSpeed = PLAYER_DEFAULTS.moveSpeed;
    this.projectileSpeed = PLAYER_DEFAULTS.projectileSpeed;
    this.projectileDamage = PLAYER_DEFAULTS.projectileDamage;
    this.fireRate = PLAYER_DEFAULTS.fireRate;
    this.shieldDuration = PLAYER_DEFAULTS.shieldDuration;
    this.shieldCooldown = PLAYER_DEFAULTS.shieldCooldown;
    this.dashSpeed = PLAYER_DEFAULTS.dashSpeed;
    this.dashDuration = PLAYER_DEFAULTS.dashDuration;
    this.dashCooldown = PLAYER_DEFAULTS.dashCooldown;
    
    // State
    this.fireCooldown = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldCooldownTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.facingRight = isPlayer;
    
    // Visual
    this.color = isPlayer ? [80, 150, 255] : [255, 80, 80];
    this.hitFlash = 0;
    
    // Upgrades tracking
    this.upgrades = [];
  }

  update() {
    // Update timers
    if (this.fireCooldown > 0) this.fireCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
    
    // Shield logic
    if (this.shieldActive) {
      this.shieldTimer++;
      if (this.shieldTimer >= this.shieldDuration) {
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldCooldownTimer = this.shieldCooldown;
      }
    }
    if (this.shieldCooldownTimer > 0) {
      this.shieldCooldownTimer--;
    }
    
    // Dash logic
    if (this.isDashing) {
      this.dashTimer++;
      const dashDir = this.facingRight ? 1 : -1;
      this.vx = this.dashSpeed * dashDir;
      
      if (this.dashTimer >= this.dashDuration) {
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = this.dashCooldown;
        this.vx = 0;
      }
    } else if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer--;
    }
    
    // Apply velocity
    if (!this.isDashing) {
      this.x += this.vx;
      this.y += this.vy;
      
      // Friction
      this.vx *= 0.85;
      this.vy *= 0.85;
    } else {
      this.x += this.vx;
    }
    
    // Keep in arena bounds
    const minX = ARENA_CONFIG.marginX + this.width / 2;
    const maxX = ARENA_CONFIG.marginX + ARENA_CONFIG.width - this.width / 2;
    const minY = ARENA_CONFIG.marginY + this.height / 2;
    const maxY = ARENA_CONFIG.marginY + ARENA_CONFIG.height - this.height / 2;
    
    this.x = clamp(this.x, minX, maxX);
    this.y = clamp(this.y, minY, maxY);
  }

  move(dx, dy) {
    if (!this.isDashing) {
      this.vx += dx * this.moveSpeed * 0.3;
      this.vy += dy * this.moveSpeed * 0.3;
      
      if (dx !== 0) {
        this.facingRight = dx > 0;
      }
    }
  }

  shoot() {
    if (this.fireCooldown <= 0) {
      const dir = this.facingRight ? 1 : -1;
      const offsetX = dir * this.width;
      const projectile = new Projectile(
        this.x + offsetX,
        this.y,
        dir * this.projectileSpeed,
        0,
        this.projectileDamage,
        this.isPlayer ? 'player' : 'enemy',
        this.color
      );
      gameState.projectiles.push(projectile);
      this.fireCooldown = this.fireRate;
    }
  }

  activateShield() {
    if (!this.shieldActive && this.shieldCooldownTimer <= 0) {
      this.shieldActive = true;
      this.shieldTimer = 0;
    }
  }

  dash() {
    if (!this.isDashing && this.dashCooldownTimer <= 0) {
      this.isDashing = true;
      this.dashTimer = 0;
    }
  }

  takeDamage(damage) {
    if (this.shieldActive || this.isDashing) {
      return false; // Blocked or invulnerable
    }
    
    this.health -= damage;
    this.health = Math.max(0, this.health);
    this.hitFlash = 10;
    
    createHitEffect(this.x, this.y, [255, 255, 100], 12);
    
    return true;
  }

  isDead() {
    return this.health <= 0;
  }

  applyUpgrade(upgrade) {
    this.upgrades.push(upgrade.name);
    
    switch (upgrade.type) {
      case 'health':
        this.maxHealth += upgrade.value;
        this.health = Math.min(this.health + upgrade.value, this.maxHealth);
        break;
      case 'damage':
        this.projectileDamage += upgrade.value;
        break;
      case 'fireRate':
        this.fireRate = Math.max(5, this.fireRate - upgrade.value);
        break;
      case 'moveSpeed':
        this.moveSpeed += upgrade.value;
        break;
      case 'projectileSpeed':
        this.projectileSpeed += upgrade.value;
        break;
      case 'shieldDuration':
        this.shieldDuration += upgrade.value;
        break;
      case 'dashCooldown':
        this.dashCooldown = Math.max(30, this.dashCooldown - upgrade.value);
        break;
    }
  }

  render(p) {
    p.push();
    
    // Shield effect
    if (this.shieldActive) {
      p.noFill();
      p.stroke(150, 200, 255, 150);
      p.strokeWeight(3);
      p.circle(this.x, this.y, this.width + 20);
    }
    
    // Character body
    const bodyColor = this.hitFlash > 0 ? [255, 255, 255] : this.color;
    p.fill(...bodyColor);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Face direction indicator
    p.fill(255);
    const eyeOffsetX = this.facingRight ? 5 : -5;
    p.circle(this.x + eyeOffsetX, this.y - 5, 4);
    
    // Dash trail
    if (this.isDashing) {
      p.fill(this.color[0], this.color[1], this.color[2], 100);
      const trailDir = this.facingRight ? -1 : 1;
      p.rect(this.x + trailDir * 15, this.y, this.width * 0.8, this.height * 0.8, 5);
    }
    
    p.pop();
    
    // Health bar
    this.renderHealthBar(p);
    
    // Cooldown indicators
    this.renderCooldowns(p);
  }

  renderHealthBar(p) {
    const barWidth = 40;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height / 2 - 15;
    
    p.push();
    p.noStroke();
    p.fill(50);
    p.rect(x, y, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? [100, 255, 100] : healthPercent > 0.25 ? [255, 200, 100] : [255, 100, 100];
    p.fill(...healthColor);
    p.rect(x, y, barWidth * healthPercent, barHeight);
    
    p.stroke(255);
    p.strokeWeight(1);
    p.noFill();
    p.rect(x, y, barWidth, barHeight);
    p.pop();
  }

  renderCooldowns(p) {
    const y = this.y + this.height / 2 + 20;
    const spacing = 15;
    let x = this.x - spacing;
    
    p.push();
    p.noStroke();
    
    // Shield cooldown
    if (this.shieldCooldownTimer > 0) {
      const percent = 1 - (this.shieldCooldownTimer / this.shieldCooldown);
      p.fill(150, 200, 255, 150);
      p.rect(x, y, 10, 10 * percent);
    } else if (this.shieldActive) {
      p.fill(150, 200, 255);
      p.rect(x, y, 10, 10);
    }
    
    x += spacing;
    
    // Dash cooldown
    if (this.dashCooldownTimer > 0) {
      const percent = 1 - (this.dashCooldownTimer / this.dashCooldown);
      p.fill(255, 200, 100, 150);
      p.rect(x, y, 10, 10 * percent);
    } else if (!this.isDashing) {
      p.fill(255, 200, 100);
      p.rect(x, y, 10, 10);
    }
    
    p.pop();
  }

  reset() {
    // Keep upgrades but reset state
    this.health = this.maxHealth;
    this.fireCooldown = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldCooldownTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.hitFlash = 0;
    this.vx = 0;
    this.vy = 0;
  }
}