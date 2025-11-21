// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, TOWER_TYPES, UPGRADE_COSTS } from './globals.js';

export class TowerPlot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 35;
    this.occupied = false;
    this.tower = null;
  }

  draw(p) {
    p.push();
    p.strokeWeight(2);
    p.stroke(...(this.occupied ? [80, 80, 80] : [120, 120, 120]));
    p.fill(...(this.occupied ? [40, 40, 40] : [60, 60, 60, 100]));
    p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    p.pop();
  }

  contains(x, y) {
    return Math.abs(x - this.x) < this.size / 2 && Math.abs(y - this.y) < this.size / 2;
  }
}

export class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.typeData = TOWER_TYPES[type];
    this.level = 1;
    this.damage = this.typeData.damage;
    this.range = this.typeData.range;
    this.fireRate = this.typeData.fireRate;
    this.fireTimer = 0;
    this.target = null;
    this.angle = 0;
  }

  update(p) {
    this.fireTimer++;

    // Find target
    if (!this.target || this.target.health <= 0 || this.getDistance(this.target) > this.range) {
      this.target = this.findTarget();
    }

    // Aim at target
    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    }

    // Fire at target
    if (this.target && this.fireTimer >= this.fireRate) {
      this.fire(p);
      this.fireTimer = 0;
    }
  }

  findTarget() {
    let closest = null;
    let maxProgress = -1;

    for (let enemy of gameState.enemies) {
      if (enemy.health > 0) {
        const dist = this.getDistance(enemy);
        if (dist <= this.range && enemy.pathProgress > maxProgress) {
          closest = enemy;
          maxProgress = enemy.pathProgress;
        }
      }
    }

    return closest;
  }

  fire(p) {
    if (!this.target) return;

    const proj = new Projectile(
      this.x,
      this.y,
      this.target,
      this.damage,
      this.typeData.splash || 0,
      this.typeData.color
    );
    gameState.projectiles.push(proj);
  }

  draw(p) {
    // Range indicator when selected
    if (gameState.selectedTower === this) {
      p.push();
      p.noFill();
      p.stroke(100, 200, 255, 80);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.range * 2);
      p.pop();
    }

    // Tower base
    p.push();
    p.fill(...this.typeData.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x - 15, this.y - 15, 30, 30);

    // Tower turret
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.fill(this.typeData.color[0] - 30, this.typeData.color[1] - 30, this.typeData.color[2] - 30);
    p.rect(0, -5, 15, 10);
    p.pop();

    // Level indicator
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.level, this.x, this.y + 22);

    p.pop();
  }

  getDistance(entity) {
    return Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
  }

  upgrade() {
    if (this.level >= 3) return false;
    const cost = UPGRADE_COSTS[this.level];
    if (gameState.gold >= cost) {
      gameState.gold -= cost;
      this.level++;
      this.damage = Math.floor(this.typeData.damage * (1 + this.level * 0.4));
      this.range = Math.floor(this.typeData.range * (1 + this.level * 0.15));
      this.fireRate = Math.floor(this.typeData.fireRate * (1 - this.level * 0.1));
      return true;
    }
    return false;
  }

  getUpgradeCost() {
    return this.level >= 3 ? null : UPGRADE_COSTS[this.level];
  }
}

export class Enemy {
  constructor(wave, type = 0) {
    this.wave = wave;
    this.type = type;
    this.pathIndex = 0;
    this.pathProgress = 0;
    
    const path = gameState.path;
    this.x = path[0].x;
    this.y = path[0].y;
    
    // Enemy stats scale with wave
    this.maxHealth = 40 + wave * 15 + type * 20;
    this.health = this.maxHealth;
    this.speed = 0.8 + type * 0.2 + Math.min(wave * 0.05, 0.4);
    this.goldReward = 10 + wave * 2 + type * 5;
    this.damage = 1;
    this.size = 12 + type * 3;
    
    // Visual properties based on type
    this.colors = [
      [255, 100, 100],   // Type 0: Red (basic)
      [100, 255, 100],   // Type 1: Green (fast)
      [100, 100, 255]    // Type 2: Blue (tank)
    ];
    this.color = this.colors[type] || this.colors[0];
  }

