// entities.js - Game entity classes

import { gameState, GAME_CONFIG, PATH_WAYPOINTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createParticleExplosion, createDamageNumber } from './particles.js';

// Tower class
export class Tower {
  constructor(x, y, gridX, gridY) {
    this.x = x;
    this.y = y;
    this.gridX = gridX;
    this.gridY = gridY;
    this.width = 35;
    this.height = 35;
    this.level = 1;
    this.gem = null;
    this.range = 0;
    this.damage = 0;
    this.attackSpeed = 1.0;
    this.attackCooldown = 0;
    this.target = null;
    
    gameState.towers.push(this);
    gameState.entities.push(this);
  }
  
  placeGem(gem) {
    if (this.gem) {
      // Combine gems if same type
      if (this.gem.type === gem.type && this.gem.tier === gem.tier) {
        this.gem.tier++;
        this.gem.updateStats();
        return true;
      }
      return false; // Can't place different gem
    }
    
    this.gem = gem;
    gem.tower = this;
    this.updateStats();
    return true;
  }
  
  removeGem() {
    if (this.gem) {
      const gem = this.gem;
      this.gem = null;
      gem.tower = null;
      this.updateStats();
      return gem;
    }
    return null;
  }
  
  updateStats() {
    if (this.gem) {
      this.range = this.gem.range;
      this.damage = this.gem.damage;
      this.attackSpeed = this.gem.attackSpeed;
    } else {
      this.range = 0;
      this.damage = 0;
      this.attackSpeed = 1.0;
    }
  }
  
  update(p) {
    if (!this.gem) return;
    
    // Reduce cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Find target
    if (!this.target || this.target.isDead || !this.isInRange(this.target)) {
      this.findTarget();
    }
    
    // Attack target
    if (this.target && this.attackCooldown <= 0) {
      this.attack();
      this.attackCooldown = 60 / this.attackSpeed; // Convert to frames
    }
  }
  
  findTarget() {
    this.target = null;
    let closestDist = Infinity;
    
    for (const monster of gameState.monsters) {
      if (monster.isDead) continue;
      
      const dist = Math.sqrt(
        Math.pow(monster.x - this.x, 2) + 
        Math.pow(monster.y - this.y, 2)
      );
      
      if (dist <= this.range && dist < closestDist) {
        this.target = monster;
        closestDist = dist;
      }
    }
  }
  
  isInRange(monster) {
    const dist = Math.sqrt(
      Math.pow(monster.x - this.x, 2) + 
      Math.pow(monster.y - this.y, 2)
    );
    return dist <= this.range;
  }
  
  attack() {
    if (!this.target || !this.gem) return;
    
    // Create projectile
    const proj = new Projectile(
      this.x,
      this.y,
      this.target,
      this.gem.type,
      this.damage,
      this.gem.effect
    );
    
    gameState.projectiles.push(proj);
  }
  
  upgrade() {
    this.level++;
    if (this.gem) {
      this.gem.range *= 1.1;
      this.gem.damage *= 1.15;
      this.updateStats();
    }
  }
  
  getSellValue() {
    let value = Math.floor(GAME_CONFIG.TOWER_COST * 0.7);
    if (this.gem) {
      value += this.gem.getSellValue();
    }
    return value;
  }
  
  render(p) {
    // Tower base
    p.push();
    p.translate(this.x, this.y);
    
    // Draw range circle if selected
    if (gameState.selectedTower === this) {
      p.noFill();
      p.stroke(255, 255, 0, 100);
      p.strokeWeight(2);
      p.circle(0, 0, this.range * 2);
    }
    
    // Tower body
    p.fill(80, 80, 100);
    p.stroke(60, 60, 80);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 3);
    
    // Tower top
    p.fill(100, 100, 120);
    p.triangle(-this.width/2, -this.height/2, this.width/2, -this.height/2, 0, -this.height/2 - 8);
    
    // Gem socket
    if (this.gem) {
      this.gem.render(p);
    } else {
      p.fill(40, 40, 50);
      p.circle(0, 0, 20);
    }
    
    // Selection indicator
    if (gameState.selectedTower === this) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(0, 0, this.width + 6, this.height + 6, 3);
    }
    
    p.pop();
  }
}

