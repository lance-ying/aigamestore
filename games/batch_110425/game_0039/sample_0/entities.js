import { ENEMY_TYPES } from './globals.js';

export class Enemy {
  constructor(type, path, waveMultiplier = 1) {
    this.type = type;
    this.typeData = ENEMY_TYPES[type];
    this.health = this.typeData.health * waveMultiplier;
    this.maxHealth = this.health;
    this.speed = this.typeData.speed;
    this.reward = Math.floor(this.typeData.reward * waveMultiplier);
    this.color = this.typeData.color;
    this.size = this.typeData.size;
    this.path = path;
    this.pathIndex = 0;
    this.x = path[0].x;
    this.y = path[0].y;
    this.reachedGoal = false;
    this.dead = false;
  }
  
  update(gameSpeed) {
    if (this.dead || this.reachedGoal) return;
    
    if (this.pathIndex >= this.path.length - 1) {
      this.reachedGoal = true;
      return;
    }
    
    const target = this.path[this.pathIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed * gameSpeed) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length - 1) {
        this.reachedGoal = true;
      }
    } else {
      this.x += (dx / dist) * this.speed * gameSpeed;
      this.y += (dy / dist) * this.speed * gameSpeed;
    }
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }
  
  render(p) {
    if (this.dead || this.reachedGoal) return;
    
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size * 2);
    
    const healthBarWidth = this.size * 2;
    const healthBarHeight = 3;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(255, 0, 0);
    p.rect(this.x - healthBarWidth / 2, this.y - this.size - 5, healthBarWidth, healthBarHeight);
    p.fill(0, 255, 0);
    p.rect(this.x - healthBarWidth / 2, this.y - this.size - 5, healthBarWidth * healthPercent, healthBarHeight);
    p.pop();
  }
}

export class Tower {
  constructor(type, x, y, typeData) {
    this.type = type;
    this.typeData = typeData;
    this.x = x;
    this.y = y;
    this.level = 0;
    this.damage = typeData.damage;
    this.range = typeData.range;
    this.fireRate = typeData.fireRate;
    this.color = typeData.color;
    this.fireTimer = 0;
    this.target = null;
    this.rotation = 0;
  }
  
  update(enemies, projectiles, gameSpeed) {
    this.fireTimer = Math.max(0, this.fireTimer - gameSpeed);
    
    this.target = this.findTarget(enemies);
    
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      this.rotation = Math.atan2(dy, dx);
      
      if (this.fireTimer === 0) {
        this.fire(projectiles);
        this.fireTimer = this.fireRate;
      }
    }
  }
  
  findTarget(enemies) {
    let closestEnemy = null;
    let maxProgress = -1;
    
    const rangeMultiplier = this.typeData.rangeMultiplier[this.level];
    const effectiveRange = this.range * rangeMultiplier;
    
    for (const enemy of enemies) {
      if (enemy.dead || enemy.reachedGoal) continue;
      
      const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
      
      if (dist <= effectiveRange) {
        if (enemy.pathIndex > maxProgress) {
          maxProgress = enemy.pathIndex;
          closestEnemy = enemy;
        }
      }
    }
    
    return closestEnemy;
  }
  
  fire(projectiles) {
    if (!this.target) return;
    
    const damageMultiplier = this.typeData.damageMultiplier[this.level];
    const damage = this.damage * damageMultiplier;
    
    projectiles.push(new Projectile(this.x, this.y, this.target, damage, this.color, this.type));
  }
  
  upgrade() {
    if (this.level < 2) {
      this.level++;
      return true;
    }
    return false;
  }
  
  getUpgradeCost() {
    if (this.level < 2) {
      return this.typeData.upgradeCost[this.level];
    }
    return null;
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(1);
    p.rectMode(p.CENTER);
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.rect(0, 0, 20, 20);
    p.fill(255);
    p.noStroke();
    p.rect(8, 0, 8, 4);
    p.pop();
    
    if (this.level > 0) {
      p.push();
      p.fill(255, 215, 0);
      p.noStroke();
      for (let i = 0; i < this.level; i++) {
        p.ellipse(this.x - 8 + i * 8, this.y - 15, 4);
      }
      p.pop();
    }
    
    const rangeMultiplier = this.typeData.rangeMultiplier[this.level];
    const effectiveRange = this.range * rangeMultiplier;
    
    p.push();
    p.noFill();
    p.stroke(...this.color, 50);
    p.strokeWeight(1);
    p.ellipse(this.x, this.y, effectiveRange * 2);
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, target, damage, color, type) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.color = color;
    this.type = type;
    this.speed = 5;
    this.dead = false;
  }
  
  update(gameSpeed) {
    if (this.dead || !this.target || this.target.dead || this.target.reachedGoal) {
      this.dead = true;
      return;
    }
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed * gameSpeed) {
      this.target.takeDamage(this.damage);
      this.dead = true;
    } else {
      this.x += (dx / dist) * this.speed * gameSpeed;
      this.y += (dy / dist) * this.speed * gameSpeed;
    }
  }
  
  render(p) {
    if (this.dead) return;
    
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, 4);
    p.pop();
  }
}