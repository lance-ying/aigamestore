// tower.js - Tower entity and management

import { gameState, TOWER_TYPES } from './globals.js';
import { Projectile } from './projectile.js';

export class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = 1;
    this.config = { ...TOWER_TYPES[type] };
    this.target = null;
    this.cooldown = 0;
    this.rotation = 0;
    this.kills = 0;
  }
  
  update(p) {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
    
    this.findTarget();
    
    if (this.target && this.cooldown === 0) {
      this.shoot(p);
      this.cooldown = this.config.fireRate;
    }
    
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      this.rotation = Math.atan2(dy, dx);
    }
  }
  
  findTarget() {
    this.target = null;
    let closestDist = Infinity;
    
    for (let enemy of gameState.enemies) {
      if (!enemy.alive) continue;
      
      const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
      
      if (dist <= this.config.range && dist < closestDist) {
        closestDist = dist;
        this.target = enemy;
      }
    }
  }
  
  shoot(p) {
    if (!this.target) return;
    
    const projectile = new Projectile(
      this.x,
      this.y,
      this.target,
      this.config.damage * this.level,
      this.config.color,
      this.type
    );
    gameState.projectiles.push(projectile);
  }
  
  upgrade() {
    if (this.level >= 3) return false;
    
    const upgradeCost = this.getUpgradeCost();
    if (gameState.gold >= upgradeCost) {
      gameState.gold -= upgradeCost;
      this.level++;
      
      // Increase stats
      this.config.damage = Math.floor(this.config.damage * 1.5);
      this.config.range = Math.floor(this.config.range * 1.1);
      this.config.fireRate = Math.max(10, Math.floor(this.config.fireRate * 0.9));
      
      return true;
    }
    return false;
  }
  
  getUpgradeCost() {
    return Math.floor(this.config.cost * 0.7 * this.level);
  }
  
  getSellValue() {
    let total = this.config.cost;
    for (let i = 1; i < this.level; i++) {
      total += Math.floor(this.config.cost * 0.7 * i);
    }
    return Math.floor(total * 0.6);
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw range indicator if selected
    if (gameState.selectedTower === this) {
      p.noFill();
      p.stroke(255, 255, 255, 80);
      p.strokeWeight(1);
      p.circle(0, 0, this.config.range * 2);
    }
    
    // Draw tower base
    const baseSize = 25 + this.level * 3;
    p.fill(...(gameState.selectedTower === this ? [255, 255, 200] : [100, 100, 100]));
    p.noStroke();
    p.rect(-baseSize / 2, -baseSize / 2, baseSize, baseSize, 3);
    
    // Draw tower body
    p.fill(...this.config.color);
    p.stroke(50);
    p.strokeWeight(1);
    
    if (this.type === 'ARCHER') {
      p.rotate(this.rotation);
      p.triangle(-8, -8, -8, 8, 12, 0);
    } else if (this.type === 'MAGE') {
      p.circle(0, 0, 15 + this.level * 2);
      p.fill(255, 255, 255);
      p.circle(0, 0, 8);
    } else if (this.type === 'BARRACKS') {
      p.rect(-10, -10, 20, 20);
      p.fill(255);
      p.rect(-6, -6, 12, 12);
    } else if (this.type === 'ARTILLERY') {
      p.rotate(this.rotation);
      p.rect(-8, -6, 20, 12, 2);
      p.fill(80);
      p.rect(12, -4, 8, 8);
    }
    
    p.pop();
    
    // Draw level indicator
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.level, this.x, this.y + 22);
  }
}

export function placeTower(slot, towerType) {
  const typeConfig = TOWER_TYPES[towerType];
  
  if (gameState.gold >= typeConfig.cost && !slot.tower) {
    gameState.gold -= typeConfig.cost;
    const tower = new Tower(slot.x, slot.y, towerType);
    slot.tower = tower;
    gameState.towers.push(tower);
    return true;
  }
  return false;
}

export function sellTower(tower) {
  const value = tower.getSellValue();
  gameState.gold += value;
  
  // Remove from slot
  for (let slot of gameState.towerSlots) {
    if (slot.tower === tower) {
      slot.tower = null;
      break;
    }
  }
  
  // Remove from towers array
  const index = gameState.towers.indexOf(tower);
  if (index > -1) {
    gameState.towers.splice(index, 1);
  }
}