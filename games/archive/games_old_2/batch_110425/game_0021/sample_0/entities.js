// entities.js - Game entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, HERO_BASE_DAMAGE, HERO_BASE_HP, HERO_SPEED, HERO_ATTACK_RANGE, HERO_ATTACK_COOLDOWN, HERO_XP_PER_LEVEL, TOWER_TYPES, UPGRADE_COST_MULTIPLIER, MAX_TOWER_TIER } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.hp = HERO_BASE_HP;
    this.maxHp = HERO_BASE_HP;
    this.damage = HERO_BASE_DAMAGE;
    this.speed = HERO_SPEED;
    this.attackRange = HERO_ATTACK_RANGE;
    this.attackCooldown = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = HERO_XP_PER_LEVEL;
    this.abilityReady = true;
    this.abilityCooldown = 0;
    this.target = null;
  }
  
  move(dx, dy) {
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y));
  }
  
  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.abilityCooldown > 0) {
      this.abilityCooldown--;
      if (this.abilityCooldown === 0) this.abilityReady = true;
    }
    
    // Find nearest enemy
    this.target = null;
    let nearestDist = this.attackRange;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        this.target = enemy;
      }
    }
    
    // Attack if target in range and cooldown ready
    if (this.target && this.attackCooldown === 0) {
      this.attack(this.target);
    }
  }
  
  attack(enemy) {
    const heroDamageBonus = 1 + (gameState.metaUpgrades.HERO_DAMAGE * 0.2);
    const totalDamage = this.damage * heroDamageBonus;
    enemy.takeDamage(totalDamage);
    this.attackCooldown = HERO_ATTACK_COOLDOWN;
    
    // Visual feedback
    createHitParticle(enemy.x, enemy.y, [255, 255, 100]);
  }
  
  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.floor(HERO_XP_PER_LEVEL * Math.pow(1.5, this.level - 1));
    this.damage += 5;
    this.maxHp += 20;
    this.hp = this.maxHp;
    createLevelUpParticle(this.x, this.y);
  }
  
  useAbility() {
    if (!this.abilityReady) return false;
    
    // Area damage ability
    const abilityRange = 120;
    let hitCount = 0;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < abilityRange) {
        enemy.takeDamage(this.damage * 2);
        hitCount++;
      }
    }
    
    if (hitCount > 0) {
      this.abilityReady = false;
      this.abilityCooldown = 300; // 5 seconds
      createAbilityParticle(this.x, this.y, abilityRange);
      return true;
    }
    
    return false;
  }
  
  render(p) {
    // Hero body
    p.push();
    p.fill(50, 100, 200);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.size);
    
    // Hero cape
    p.noStroke();
    p.fill(150, 50, 50);
    p.triangle(
      this.x - 8, this.y - 5,
      this.x + 8, this.y - 5,
      this.x, this.y + 15
    );
    
    // Crown
    p.fill(255, 215, 0);
    p.rect(this.x - 6, this.y - 12, 12, 4);
    p.triangle(this.x - 6, this.y - 12, this.x, this.y - 18, this.x + 6, this.y - 12);
    p.pop();
    
    // HP bar
    const barWidth = 30;
    const barHeight = 4;
    const hpRatio = this.hp / this.maxHp;
    p.push();
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y - this.size - 5, barWidth, barHeight);
    p.fill(0, 255, 0);
    p.rect(this.x - barWidth/2, this.y - this.size - 5, barWidth * hpRatio, barHeight);
    p.pop();
    
    // Attack range indicator when selected
    if (gameState.selectedTower === null) {
      p.push();
      p.noFill();
      p.stroke(100, 150, 255, 50);
      p.strokeWeight(1);
      p.circle(this.x, this.y, this.attackRange * 2);
      p.pop();
    }
  }
}

