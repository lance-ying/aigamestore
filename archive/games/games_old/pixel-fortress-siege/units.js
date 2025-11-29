// units.js - Unit class and unit definitions

import {
  UNIT_WARRIOR,
  UNIT_ARCHER,
  UNIT_SORCERER,
  UNIT_GOBLIN,
  UNIT_BARBARIAN,
  UNIT_GIANT,
  GRID_SIZE
} from './globals.js';

export const UNIT_STATS = {
  [UNIT_WARRIOR]: {
    hp: 150,
    damage: 25,
    attackSpeed: 1.0,
    moveSpeed: 1.5,
    range: 1.2,
    color: [50, 80, 180],
    size: 14
  },
  [UNIT_ARCHER]: {
    hp: 80,
    damage: 20,
    attackSpeed: 1.5,
    moveSpeed: 1.3,
    range: 4.0,
    color: [100, 150, 230],
    size: 12
  },
  [UNIT_SORCERER]: {
    hp: 50,
    damage: 40,
    attackSpeed: 2.0,
    moveSpeed: 1.0,
    range: 3.5,
    color: [150, 50, 200],
    size: 12,
    aoe: true,
    aoeRadius: 1.5
  },
  [UNIT_GOBLIN]: {
    hp: 40,
    damage: 10,
    attackSpeed: 0.8,
    moveSpeed: 2.5,
    range: 1.0,
    color: [100, 180, 80],
    size: 10
  },
  [UNIT_BARBARIAN]: {
    hp: 100,
    damage: 20,
    attackSpeed: 1.0,
    moveSpeed: 1.5,
    range: 1.2,
    color: [200, 60, 60],
    size: 14
  },
  [UNIT_GIANT]: {
    hp: 300,
    damage: 15,
    attackSpeed: 1.5,
    moveSpeed: 0.8,
    range: 1.5,
    color: [140, 100, 70],
    size: 20,
    prioritizeStructures: true
  }
};

export class Unit {
  constructor(type, gridX, gridY, isPlayer) {
    this.type = type;
    this.x = gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = gridY * GRID_SIZE + GRID_SIZE / 2;
    this.isPlayer = isPlayer;
    
    const stats = UNIT_STATS[type];
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.attackSpeed = stats.attackSpeed;
    this.moveSpeed = stats.moveSpeed;
    this.range = stats.range * GRID_SIZE;
    this.color = stats.color;
    this.size = stats.size;
    this.aoe = stats.aoe || false;
    this.aoeRadius = stats.aoeRadius ? stats.aoeRadius * GRID_SIZE : 0;
    this.prioritizeStructures = stats.prioritizeStructures || false;
    
    this.target = null;
    this.lastAttackTime = 0;
    this.attackCooldown = stats.attackSpeed * 1000;
    this.alive = true;
    this.deathAnimation = 0;
    this.attackAnimation = 0;
  }
  
  update(p, deltaTime, structures, units, projectiles) {
    if (!this.alive) {
      this.deathAnimation += deltaTime / 500;
      return;
    }
    
    // Decay attack animation
    if (this.attackAnimation > 0) {
      this.attackAnimation -= deltaTime / 100;
    }
    
    // Find target
    if (!this.target || !this.target.alive || this.target.hp <= 0) {
      this.findTarget(structures, units);
    }
    
    // Move towards target or attack
    if (this.target && this.target.alive && this.target.hp > 0) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > this.range) {
        // Move towards target
        const moveAmount = this.moveSpeed * deltaTime / 16.67;
        this.x += (dx / dist) * moveAmount;
        this.y += (dy / dist) * moveAmount;
      } else {
        // Attack if cooldown is ready
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackCooldown) {
          this.attack(p, projectiles);
          this.lastAttackTime = now;
          this.attackAnimation = 1.0;
        }
      }
    }
  }
  
  findTarget(structures, units) {
    this.target = null;
    let minDist = Infinity;
    
    // Check structures first if we prioritize them
    if (this.prioritizeStructures) {
      for (const structure of structures) {
        if (structure.alive && structure.hp > 0) {
          const dx = structure.x - this.x;
          const dy = structure.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            this.target = structure;
          }
        }
      }
    }
    
    // Check enemy structures
    if (!this.target) {
      for (const structure of structures) {
        if (structure.alive && structure.hp > 0) {
          const dx = structure.x - this.x;
          const dy = structure.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            this.target = structure;
          }
        }
      }
    }
    
    // Check enemy units if no structure found
    if (!this.target) {
      for (const unit of units) {
        if (unit.alive && unit.hp > 0 && unit !== this) {
          const dx = unit.x - this.x;
          const dy = unit.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            this.target = unit;
          }
        }
      }
    }
  }
  
  attack(p, projectiles) {
    if (!this.target || !this.target.alive) return;
    
    // Create projectile for ranged units
    if (this.type === UNIT_ARCHER || this.type === UNIT_SORCERER) {
      projectiles.push({
        x: this.x,
        y: this.y,
        targetX: this.target.x,
        targetY: this.target.y,
        target: this.target,
        damage: this.damage,
        speed: 5,
        alive: true,
        isPlayer: this.isPlayer,
        aoe: this.aoe,
        aoeRadius: this.aoeRadius,
        color: this.type === UNIT_SORCERER ? [200, 100, 255] : [255, 200, 50]
      });
    } else {
      // Melee attack
      this.target.takeDamage(this.damage, p);
    }
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
      const shrink = 1 - this.deathAnimation * 0.5;
      p.translate(this.x, this.y);
      p.scale(shrink);
      p.translate(-this.x, -this.y);
    }
    
    // Attack animation - slight scale pulse
    let scale = 1.0;
    if (this.attackAnimation > 0) {
      scale = 1.0 + this.attackAnimation * 0.2;
    }
    
    p.translate(this.x, this.y);
    p.scale(scale);
    p.translate(-this.x, -this.y);
    
    // Draw unit based on type
    p.fill(...this.color);
    p.noStroke();
    
    if (this.type === UNIT_WARRIOR || this.type === UNIT_BARBARIAN) {
      p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else if (this.type === UNIT_ARCHER || this.type === UNIT_GOBLIN) {
      p.circle(this.x, this.y, this.size);
    } else if (this.type === UNIT_SORCERER) {
      p.triangle(
        this.x, this.y - this.size / 2,
        this.x - this.size / 2, this.y + this.size / 2,
        this.x + this.size / 2, this.y + this.size / 2
      );
    } else if (this.type === UNIT_GIANT) {
      p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    
    p.pop();
    
    // Draw HP bar if alive
    if (this.alive) {
      this.drawHPBar(p);
    }
  }
  
  drawHPBar(p) {
    const barWidth = this.size * 1.5;
    const barHeight = 3;
    const x = this.x - barWidth / 2;
    const y = this.y - this.size / 2 - 6;
    
    const hpPercent = this.hp / this.maxHp;
    
    p.noStroke();
    p.fill(40, 40, 40);
    p.rect(x, y, barWidth, barHeight);
    
    const hpColor = hpPercent > 0.5 ? [100, 200, 100] : hpPercent > 0.25 ? [200, 200, 50] : [200, 50, 50];
    p.fill(...hpColor);
    p.rect(x, y, barWidth * hpPercent, barHeight);
  }
}