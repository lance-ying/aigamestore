// entities.js - Game entities (units, enemies, projectiles)

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, UNIT_STATS, ENEMY_STATS } from './globals.js';

export class Unit {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    const stats = UNIT_STATS[type];
    this.maxHealth = stats.health;
    this.health = this.maxHealth;
    this.damage = stats.damage;
    this.range = stats.range;
    this.attackSpeed = stats.attackSpeed;
    this.speed = stats.speed;
    this.color = stats.color;
    this.attackCooldown = 0;
    this.target = null;
    this.isUpgraded = false;
    this.moveTarget = null;
  }

  update() {
    // Find nearest enemy
    let nearestEnemy = null;
    let minDist = this.range;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }

    this.target = nearestEnemy;

    // Attack if target in range
    if (this.target && this.attackCooldown <= 0) {
      this.attack(this.target);
      this.attackCooldown = this.attackSpeed;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Move towards enemies if no target in range
    if (!this.target && gameState.enemies.length > 0) {
      const closest = gameState.enemies.reduce((prev, curr) => {
        const d1 = Math.hypot(prev.x - this.x, prev.y - this.y);
        const d2 = Math.hypot(curr.x - this.x, curr.y - this.y);
        return d2 < d1 ? curr : prev;
      });
      
      const angle = Math.atan2(closest.y - this.y, closest.x - this.x);
      this.x += Math.cos(angle) * this.speed * 0.5;
      this.y += Math.sin(angle) * this.speed * 0.5;
      
      // Keep in bounds
      this.x = Math.max(20, Math.min(MAP_WIDTH - 20, this.x));
      this.y = Math.max(20, Math.min(MAP_HEIGHT - 20, this.y));
    }
  }

  attack(target) {
    const projectile = new Projectile(this.x, this.y, target, this.damage, this.color);
    gameState.projectiles.push(projectile);
  }

  upgrade() {
    if (!this.isUpgraded) {
      this.isUpgraded = true;
      this.damage *= 1.5;
      this.maxHealth *= 1.3;
      this.health = this.maxHealth;
      this.range *= 1.2;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // Unit destroyed
    }
    return false;
  }

  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
      return;
    }

    p.push();
    
    // Unit body
    p.fill(...(this.isUpgraded ? [this.color[0] + 50, this.color[1] + 50, this.color[2] + 50] : this.color));
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, 24, 24);
    
    // Weapon indicator
    p.fill(50);
    p.noStroke();
    if (this.type === 'SNIPER') {
      p.rect(screenX + 8, screenY - 2, 12, 4);
    } else if (this.type === 'HEAVY') {
      p.rect(screenX + 6, screenY - 4, 10, 8);
    } else {
      p.rect(screenX + 8, screenY - 1, 8, 3);
    }
    
    // Health bar
    const healthBarWidth = 30;
    const healthBarHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(50);
    p.rect(screenX - healthBarWidth / 2, screenY - 20, healthBarWidth, healthBarHeight);
    p.fill(...(healthPercent > 0.5 ? [100, 255, 100] : healthPercent > 0.25 ? [255, 255, 100] : [255, 100, 100]));
    p.rect(screenX - healthBarWidth / 2, screenY - 20, healthBarWidth * healthPercent, healthBarHeight);
    
    // Upgrade indicator
    if (this.isUpgraded) {
      p.fill(255, 215, 0);
      p.noStroke();
      p.circle(screenX + 10, screenY - 10, 6);
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    const stats = ENEMY_STATS[type];
    this.maxHealth = stats.health;
    this.health = this.maxHealth;
    this.damage = stats.damage;
    this.range = stats.range;
    this.attackSpeed = stats.attackSpeed;
    this.speed = stats.speed;
    this.reward = stats.reward;
    this.color = stats.color;
    this.attackCooldown = 0;
    this.target = null;
  }

  update() {
    // Find nearest unit or turret
    let nearestTarget = null;
    let minDist = this.range;
    
    const allTargets = [...gameState.units, ...gameState.turrets];
    for (const target of allTargets) {
      const dist = Math.hypot(target.x - this.x, target.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearestTarget = target;
      }
    }

    this.target = nearestTarget;

    if (this.target && this.attackCooldown <= 0) {
      this.attack(this.target);
      this.attackCooldown = this.attackSpeed;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    // Move towards left side or nearest target
    if (!this.target) {
      // Move towards left side (player base)
      this.x -= this.speed;
      
      // Check if reached left edge (mission failure condition)
      if (this.x < 50) {
        this.x = 50;
      }
    } else {
      // Move towards target
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.x += Math.cos(angle) * this.speed * 0.7;
      this.y += Math.sin(angle) * this.speed * 0.7;
    }
    
    // Keep in bounds
    this.x = Math.max(20, Math.min(MAP_WIDTH - 20, this.x));
    this.y = Math.max(20, Math.min(MAP_HEIGHT - 20, this.y));
  }

  attack(target) {
    const projectile = new Projectile(this.x, this.y, target, this.damage, this.color);
    gameState.projectiles.push(projectile);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // Enemy destroyed
    }
    return false;
  }

  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
      return;
    }

    p.push();
    
    // Enemy body
    p.fill(...this.color);
    p.stroke(100);
    p.strokeWeight(2);
    
    if (this.type === 'tank') {
      p.rect(screenX - 15, screenY - 15, 30, 30);
    } else if (this.type === 'fast') {
      p.triangle(screenX - 12, screenY + 10, screenX - 12, screenY - 10, screenX + 12, screenY);
    } else {
      p.ellipse(screenX, screenY, 20, 20);
    }
    
    // Health bar
    const healthBarWidth = 30;
    const healthBarHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(50);
    p.rect(screenX - healthBarWidth / 2, screenY - 22, healthBarWidth, healthBarHeight);
    p.fill(255, 100, 100);
    p.rect(screenX - healthBarWidth / 2, screenY - 22, healthBarWidth * healthPercent, healthBarHeight);
    
    p.pop();
  }
}