// Gem class
export class Gem {
  constructor(type, tier = 1) {
    this.type = type;
    this.tier = tier;
    this.tower = null;
    
    const baseStats = GAME_CONFIG.GEM_TYPES[type];
    this.baseDamage = baseStats.damage;
    this.baseRange = baseStats.range;
    this.baseSpeed = baseStats.speed;
    this.effect = baseStats.effect;
    this.color = baseStats.color;
    
    this.updateStats();
    gameState.gems.push(this);
  }
  
  updateStats() {
    const multiplier = Math.pow(1.5, this.tier - 1);
    this.damage = Math.floor(this.baseDamage * multiplier);
    this.range = Math.floor(this.baseRange * Math.pow(1.1, this.tier - 1));
    this.attackSpeed = this.baseSpeed * Math.pow(1.05, this.tier - 1);
  }
  
  getCost() {
    return Math.floor(GAME_CONFIG.GEM_BASE_COST * Math.pow(2, this.tier - 1));
  }
  
  getSellValue() {
    return Math.floor(this.getCost() * 0.7);
  }
  
  render(p) {
    // Render gem on tower
    p.push();
    
    // Glow effect
    const glowSize = 25 + Math.sin(gameState.frameCount * 0.1) * 3;
    p.fill(this.color[0], this.color[1], this.color[2], 50);
    p.noStroke();
    p.circle(0, 0, glowSize);
    
    // Main gem
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(2);
    
    // Draw as diamond shape
    const size = 12 + this.tier * 2;
    p.beginShape();
    p.vertex(0, -size);
    p.vertex(size * 0.7, 0);
    p.vertex(0, size);
    p.vertex(-size * 0.7, 0);
    p.endShape(p.CLOSE);
    
    // Inner shine
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.beginShape();
    p.vertex(0, -size * 0.5);
    p.vertex(size * 0.3, 0);
    p.vertex(0, size * 0.5);
    p.vertex(-size * 0.3, 0);
    p.endShape(p.CLOSE);
    
    // Tier indicator
    if (this.tier > 1) {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(1);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.tier, 0, size + 8);
    }
    
    p.pop();
  }
}

// Monster class
export class Monster {
  constructor(wave) {
    this.wave = wave;
    this.waypointIndex = 0;
    this.x = PATH_WAYPOINTS[0].x;
    this.y = PATH_WAYPOINTS[0].y;
    this.size = 15;
    this.isDead = false;
    this.isAtEnd = false;
    
    // Stats based on wave
    const healthScale = Math.pow(GAME_CONFIG.MONSTER_HEALTH_SCALE, wave - 1);
    const speedScale = Math.pow(GAME_CONFIG.MONSTER_SPEED_SCALE, wave - 1);
    
    this.maxHealth = Math.floor(GAME_CONFIG.MONSTER_BASE_HEALTH * healthScale);
    this.health = this.maxHealth;
    this.baseSpeed = GAME_CONFIG.MONSTER_BASE_SPEED * speedScale;
    this.speed = this.baseSpeed;
    this.slowAmount = 0;
    this.slowDuration = 0;
    
    // Rewards
    this.manaReward = 5 + wave * 2;
    this.scoreReward = 10 + wave * 5;
    
    gameState.monsters.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.isDead || this.isAtEnd) return;
    
    // Update slow effect
    if (this.slowDuration > 0) {
      this.slowDuration--;
      this.speed = this.baseSpeed * (1 - this.slowAmount);
    } else {
      this.speed = this.baseSpeed;
      this.slowAmount = 0;
    }
    
