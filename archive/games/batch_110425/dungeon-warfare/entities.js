// entities.js - Game entities

import { GRID_SIZE, TRAP_DATA, PATH_WAYPOINTS, ENEMY_TYPES, CORE_POSITION } from './globals.js';

export class Trap {
  constructor(x, y, type, tier = 1) {
    this.gridX = x;
    this.gridY = y;
    this.x = x * GRID_SIZE + GRID_SIZE / 2;
    this.y = y * GRID_SIZE + GRID_SIZE / 2;
    this.type = type;
    this.tier = tier;
    this.cooldownTimer = 0;
    this.active = true;
    this.data = TRAP_DATA[type];
    this.effectTimer = 0;
  }
  
  update(gameState, p) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer--;
    }
    
    if (this.type === 'LAVA' && this.effectTimer > 0) {
      this.effectTimer--;
      // Damage enemies in range
      gameState.enemies.forEach(enemy => {
        const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
        if (dist < GRID_SIZE * 1.5) {
          enemy.takeDamage(this.data.damage[this.tier - 1] / 60); // Per frame damage
        }
      });
    }
  }
  
  canUpgrade() {
    return this.tier < 3;
  }
  
  getUpgradeCost() {
    if (this.tier >= 3) return Infinity;
    return this.data.upgradeCost[this.tier];
  }
  
  upgrade() {
    if (this.canUpgrade()) {
      this.tier++;
      return true;
    }
    return false;
  }
  
  trigger(gameState, p) {
    if (this.cooldownTimer > 0) return;
    
    switch (this.type) {
      case 'DART':
        this.fireDart(gameState, p);
        break;
      case 'SPRING':
        this.activateSpring(gameState, p);
        break;
      case 'LAVA':
        this.activateLava();
        break;
      case 'SUMMON':
        this.summonMinion(gameState, p);
        break;
    }
    
    this.cooldownTimer = this.data.cooldown[this.tier - 1];
  }
  
  fireDart(gameState, p) {
    // Find nearest enemy
    let nearest = null;
    let minDist = this.data.range;
    
    gameState.enemies.forEach(enemy => {
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });
    
    if (nearest) {
      const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
      gameState.projectiles.push(new Projectile(
        this.x, this.y, angle, this.data.damage[this.tier - 1], 'dart'
      ));
    }
  }
  
  activateSpring(gameState, p) {
    gameState.enemies.forEach(enemy => {
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < GRID_SIZE * 1.2) {
        enemy.takeDamage(this.data.damage[this.tier - 1]);
        enemy.knockback(this.data.knockback[this.tier - 1], this.x, this.y);
      }
    });
  }
  
  activateLava() {
    this.effectTimer = this.data.duration[this.tier - 1];
  }
  
  summonMinion(gameState, p) {
    gameState.minions.push(new Minion(
      this.x, this.y, this.data.damage[this.tier - 1]
    ));
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base platform
    p.fill(60, 40, 20);
    p.rect(-15, -15, 30, 30);
    
    // Tier indicators
    for (let i = 0; i < this.tier; i++) {
      p.fill(255, 215, 0);
      p.circle(-10 + i * 10, -18, 4);
    }
    
    // Trap-specific rendering
    switch (this.type) {
      case 'DART':
        this.drawDart(p);
        break;
      case 'SPRING':
        this.drawSpring(p);
        break;
      case 'LAVA':
        this.drawLava(p);
        break;
      case 'SUMMON':
        this.drawSummon(p);
        break;
    }
    
    // Cooldown indicator
    if (this.cooldownTimer > 0) {
      const ratio = this.cooldownTimer / this.data.cooldown[this.tier - 1];
      p.fill(0, 0, 0, 100);
      p.rect(-15, -15, 30, 30 * ratio);
    }
    
    p.pop();
  }
  
  drawDart(p) {
    p.fill(120, 120, 140);
    p.triangle(-8, 0, 8, -6, 8, 6);
    p.fill(200, 200, 220);
    p.circle(0, 0, 8);
  }
  
  drawSpring(p) {
    p.stroke(180, 180, 180);
    p.strokeWeight(2);
    p.noFill();
    const coils = 5;
    for (let i = 0; i < coils; i++) {
      const y1 = -10 + (i / coils) * 20;
      const y2 = -10 + ((i + 0.5) / coils) * 20;
      p.line(-6, y1, 6, y2);
    }
    p.noStroke();
  }
  
  drawLava(p) {
    if (this.effectTimer > 0) {
      // Active lava
      p.fill(255, 100, 0, 150);
      p.circle(0, 0, GRID_SIZE * 2.5);
      p.fill(255, 50, 0);
      p.circle(0, 0, 12);
    } else {
      p.fill(150, 50, 0);
      p.circle(0, 0, 12);
    }
    // Glow effect
    for (let i = 3; i > 0; i--) {
      p.fill(255, 100, 0, 30);
      p.circle(0, 0, 12 + i * 4);
    }
  }
  
  drawSummon(p) {
    p.fill(100, 50, 150);
    p.circle(0, 0, 14);
    p.fill(150, 100, 200);
    p.circle(0, -4, 6);
    p.circle(-4, 3, 5);
    p.circle(4, 3, 5);
  }
}