export class Turret {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxHealth = 150;
    this.health = this.maxHealth;
    this.damage = 20;
    this.range = 120;
    this.attackSpeed = 40;
    this.attackCooldown = 0;
    this.target = null;
  }

  update() {
    let nearestEnemy = null;
    let minDist = this.range;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }

    this.target = nearestEnemy;

    if (this.target && this.attackCooldown <= 0) {
      this.attack(this.target);
      this.attackCooldown = this.attackSpeed;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }

  attack(target) {
    const projectile = new Projectile(this.x, this.y, target, this.damage, [100, 200, 255]);
    gameState.projectiles.push(projectile);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true;
    }
    return false;
  }

  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
      return;
    }

    p.push();
    
    // Base
    p.fill(80, 80, 100);
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(screenX - 20, screenY - 20, 40, 40);
    
    // Turret top
    p.fill(100, 100, 150);
    p.ellipse(screenX, screenY, 30, 30);
    
    // Barrel
    if (this.target) {
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      p.stroke(150);
      p.strokeWeight(4);
      p.line(screenX, screenY, screenX + Math.cos(angle) * 20, screenY + Math.sin(angle) * 20);
    }
    
    // Health bar
    const healthBarWidth = 40;
    const healthBarHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(50);
    p.noStroke();
    p.rect(screenX - healthBarWidth / 2, screenY - 28, healthBarWidth, healthBarHeight);
    p.fill(100, 200, 255);
    p.rect(screenX - healthBarWidth / 2, screenY - 28, healthBarWidth * healthPercent, healthBarHeight);
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, target, damage, color) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.color = color;
    this.speed = 8;
    this.lifetime = 120;
    this.active = true;
  }

  update() {
    if (!this.target || this.target.health <= 0) {
      this.active = false;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed + 5) {
      // Hit target
      const destroyed = this.target.takeDamage(this.damage);
      if (destroyed && this.target instanceof Enemy) {
        gameState.score += this.target.reward;
        gameState.energy = Math.min(gameState.energy + this.target.reward, 300);
        gameState.enemiesKilled++;
        createParticles(this.target.x, this.target.y, this.target.color);
      }
      this.active = false;
    } else {
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    }

    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    if (screenX < -10 || screenX > CANVAS_WIDTH + 10 || screenY < -10 || screenY > CANVAS_HEIGHT + 10) {
      return;
    }

    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(screenX, screenY, 6, 6);
    p.pop();
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.color = color;
    this.lifetime = 30;
    this.maxLifetime = 30;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.lifetime--;
  }

  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.push();
    p.fill(...this.color, alpha);
    p.noStroke();
    p.ellipse(screenX, screenY, 4, 4);
    p.pop();
  }
}

export class CapturePoint {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.captured = false;
    this.captureProgress = 0;
    this.captureRequired = 180; // 3 seconds
  }

  update() {
    if (this.captured) return;

    // Check if friendly units nearby
    let friendlyNearby = 0;
    let enemyNearby = 0;
    
    for (const unit of gameState.units) {
      const dist = Math.hypot(unit.x - this.x, unit.y - this.y);
      if (dist < 80) friendlyNearby++;
    }
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < 80) enemyNearby++;
    }

    if (friendlyNearby > enemyNearby && friendlyNearby > 0) {
      this.captureProgress += friendlyNearby;
      if (this.captureProgress >= this.captureRequired) {
        this.captured = true;
        gameState.missionObjectives.capturedPoints++;
        gameState.score += 100;
      }
    } else if (enemyNearby > 0) {
      this.captureProgress = Math.max(0, this.captureProgress - 0.5);
    }
  }

  draw(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    if (screenX < -100 || screenX > CANVAS_WIDTH + 100 || screenY < -100 || screenY > CANVAS_HEIGHT + 100) {
      return;
    }

    p.push();
    
    // Base circle
    p.fill(...(this.captured ? [100, 255, 100, 50] : [200, 200, 200, 50]));
    p.stroke(...(this.captured ? [100, 255, 100] : [200, 200, 200]));
    p.strokeWeight(3);
    p.circle(screenX, screenY, 60);
    
    // Capture progress
    if (!this.captured && this.captureProgress > 0) {
      p.noStroke();
      p.fill(100, 200, 255, 100);
      const angle = (this.captureProgress / this.captureRequired) * 360;
      p.arc(screenX, screenY, 50, 50, -90, -90 + angle);
    }
    
    // Flag or indicator
    p.fill(...(this.captured ? [100, 255, 100] : [255, 255, 255]));
    p.noStroke();
    p.triangle(screenX, screenY - 20, screenX, screenY - 10, screenX + 10, screenY - 15);
    p.rect(screenX - 1, screenY - 20, 2, 20);
    
    p.pop();
  }
}

function createParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    gameState.particles.push(new Particle(x, y, color));
  }
}