export class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.tier = 1;
    this.config = TOWER_TYPES[type];
    this.damage = this.config.damage;
    this.range = this.config.range;
    this.fireRate = this.config.fireRate;
    this.fireCooldown = 0;
    this.target = null;
    this.rotation = 0;
  }
  
  getCost() {
    return Math.floor(this.config.cost * Math.pow(UPGRADE_COST_MULTIPLIER, this.tier - 1));
  }
  
  getUpgradeCost() {
    if (this.tier >= MAX_TOWER_TIER) return null;
    return Math.floor(this.config.cost * Math.pow(UPGRADE_COST_MULTIPLIER, this.tier));
  }
  
  getSellValue() {
    let total = 0;
    for (let t = 1; t <= this.tier; t++) {
      total += Math.floor(this.config.cost * Math.pow(UPGRADE_COST_MULTIPLIER, t - 1));
    }
    return Math.floor(total * 0.7);
  }
  
  upgrade() {
    if (this.tier >= MAX_TOWER_TIER) return false;
    const cost = this.getUpgradeCost();
    if (gameState.gold >= cost) {
      gameState.gold -= cost;
      this.tier++;
      this.damage = this.config.damage * (1 + (this.tier - 1) * 0.5);
      this.range = this.config.range * (1 + (this.tier - 1) * 0.15);
      this.fireRate = Math.max(10, this.config.fireRate - (this.tier - 1) * 8);
      return true;
    }
    return false;
  }
  
  update() {
    if (this.fireCooldown > 0) this.fireCooldown--;
    
    // Apply meta upgrades
    const damageBonus = 1 + (gameState.metaUpgrades.TOWER_DAMAGE * 0.15);
    const rangeBonus = 1 + (gameState.metaUpgrades.TOWER_RANGE * 0.1);
    const effectiveRange = this.range * rangeBonus;
    
    // Find target
    this.target = null;
    let furthestProgress = -1;
    
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= effectiveRange && enemy.pathProgress > furthestProgress) {
        furthestProgress = enemy.pathProgress;
        this.target = enemy;
      }
    }
    
    // Aim at target
    if (this.target) {
      this.rotation = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      
      // Fire if ready
      if (this.fireCooldown === 0) {
        this.fire(damageBonus);
      }
    }
  }
  
  fire(damageBonus) {
    if (!this.target) return;
    
    const totalDamage = this.damage * damageBonus;
    
    if (this.type === "FROST") {
      // Frost tower slows enemies
      this.target.takeDamage(totalDamage);
      this.target.applyFreeze(0.5, 60);
    } else if (this.type === "CANNON") {
      // Cannon has splash damage
      const splashRange = 40;
      for (const enemy of gameState.enemies) {
        const dist = Math.hypot(enemy.x - this.target.x, enemy.y - this.target.y);
        if (dist <= splashRange) {
          enemy.takeDamage(totalDamage * (1 - dist / splashRange * 0.5));
        }
      }
    } else {
      // Single target
      this.target.takeDamage(totalDamage);
    }
    
    // Create projectile visual
    gameState.projectiles.push(new Projectile(this.x, this.y, this.target.x, this.target.y, this.config.color));
    
    this.fireCooldown = this.fireRate;
  }
  
  render(p) {
    const rangeBonus = 1 + (gameState.metaUpgrades.TOWER_RANGE * 0.1);
    const effectiveRange = this.range * rangeBonus;
    
    // Range indicator if selected
    if (gameState.selectedTower === this) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 255, 80);
      p.strokeWeight(1);
      p.circle(this.x, this.y, effectiveRange * 2);
      p.pop();
    }
    
    // Tower base
    const baseSize = 25 + this.tier * 3;
    p.push();
    p.fill(...this.config.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, baseSize, baseSize, 3);
    p.pop();
    
    // Tower top (rotates)
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.fill(...this.config.color.map(c => c * 0.7));
    p.stroke(0);
    p.strokeWeight(2);
    
    // Draw different shapes for different tower types
    if (this.type === "ARROW") {
      p.triangle(5, 0, -5, -5, -5, 5);
    } else if (this.type === "MAGIC") {
      p.ellipse(0, 0, 15, 10);
    } else if (this.type === "CANNON") {
      p.rect(0, 0, 18, 10);
    } else if (this.type === "FROST") {
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        p.vertex(Math.cos(angle) * 8, Math.sin(angle) * 8);
      }
      p.endShape(p.CLOSE);
    }
    p.pop();
    
    // Tier indicators
    p.push();
    p.fill(255, 215, 0);
    p.noStroke();
    for (let i = 0; i < this.tier; i++) {
      p.circle(this.x - 8 + i * 8, this.y - baseSize/2 - 5, 4);
    }
    p.pop();
  }
}