export class Enemy {
  constructor(type, waveMultiplier = 1) {
    this.type = type;
    this.data = ENEMY_TYPES[type];
    this.maxHealth = this.data.health * waveMultiplier;
    this.health = this.maxHealth;
    this.speed = this.data.speed;
    this.gold = Math.floor(this.data.gold * waveMultiplier);
    this.color = this.data.color;
    
    // Position on path
    this.pathIndex = 0;
    this.pathProgress = 0;
    
    const start = PATH_WAYPOINTS[0];
    this.x = start.x * GRID_SIZE + GRID_SIZE / 2;
    this.y = start.y * GRID_SIZE + GRID_SIZE / 2;
    
    this.targetX = this.x;
    this.targetY = this.y;
    this.updateTarget();
    
    this.alive = true;
    this.reachedCore = false;
    this.knockbackVelX = 0;
    this.knockbackVelY = 0;
  }
  
  updateTarget() {
    if (this.pathIndex < PATH_WAYPOINTS.length - 1) {
      const next = PATH_WAYPOINTS[this.pathIndex + 1];
      this.targetX = next.x * GRID_SIZE + GRID_SIZE / 2;
      this.targetY = next.y * GRID_SIZE + GRID_SIZE / 2;
    }
  }
  
  update(p) {
    if (!this.alive || this.reachedCore) return;
    
    // Apply knockback
    if (Math.abs(this.knockbackVelX) > 0.1 || Math.abs(this.knockbackVelY) > 0.1) {
      this.x += this.knockbackVelX;
      this.y += this.knockbackVelY;
      this.knockbackVelX *= 0.9;
      this.knockbackVelY *= 0.9;
      return;
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 2) {
      // Reached waypoint
      this.pathIndex++;
      if (this.pathIndex >= PATH_WAYPOINTS.length - 1) {
        // Reached core
        this.reachedCore = true;
        return;
      }
      this.updateTarget();
    } else {
      // Move towards target
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }
  
  knockback(force, sourceX, sourceY) {
    const dx = this.x - sourceX;
    const dy = this.y - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.knockbackVelX = (dx / dist) * force * 0.1;
      this.knockbackVelY = (dy / dist) * force * 0.1;
      
      // Move back on path
      this.pathProgress = Math.max(0, this.pathProgress - force * 0.01);
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Body
    p.fill(...this.color);
    p.circle(0, 0, 16);
    
    // Health bar
    const barWidth = 20;
    const barHeight = 3;
    const healthRatio = this.health / this.maxHealth;
    
    p.fill(60);
    p.rect(-barWidth/2, -12, barWidth, barHeight);
    p.fill(healthRatio > 0.5 ? 0 : 255, healthRatio > 0.5 ? 255 : 0, 0);
    p.rect(-barWidth/2, -12, barWidth * healthRatio, barHeight);
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, angle, damage, type) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.type = type;
    this.speed = 4;
    this.lifetime = 60;
    this.active = true;
  }
  
  update(gameState, p) {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    // Check collision with enemies
    gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < 12) {
        enemy.takeDamage(this.damage);
        this.active = false;
      }
    });
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    if (this.type === 'dart') {
      p.fill(200, 200, 220);
      p.triangle(-6, 0, 6, -2, 6, 2);
    }
    
    p.pop();
  }
}

export class Minion {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.lifetime = 300; // 5 seconds
    this.active = true;
    this.attackCooldown = 0;
  }
  
  update(gameState, p) {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Find and attack nearest enemy
    let nearest = null;
    let minDist = 100;
    
    gameState.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    });
    
    if (nearest && this.attackCooldown === 0) {
      nearest.takeDamage(this.damage);
      this.attackCooldown = 30;
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const alpha = (this.lifetime / 300) * 255;
    p.fill(150, 100, 200, alpha);
    p.circle(0, 0, 12);
    p.fill(200, 150, 255, alpha);
    p.circle(0, -3, 5);
    
    p.pop();
  }
}