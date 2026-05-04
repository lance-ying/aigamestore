import { gameState, TOWER_TYPES, UPGRADE_COSTS } from './globals.js';
import { Projectile } from './projectile.js';

export class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.tier = 1;
    this.specialization = null; // "spec1" or "spec2" at tier 3
    this.config = TOWER_TYPES[type];
    this.range = this.config.range;
    this.damage = this.config.damage;
    this.attackSpeed = this.config.attackSpeed;
    this.attackCooldown = 0;
    this.target = null;
    this.kills = 0;
    this.selected = false;
    this.totalCost = this.config.cost;
  }
  
  update(p) {
    this.attackCooldown--;
    
    // Find target
    if (!this.target || !this.target.alive || !this.isInRange(this.target)) {
      this.target = this.findTarget();
    }
    
    // Attack target
    if (this.target && this.attackCooldown <= 0) {
      this.attack(p);
      this.attackCooldown = this.attackSpeed;
    }
  }
  
  findTarget() {
    let bestTarget = null;
    let bestProgress = -1;
    
    for (let enemy of gameState.enemies) {
      if (!enemy.alive) continue;
      
      // Barracks can only target ground units
      if (this.type === 3 && enemy.flying) continue;
      
      if (this.isInRange(enemy) && enemy.pathProgress > bestProgress) {
        bestTarget = enemy;
        bestProgress = enemy.pathProgress;
      }
    }
    
    return bestTarget;
  }
  
  isInRange(enemy) {
    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.range;
  }
  
  attack(p) {
    if (!this.target) return;
    
    if (this.type === 1) { // Archer - projectile
      const proj = new Projectile(this.x, this.y, this.target, this.damage, this.tier);
      gameState.projectiles.push(proj);
    } else if (this.type === 2) { // Mage - area damage
      this.target.takeDamage(this.damage);
      
      // Area damage at higher tiers
      if (this.tier >= 2) {
        const areaRange = 50;
        for (let enemy of gameState.enemies) {
          if (!enemy.alive || enemy === this.target) continue;
          const dx = enemy.x - this.target.x;
          const dy = enemy.y - this.target.y;
          if (Math.sqrt(dx * dx + dy * dy) <= areaRange) {
            enemy.takeDamage(this.damage * 0.5);
          }
        }
      }
      
      // Slow effect at tier 3+
      if (this.tier >= 3) {
        this.target.applySlow(60);
      }
    } else if (this.type === 3) { // Barracks - melee
      this.target.takeDamage(this.damage);
    } else if (this.type === 4) { // Druid - poison
      this.target.takeDamage(this.damage);
      // Add poison effect
      if (this.tier >= 2) {
        this.target.poisoned = true;
        this.target.poisonDuration = 120;
        this.target.poisonDamage = 2;
      }
    }
  }
  
  canUpgrade() {
    if (this.tier >= 3) return false;
    const cost = UPGRADE_COSTS[this.tier + 1];
    return gameState.gold >= cost;
  }
  
  upgrade() {
    if (!this.canUpgrade()) return false;
    
    const cost = UPGRADE_COSTS[this.tier + 1];
    gameState.gold -= cost;
    this.totalCost += cost;
    this.tier++;
    
    // Increase stats
    this.damage = Math.floor(this.damage * 1.5);
    this.range = Math.floor(this.range * 1.1);
    this.attackSpeed = Math.floor(this.attackSpeed * 0.9);
    
    return true;
  }
  
  draw(p) {
    p.push();
    
    // Draw range indicator if selected
    if (this.selected) {
      p.fill(255, 255, 255, 30);
      p.noStroke();
      p.circle(this.x, this.y, this.range * 2);
    }
    
    // Draw tower base
    p.fill(60, 50, 40);
    p.noStroke();
    p.rect(this.x - 15, this.y - 15, 30, 30);
    
    // Draw tower body
    const size = 20 + this.tier * 3;
    p.fill(...this.config.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.type === 1) { // Archer - triangle
      p.triangle(
        this.x, this.y - size / 2,
        this.x - size / 2, this.y + size / 2,
        this.x + size / 2, this.y + size / 2
      );
    } else if (this.type === 2) { // Mage - star
      this.drawStar(p, this.x, this.y, size / 3, size / 1.5, 5);
    } else if (this.type === 3) { // Barracks - square
      p.rect(this.x - size / 2, this.y - size / 2, size, size);
    } else if (this.type === 4) { // Druid - hexagon
      this.drawHexagon(p, this.x, this.y, size / 2);
    }
    
    // Draw tier indicator
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.tier, this.x, this.y + size / 2 + 12);
    
    // Draw targeting line
    if (this.target && this.target.alive) {
      p.stroke(255, 255, 0, 100);
      p.strokeWeight(1);
      p.line(this.x, this.y, this.target.x, this.target.y);
    }
    
    p.pop();
  }
  
  drawStar(p, x, y, radius1, radius2, npoints) {
    const angle = p.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
      let sx = x + p.cos(a) * radius2;
      let sy = y + p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius1;
      sy = y + p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }
  
  drawHexagon(p, x, y, radius) {
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = p.TWO_PI / 6 * i;
      const sx = x + p.cos(angle) * radius;
      const sy = y + p.sin(angle) * radius;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }
}

export function canPlaceTower(x, y) {
  // Check if too close to path
  for (let point of gameState.path) {
    const dx = x - point.x;
    const dy = y - point.y;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      return false;
    }
  }
  
  // Check if too close to other towers
  for (let tower of gameState.towers) {
    const dx = x - tower.x;
    const dy = y - tower.y;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      return false;
    }
  }
  
  return true;
}

export function placeTower(x, y, type) {
  const config = TOWER_TYPES[type];
  if (gameState.gold >= config.cost && canPlaceTower(x, y)) {
    gameState.gold -= config.cost;
    const tower = new Tower(x, y, type);
    gameState.towers.push(tower);
    gameState.entities.push(tower);
    return tower;
  }
  return null;
}