    // Move towards current waypoint
    const target = PATH_WAYPOINTS[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      // Reached waypoint
      this.waypointIndex++;
      
      if (this.waypointIndex >= PATH_WAYPOINTS.length) {
        // Reached end
        this.reachEnd();
        return;
      }
    } else {
      // Move towards waypoint
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  takeDamage(amount, effect) {
    if (this.isDead) return;
    
    this.health -= amount;
    
    // Apply effect
    if (effect === 'slow') {
      this.slowAmount = Math.max(this.slowAmount, 0.5);
      this.slowDuration = 60; // 1 second
    }
    
    // Create damage number
    createDamageNumber(this.x, this.y, amount);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  applySlow(amount, duration) {
    this.slowAmount = Math.max(this.slowAmount, amount);
    this.slowDuration = Math.max(this.slowDuration, duration);
  }
  
  die() {
    if (this.isDead) return;
    
    this.isDead = true;
    gameState.mana += this.manaReward;
    gameState.score += this.scoreReward;
    
    // Create death particles
    createParticleExplosion(this.x, this.y, [150, 50, 200]);
    
    // Remove from arrays
    const monsterIndex = gameState.monsters.indexOf(this);
    if (monsterIndex > -1) {
      gameState.monsters.splice(monsterIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
  }
  
  reachEnd() {
    if (this.isAtEnd) return;
    
    this.isAtEnd = true;
    gameState.lives--;
    
    // Remove from arrays
    const monsterIndex = gameState.monsters.indexOf(this);
    if (monsterIndex > -1) {
      gameState.monsters.splice(monsterIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    // Check lose condition
    if (gameState.lives <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
  
  render(p) {
    if (this.isDead || this.isAtEnd) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Slow effect
    if (this.slowDuration > 0) {
      p.fill(100, 150, 255, 80);
      p.noStroke();
      p.circle(0, 0, this.size * 2.5);
    }
    
    // Monster body
    p.fill(150, 50, 200);
    p.stroke(100, 30, 150);
    p.strokeWeight(2);
    p.circle(0, 0, this.size * 2);
    
    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-5, -3, 4);
    p.circle(5, -3, 4);
    
    // Health bar
    const barWidth = this.size * 2;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(200, 0, 0);
    p.rect(-barWidth / 2, -this.size - 8, barWidth, barHeight);
    
    p.fill(0, 255, 0);
    p.rect(-barWidth / 2, -this.size - 8, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
}

// Projectile class
export class Projectile {
  constructor(x, y, target, gemType, damage, effect) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.gemType = gemType;
    this.damage = damage;
    this.effect = effect;
    this.speed = 8;
    this.reached = false;
    
    const gemConfig = GAME_CONFIG.GEM_TYPES[gemType];
    this.color = gemConfig.color;
  }
  
  update(p) {
    if (this.reached || !this.target || this.target.isDead) {
      this.remove();
      return;
    }
    
    // Move towards target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      // Hit target
      this.hit();
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  hit() {
    if (this.reached) return;
    this.reached = true;
    
    if (this.effect === 'splash') {
      // Emerald - splash damage
      const splashRadius = 50;
      for (const monster of gameState.monsters) {
        if (monster.isDead) continue;
        
        const dist = Math.sqrt(
          Math.pow(monster.x - this.target.x, 2) + 
          Math.pow(monster.y - this.target.y, 2)
        );
        
        if (dist <= splashRadius) {
          const splashDamage = dist < 20 ? this.damage : Math.floor(this.damage * 0.5);
          monster.takeDamage(splashDamage, this.effect);
        }
      }
      
      // Create splash effect
      createParticleExplosion(this.target.x, this.target.y, this.color);
    } else {
      // Direct hit
      this.target.takeDamage(this.damage, this.effect);
    }
    
    this.remove();
  }
  
  remove() {
    const index = gameState.projectiles.indexOf(this);
    if (index > -1) {
      gameState.projectiles.splice(index, 1);
    }
  }
  
  render(p) {
    if (this.reached) return;
    
    p.push();
    
    // Trail effect
    p.stroke(this.color[0], this.color[1], this.color[2], 100);
    p.strokeWeight(3);
    
    if (this.target && !this.target.isDead) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const trailDist = 10;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const trailX = this.x - (dx / dist) * trailDist;
        const trailY = this.y - (dy / dist) * trailDist;
        p.line(this.x, this.y, trailX, trailY);
      }
    }
    
    // Projectile
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.noStroke();
    p.circle(this.x, this.y, 8);
    
    // Glow
    p.fill(this.color[0], this.color[1], this.color[2], 100);
    p.circle(this.x, this.y, 12);
    
    p.pop();
  }
}