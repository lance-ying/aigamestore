// player.js - Player mech entity

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 30;
    this.speed = 3;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.isDead = false;
    
    // Combat stats
    this.damage = 10;
    this.fireRate = 15; // frames between shots
    this.fireCooldown = 0;
    this.range = 250;
    
    // Abilities
    this.dashSpeed = 12;
    this.dashDuration = 8;
    this.dashCooldown = 60;
    this.isDashing = false;
    this.dashTimer = 0;
    
    this.shieldDuration = 90;
    this.shieldCooldown = 180;
    this.isShielded = false;
    this.shieldTimer = 0;
    
    // Upgrades
    this.damageMultiplier = 1;
    this.fireRateMultiplier = 1;
    this.speedMultiplier = 1;
    
    // Visual
    this.angle = 0;
    this.turretAngle = 0;
  }
  
  update() {
    if (this.isDead) return;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary check
    this.x = this.p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = this.p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);
    
    // Update dash
    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }
    
    // Update shield
    if (this.isShielded) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.isShielded = false;
      }
    }
    
    // Decay velocity
    this.vx *= 0.85;
    this.vy *= 0.85;
    
    // Update rotation based on movement
    if (this.p.abs(this.vx) > 0.1 || this.p.abs(this.vy) > 0.1) {
      this.angle = this.p.atan2(this.vy, this.vx);
    }
    
    // Auto-target nearest enemy for turret
    this.updateTurretAngle();
    
    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }
  }
  
  updateTurretAngle() {
    let nearestEnemy = null;
    let nearestDist = this.range;
    
    for (let enemy of gameState.enemies) {
      const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    if (nearestEnemy) {
      this.turretAngle = this.p.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
    }
  }
  
  move(dx, dy) {
    if (this.isDead) return;
    
    const speed = this.speed * this.speedMultiplier * (this.isDashing ? this.dashSpeed / this.speed : 1);
    
    this.vx = dx * speed;
    this.vy = dy * speed;
  }
  
  dash() {
    if (this.isDead) return false;
    
    const currentTime = gameState.frameCount;
    if (currentTime - gameState.lastDashTime >= this.dashCooldown) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      gameState.lastDashTime = currentTime;
      return true;
    }
    return false;
  }
  
  activateShield() {
    if (this.isDead || gameState.shieldCharges <= 0) return false;
    
    const currentTime = gameState.frameCount;
    if (currentTime - gameState.lastShieldTime >= this.shieldCooldown) {
      this.isShielded = true;
      this.shieldTimer = this.shieldDuration;
      gameState.lastShieldTime = currentTime;
      gameState.shieldCharges--;
      return true;
    }
    return false;
  }
  
  fire() {
    if (this.isDead || this.fireCooldown > 0) return null;
    
    const adjustedFireRate = this.p.floor(this.fireRate / this.fireRateMultiplier);
    this.fireCooldown = adjustedFireRate;
    
    return {
      x: this.x + this.p.cos(this.turretAngle) * 20,
      y: this.y + this.p.sin(this.turretAngle) * 20,
      angle: this.turretAngle,
      damage: this.damage * this.damageMultiplier
    };
  }
  
  takeDamage(amount) {
    if (this.isDead || this.isDashing || this.isShielded) return;
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
    }
  }
  
  addUpgrade(type, amount) {
    switch(type) {
      case 'damage':
        this.damageMultiplier += amount;
        break;
      case 'fireRate':
        this.fireRateMultiplier += amount;
        break;
      case 'speed':
        this.speedMultiplier += amount;
        break;
      case 'health':
        this.health = this.p.min(this.health + amount, this.maxHealth);
        break;
    }
  }
  
  render() {
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Shield effect
    if (this.isShielded) {
      p.noFill();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(3);
      const shieldRadius = 25 + p.sin(gameState.frameCount * 0.1) * 3;
      p.circle(0, 0, shieldRadius * 2);
    }
    
    // Dash trail
    if (this.isDashing) {
      p.noFill();
      p.stroke(255, 150, 50, 100);
      p.strokeWeight(2);
      for (let i = 1; i <= 3; i++) {
        const trailX = -this.vx * i * 0.5;
        const trailY = -this.vy * i * 0.5;
        p.circle(trailX, trailY, this.width - i * 3);
      }
    }
    
    // Mech body
    p.rotate(this.angle);
    p.fill(60, 80, 100);
    p.stroke(40, 60, 80);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 4);
    
    // Cockpit
    p.fill(80, 150, 180);
    p.noStroke();
    p.circle(2, 0, 12);
    
    // Side thrusters
    p.fill(50, 70, 90);
    p.rect(-this.width / 2 - 3, -8, 5, 5);
    p.rect(-this.width / 2 - 3, 3, 5, 5);
    
    // Turret
    p.rotate(-this.angle + this.turretAngle);
    p.fill(70, 90, 110);
    p.stroke(50, 70, 90);
    p.strokeWeight(2);
    p.circle(0, 0, 16);
    
    // Gun barrel
    p.fill(80, 100, 120);
    p.rect(0, -2, 20, 4);
    
    p.pop();
    
    // Health bar
    this.renderHealthBar();
  }
  
  renderHealthBar() {
    const p = this.p;
    const barWidth = 40;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.height / 2 - 10;
    
    p.push();
    p.noStroke();
    
    // Background
    p.fill(40, 40, 40);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthWidth = (this.health / this.maxHealth) * barWidth;
    const healthColor = this.health > 60 ? [80, 200, 80] : this.health > 30 ? [255, 200, 50] : [255, 80, 80];
    p.fill(...healthColor);
    p.rect(barX, barY, healthWidth, barHeight);
    
    p.pop();
  }
}