export class Enemy {
  constructor(type, path) {
    this.type = type.type;
    this.maxHp = type.hp;
    this.hp = type.hp;
    this.speed = type.speed;
    this.gold = type.gold;
    this.color = type.color;
    this.path = path;
    this.pathProgress = 0;
    this.currentWaypoint = 0;
    this.x = path[0].x;
    this.y = path[0].y;
    this.size = 12;
    this.freezeSlowdown = 1;
    this.freezeDuration = 0;
    this.reachedEnd = false;
  }
  
  update() {
    if (this.reachedEnd) return;
    
    // Update freeze effect
    if (this.freezeDuration > 0) {
      this.freezeDuration--;
      if (this.freezeDuration === 0) this.freezeSlowdown = 1;
    }
    
    // Move along path
    const effectiveSpeed = this.speed * this.freezeSlowdown;
    const target = this.path[this.currentWaypoint];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < effectiveSpeed) {
      this.x = target.x;
      this.y = target.y;
      this.currentWaypoint++;
      
      if (this.currentWaypoint >= this.path.length) {
        this.reachedEnd = true;
        gameState.lives--;
        return;
      }
    } else {
      this.x += (dx / dist) * effectiveSpeed;
      this.y += (dy / dist) * effectiveSpeed;
    }
    
    this.pathProgress = this.currentWaypoint + (1 - dist / 50);
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  applyFreeze(slowAmount, duration) {
    this.freezeSlowdown = slowAmount;
    this.freezeDuration = duration;
  }
  
  die() {
    gameState.gold += this.gold;
    if (gameState.player) {
      gameState.player.gainXP(Math.floor(this.gold * 2));
    }
    
    const index = gameState.enemies.indexOf(this);
    if (index > -1) {
      gameState.enemies.splice(index, 1);
    }
    
    createDeathParticle(this.x, this.y, this.color);
  }
  
  render(p) {
    // Enemy body
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.size);
    
    // Freeze indicator
    if (this.freezeDuration > 0) {
      p.fill(150, 200, 255, 150);
      p.noStroke();
      p.circle(this.x, this.y, this.size + 4);
    }
    p.pop();
    
    // HP bar
    const barWidth = 20;
    const barHeight = 3;
    const hpRatio = this.hp / this.maxHp;
    p.push();
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y - this.size - 3, barWidth, barHeight);
    p.fill(255, 0, 0);
    p.rect(this.x - barWidth/2, this.y - this.size - 3, barWidth * hpRatio, barHeight);
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, targetX, targetY, color) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
    this.speed = 10;
    this.life = 30;
    
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    return this.life <= 0;
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, 6);
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
    return this.life <= 0;
  }
  
  render(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.push();
    p.fill(...this.color, alpha);
    p.noStroke();
    p.circle(this.x, this.y, 4);
    p.pop();
  }
}

// Particle helpers
export function createHitParticle(x, y, color) {
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    gameState.particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      20
    ));
  }
}

export function createDeathParticle(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const speed = Math.random() * 3 + 2;
    gameState.particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2,
      color,
      30
    ));
  }
}

export function createLevelUpParticle(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    const speed = 3;
    gameState.particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 3,
      [255, 215, 0],
      40
    ));
  }
}

export function createAbilityParticle(x, y, range) {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i;
    const speed = range / 15;
    gameState.particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 255, 100],
      30
    ));
  }
}