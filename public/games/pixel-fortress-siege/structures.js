// structures.js - Structure class and definitions

import {
  STRUCTURE_TOWN_HALL,
  STRUCTURE_WALL,
  STRUCTURE_BARRACKS,
  STRUCTURE_FORTRESS,
  STRUCTURE_CANNON,
  STRUCTURE_ARCHER_TOWER,
  GRID_SIZE
} from './globals.js';

export const STRUCTURE_STATS = {
  [STRUCTURE_TOWN_HALL]: {
    color: [180, 180, 180],
    width: 3,
    height: 3,
    canAttack: false
  },
  [STRUCTURE_WALL]: {
    color: [100, 100, 100],
    width: 1,
    height: 1,
    canAttack: false
  },
  [STRUCTURE_BARRACKS]: {
    color: [80, 80, 80],
    width: 3,
    height: 3,
    canAttack: false
  },
  [STRUCTURE_FORTRESS]: {
    color: [40, 40, 40],
    width: 3,
    height: 3,
    canAttack: false
  },
  [STRUCTURE_CANNON]: {
    color: [90, 90, 90],
    width: 2,
    height: 2,
    canAttack: true,
    damage: 30,
    range: 5.0,
    attackSpeed: 2.0
  },
  [STRUCTURE_ARCHER_TOWER]: {
    color: [120, 100, 80],
    width: 1.5,
    height: 2.5,
    canAttack: true,
    damage: 25,
    range: 6.0,
    attackSpeed: 1.5
  }
};

export class Structure {
  constructor(type, gridX, gridY, hp, isPlayer) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.isPlayer = isPlayer;
    
    const stats = STRUCTURE_STATS[type];
    this.maxHp = hp;
    this.hp = hp;
    this.color = stats.color;
    this.width = stats.width * GRID_SIZE;
    this.height = stats.height * GRID_SIZE;
    this.x = gridX * GRID_SIZE + this.width / 2;
    this.y = gridY * GRID_SIZE + this.height / 2;
    
    this.canAttack = stats.canAttack || false;
    this.damage = stats.damage || 0;
    this.range = stats.range ? stats.range * GRID_SIZE : 0;
    this.attackSpeed = stats.attackSpeed || 0;
    this.lastAttackTime = 0;
    this.attackCooldown = stats.attackSpeed ? stats.attackSpeed * 1000 : 0;
    
    this.alive = true;
    this.deathAnimation = 0;
    this.target = null;
  }
  
  update(p, deltaTime, units, projectiles) {
    if (!this.alive) {
      this.deathAnimation += deltaTime / 500;
      return;
    }
    
    if (!this.canAttack) return;
    
    // Find target among enemy units
    if (!this.target || !this.target.alive || this.target.hp <= 0) {
      this.findTarget(units);
    }
    
    // Attack if target in range
    if (this.target && this.target.alive && this.target.hp > 0) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= this.range) {
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackCooldown) {
          this.attack(projectiles);
          this.lastAttackTime = now;
        }
      }
    }
  }
  
  findTarget(units) {
    this.target = null;
    let minDist = Infinity;
    
    for (const unit of units) {
      if (unit.alive && unit.hp > 0 && unit.isPlayer !== this.isPlayer) {
        const dx = unit.x - this.x;
        const dy = unit.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.range && dist < minDist) {
          minDist = dist;
          this.target = unit;
        }
      }
    }
  }
  
  attack(projectiles) {
    if (!this.target || !this.target.alive) return;
    
    projectiles.push({
      x: this.x,
      y: this.y,
      targetX: this.target.x,
      targetY: this.target.y,
      target: this.target,
      damage: this.damage,
      speed: 4,
      alive: true,
      isPlayer: this.isPlayer,
      aoe: false,
      color: [200, 80, 50]
    });
  }
  
  takeDamage(amount, p) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.deathAnimation = 0;
    }
  }
  
  draw(p) {
    if (!this.alive && this.deathAnimation >= 1) return;
    
    p.push();
    
    if (!this.alive) {
      const fadeAlpha = 255 * (1 - this.deathAnimation);
      p.tint(255, fadeAlpha);
    }
    
    p.fill(...this.color);
    p.noStroke();
    
    const x = this.gridX * GRID_SIZE;
    const y = this.gridY * GRID_SIZE;
    
    p.rect(x, y, this.width, this.height);
    
    // Special decoration for specific structures
    if (this.type === STRUCTURE_CANNON && this.alive) {
      p.fill(60, 60, 60);
      p.circle(this.x, this.y, GRID_SIZE * 0.6);
    } else if (this.type === STRUCTURE_ARCHER_TOWER && this.alive) {
      p.fill(150, 120, 90);
      p.rect(this.x - 3, this.gridY * GRID_SIZE, 6, GRID_SIZE * 0.8);
    }
    
    p.pop();
    
    // Draw HP bar if alive
    if (this.alive) {
      this.drawHPBar(p);
    }
  }
  
  drawHPBar(p) {
    const barWidth = this.width * 0.8;
    const barHeight = 4;
    const x = this.x - barWidth / 2;
    const y = this.gridY * GRID_SIZE - 8;
    
    const hpPercent = this.hp / this.maxHp;
    
    p.noStroke();
    p.fill(40, 40, 40);
    p.rect(x, y, barWidth, barHeight);
    
    const hpColor = hpPercent > 0.5 ? [100, 200, 100] : hpPercent > 0.25 ? [200, 200, 50] : [200, 50, 50];
    p.fill(...hpColor);
    p.rect(x, y, barWidth * hpPercent, barHeight);
  }
}