  update(p) {
    const path = gameState.path;
    
    if (this.pathIndex >= path.length - 1) {
      this.reachEnd();
      return;
    }

    const target = path[this.pathIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.pathIndex++;
      this.pathProgress = this.pathIndex;
      if (this.pathIndex >= path.length - 1) {
        this.reachEnd();
        return;
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this.pathProgress = this.pathIndex + (1 - dist / 100);
    }
  }

  reachEnd() {
    gameState.health -= this.damage;
    this.health = 0;
    
    if (gameState.health <= 0) {
      gameState.health = 0;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      gameState.gold += this.goldReward;
      gameState.score += this.goldReward;
      
      // Create death particles
      for (let i = 0; i < 8; i++) {
        gameState.particles.push(new Particle(this.x, this.y, this.color));
      }
    }
  }

  draw(p) {
    if (this.health <= 0) return;

    p.push();
    
    // Enemy body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.size * 2);

    // Health bar
    const barWidth = 24;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(0, 150);
    p.rect(this.x - barWidth / 2, this.y - this.size - 8, barWidth, barHeight);
    
    p.fill(255, 50, 50);
    if (healthPercent > 0.5) p.fill(255, 255, 50);
    if (healthPercent > 0.8) p.fill(50, 255, 50);
    p.rect(this.x - barWidth / 2, this.y - this.size - 8, barWidth * healthPercent, barHeight);

    p.pop();
  }
}

export class Projectile {
  constructor(x, y, target, damage, splash, color) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.splash = splash;
    this.color = color;
    this.speed = 8;
    this.size = 6;
    this.active = true;
  }

  update(p) {
    if (!this.target || this.target.health <= 0) {
      this.active = false;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.hit(p);
      this.active = false;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  hit(p) {
    if (!this.target) return;

    if (this.splash > 0) {
      // Area damage
      for (let enemy of gameState.enemies) {
        if (enemy.health > 0) {
          const dist = Math.sqrt((enemy.x - this.target.x) ** 2 + (enemy.y - this.target.y) ** 2);
          if (dist <= this.splash) {
            enemy.takeDamage(this.damage);
          }
        }
      }
      
      // Splash visual effect
      for (let i = 0; i < 12; i++) {
        gameState.particles.push(new Particle(this.target.x, this.target.y, this.color));
      }
    } else {
      this.target.takeDamage(this.damage);
    }
  }

  draw(p) {
    if (!this.active) return;

    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export class Hero {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.speed = 2;
    this.size = 16;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 20;
    this.attackRange = 40;
    this.attackTimer = 0;
    this.attackRate = 25;
    this.target = null;
    this.color = [255, 200, 50];
  }

  update(p) {
    // Move toward target position
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.speed) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Attack nearby enemies
    this.attackTimer++;
    
    if (!this.target || this.target.health <= 0 || this.getDistance(this.target) > this.attackRange) {
      this.target = this.findTarget();
    }

    if (this.target && this.attackTimer >= this.attackRate) {
      this.attack();
      this.attackTimer = 0;
    }
  }

  findTarget() {
    let closest = null;
    let minDist = Infinity;

    for (let enemy of gameState.enemies) {
      if (enemy.health > 0) {
        const dist = this.getDistance(enemy);
        if (dist <= this.attackRange && dist < minDist) {
          closest = enemy;
          minDist = dist;
        }
      }
    }

    return closest;
  }

  attack() {
    if (this.target && this.target.health > 0) {
      this.target.takeDamage(this.damage);
    }
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  useAbility() {
    if (gameState.heroAbilityCooldown > 0) return;

    // Area damage ability
    for (let enemy of gameState.enemies) {
      if (enemy.health > 0) {
        const dist = this.getDistance(enemy);
        if (dist <= 120) {
          enemy.takeDamage(60);
        }
      }
    }

    // Visual effect
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const px = this.x + Math.cos(angle) * 100;
      const py = this.y + Math.sin(angle) * 100;
      gameState.particles.push(new Particle(px, py, [255, 255, 100]));
    }

    gameState.heroAbilityCooldown = gameState.heroAbilityMaxCooldown;
  }

  draw(p) {
    // Attack range when ability ready
    if (gameState.heroAbilityCooldown === 0) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 100, 100);
      p.strokeWeight(2);
      p.circle(this.x, this.y, 240);
      p.pop();
    }

    // Hero body
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.size * 2);

    // Crown
    p.fill(255, 215, 0);
    p.triangle(
      this.x - 8, this.y - 8,
      this.x, this.y - 16,
      this.x + 8, this.y - 8
    );

    p.pop();

    // Health bar
    const barWidth = 28;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(0, 150);
    p.rect(this.x - barWidth / 2, this.y + this.size + 4, barWidth, barHeight);
    
    p.fill(50, 255, 50);
    p.rect(this.x - barWidth / 2, this.y + this.size + 4, barWidth * healthPercent, barHeight);
  }

  getDistance(entity) {
    return Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 1;
    this.life = 30;
    this.maxLife = 30;
    this.color = color;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life--;
  }

  draw(p) {
    if (this.life <= 0) return;
    
    const alpha = (this.life / this.maxLife) * 255;
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}