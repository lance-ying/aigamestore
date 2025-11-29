// units.js - Unit class and unit generation
import { gameState, RARITIES, UNIT_TYPES, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_CELL_SIZE } from './globals.js';

export class Unit {
  constructor(type, rarity, gridX, gridY, p) {
    this.type = type;
    this.rarity = rarity;
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = GRID_OFFSET_X + gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    this.y = GRID_OFFSET_Y + gridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
    
    const stats = this.getBaseStats();
    this.maxHealth = stats.health;
    this.health = stats.health;
    this.attackDamage = stats.damage;
    this.attackRange = stats.range;
    this.attackSpeed = stats.speed;
    this.attackTimer = 0;
    this.target = null;
    
    this.isTemporary = false;
    this.lifetimeTimer = 0;
    
    this.p = p;
  }
  
  getBaseStats() {
    const rarityIndex = RARITIES.indexOf(this.rarity);
    const multiplier = 1 + rarityIndex * 0.5;
    
    let baseStats = {};
    if (this.type === 'Archer') {
      baseStats = { health: 50, damage: 10, range: 120, speed: 30 };
    } else if (this.type === 'Mage') {
      baseStats = { health: 40, damage: 15, range: 100, speed: 45 };
    } else if (this.type === 'Cannon') {
      baseStats = { health: 60, damage: 25, range: 150, speed: 60 };
    }
    
    return {
      health: Math.floor(baseStats.health * multiplier),
      damage: Math.floor(baseStats.damage * multiplier),
      range: baseStats.range + rarityIndex * 10,
      speed: baseStats.speed
    };
  }
  
  update() {
    if (this.isTemporary) {
      this.lifetimeTimer--;
      if (this.lifetimeTimer <= 0) {
        return false; // Mark for removal
      }
    }
    
    this.attackTimer--;
    
    if (this.attackTimer <= 0) {
      this.findTarget();
      if (this.target && !this.target.isDead) {
        this.attack();
        this.attackTimer = this.attackSpeed;
      }
    }
    
    return true;
  }
  
  findTarget() {
    let closestEnemy = null;
    let closestDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      
      const dist = this.p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist <= this.attackRange && dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }
    
    this.target = closestEnemy;
  }
  
  attack() {
    if (!this.target) return;
    
    const projectile = {
      x: this.x,
      y: this.y,
      targetX: this.target.x,
      targetY: this.target.y,
      target: this.target,
      damage: Math.floor(this.attackDamage * gameState.globalAttackBuff),
      speed: 5,
      type: this.type,
      isDead: false
    };
    
    gameState.projectiles.push(projectile);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // Dead
    }
    return false;
  }
  
  draw(p) {
    p.push();
    
    // Draw unit
    const rarityColors = {
      'Common': [200, 200, 200],
      'Uncommon': [100, 255, 100],
      'Rare': [100, 150, 255],
      'Epic': [200, 100, 255],
      'Legendary': [255, 215, 0]
    };
    
    // Aura
    p.noFill();
    p.stroke(...rarityColors[this.rarity]);
    p.strokeWeight(2);
    p.circle(this.x, this.y, 28);
    
    // Unit body
    p.strokeWeight(1);
    p.stroke(0);
    
    if (this.type === 'Archer') {
      p.fill(100, 200, 100);
      p.circle(this.x, this.y, 20);
      // Bow
      p.stroke(139, 69, 19);
      p.strokeWeight(2);
      p.line(this.x - 5, this.y - 8, this.x - 5, this.y + 8);
    } else if (this.type === 'Mage') {
      p.fill(150, 100, 200);
      p.triangle(this.x, this.y - 12, this.x - 10, this.y + 8, this.x + 10, this.y + 8);
      // Staff
      p.stroke(139, 69, 19);
      p.strokeWeight(2);
      p.line(this.x, this.y, this.x, this.y + 15);
      p.fill(255, 255, 0);
      p.noStroke();
      p.circle(this.x, this.y - 8, 4);
    } else if (this.type === 'Cannon') {
      p.fill(120, 120, 120);
      p.rect(this.x - 10, this.y - 10, 20, 20);
      // Barrel
      p.fill(80, 80, 80);
      p.rect(this.x - 3, this.y - 15, 6, 8);
    }
    
    // Health bar
    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(255, 0, 0);
    p.rect(this.x - barWidth / 2, this.y - 20, barWidth, barHeight);
    p.fill(0, 255, 0);
    p.rect(this.x - barWidth / 2, this.y - 20, barWidth * healthPercent, barHeight);
    
    // Lifetime indicator for temporary units
    if (this.isTemporary) {
      p.fill(255, 255, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.text(Math.ceil(this.lifetimeTimer / 60), this.x, this.y + 25);
    }
    
    p.pop();
  }
}

export function generateRandomUnit(p) {
  // Rarity probabilities
  const rarityRoll = p.random(100);
  let rarity;
  if (rarityRoll < 50) {
    rarity = 'Common';
  } else if (rarityRoll < 75) {
    rarity = 'Uncommon';
  } else if (rarityRoll < 90) {
    rarity = 'Rare';
  } else if (rarityRoll < 98) {
    rarity = 'Epic';
  } else {
    rarity = 'Legendary';
  }
  
  // Random type
  const type = p.random(UNIT_TYPES);
  
  return { type, rarity };
}

export function canMergeUnits(unit1, unit2) {
  if (!unit1 || !unit2) return false;
  if (unit1.type !== unit2.type) return false;
  if (unit1.rarity !== unit2.rarity) return false;
  if (unit1.rarity === 'Legendary') return false; // Can't merge legendary
  
  // Check adjacency
  const dx = Math.abs(unit1.gridX - unit2.gridX);
  const dy = Math.abs(unit1.gridY - unit2.gridY);
  
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function mergeUnits(unit1, unit2, p) {
  if (!canMergeUnits(unit1, unit2)) return null;
  
  const currentRarityIndex = RARITIES.indexOf(unit1.rarity);
  const newRarity = RARITIES[currentRarityIndex + 1];
  const newType = p.random(UNIT_TYPES);
  
  const newUnit = new Unit(newType, newRarity, unit1.gridX, unit1.gridY, p);
  
  return newUnit;
}