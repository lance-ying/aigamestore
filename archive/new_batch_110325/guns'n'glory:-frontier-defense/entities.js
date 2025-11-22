// entities.js - Game entity classes

import { gameState, UNIT_DEFINITIONS, ENEMY_DEFINITIONS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Unit {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    
    const def = UNIT_DEFINITIONS[type];
    this.damage = def.damage;
    this.range = def.range;
    this.attackSpeed = def.attackSpeed;
    this.color = def.color;
    this.name = def.name;
    
    this.attackTimer = 0;
    this.target = null;
    this.damageUpgrades = 0;
    this.rangeUpgrades = 0;
    this.moving = false;
    this.moveSpeed = 2;
  }
  
  getCurrentDamage() {
    return Math.floor(this.damage * Math.pow(1.15, this.damageUpgrades));
  }
  
  getCurrentRange() {
    return this.range + (this.rangeUpgrades * 10);
  }
  
  update() {
    // Move towards target position
    if (this.moving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.moveSpeed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.moving = false;
      } else {
        this.x += (dx / dist) * this.moveSpeed;
        this.y += (dy / dist) * this.moveSpeed;
      }
    }
    
    // Attack logic
    this.attackTimer--;
    
    // Find target in range
    if (!this.target || this.target.dead || !this.isInRange(this.target)) {
      this.target = this.findNearestEnemy();
    }
    
    // Attack if ready
    if (this.target && this.attackTimer <= 0 && this.isInRange(this.target)) {
      this.attack(this.target);
      this.attackTimer = this.attackSpeed;
    }
  }
  
  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    const currentRange = this.getCurrentRange();
    
    for (const enemy of gameState.enemies) {
      if (enemy.dead) continue;
      
      const dist = this.distanceTo(enemy);
      if (dist <= currentRange && dist < minDist) {
        nearest = enemy;
        minDist = dist;
      }
    }
    
    return nearest;
  }
  
  isInRange(enemy) {
    return this.distanceTo(enemy) <= this.getCurrentRange();
  }
  
  distanceTo(enemy) {
    const dx = this.x - enemy.x;
    const dy = this.y - enemy.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  attack(enemy) {
    enemy.takeDamage(this.getCurrentDamage());
  }
  
  moveTo(x, y) {
    this.targetX = Math.max(0, Math.min(CANVAS_WIDTH, x));
    this.targetY = Math.max(0, Math.min(CANVAS_HEIGHT, y));
    this.moving = true;
  }
  
  render(p) {
    p.push();
    
    // Draw range circle if selected
    if (gameState.selectedUnit === this) {
      p.noFill();
      p.stroke(255, 255, 100, 100);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.getCurrentRange() * 2);
    }
    
    // Draw unit
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, 16);
    
    // Draw eye direction towards target
    if (this.target && !this.target.dead) {
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      p.fill(255);
      p.circle(
        this.x + Math.cos(angle) * 4,
        this.y + Math.sin(angle) * 4,
        4
      );
    }
    
    // Draw selection indicator
    if (gameState.selectedUnit === this) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(2);
      p.circle(this.x, this.y, 24);
    }
    
    // Draw attack line
    if (this.target && !this.target.dead && this.attackTimer > this.attackSpeed - 5) {
      p.stroke(255, 200, 100, 150);
      p.strokeWeight(2);
      p.line(this.x, this.y, this.target.x, this.target.y);
    }
    
    p.pop();
  }
}

export class Enemy {
  constructor(type, pathPoints) {
    this.type = type;
    const def = ENEMY_DEFINITIONS[type];
    
    this.maxHealth = def.health;
    this.health = this.maxHealth;
    this.speed = def.speed;
    this.goldReward = def.goldReward;
    this.color = def.color;
    this.size = def.size;
    this.dropsPowerUp = def.dropsPowerUp || false;
    
    this.pathPoints = pathPoints;
    this.pathIndex = 0;
    this.x = pathPoints[0].x;
    this.y = pathPoints[0].y;
    this.dead = false;
    this.escaped = false;
  }
  
  update() {
    if (this.dead || this.escaped) return;
    
    // Move along path
    if (this.pathIndex < this.pathPoints.length - 1) {
      const target = this.pathPoints[this.pathIndex + 1];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.speed) {
        this.pathIndex++;
        if (this.pathIndex >= this.pathPoints.length - 1) {
          this.escape();
        }
      } else {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    } else {
      this.escape();
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.dead = true;
    gameState.gold += this.goldReward;
    gameState.score += this.goldReward;
    
    // Drop power-up chance
    if (this.dropsPowerUp && Math.random() < 0.5) {
      gameState.powerUps.push({
        x: this.x,
        y: this.y,
        type: "ATTACK_BOOST",
        duration: 300,
        collected: false
      });
    }
  }
  
  escape() {
    this.escaped = true;
    gameState.escapedEnemies++;
  }
  
  render(p) {
    if (this.dead || this.escaped) return;
    
    p.push();
    
    // Draw enemy body
    p.fill(...this.color);
    p.noStroke();
    
    if (this.type === 'STAGECOACH') {
      // Draw as rectangle for stagecoach
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.size * 1.5, this.size);
    } else {
      // Draw as circle for others
      p.circle(this.x, this.y, this.size);
    }
    
    // Draw health bar
    const barWidth = this.size * 2;
    const barHeight = 3;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(40, 40, 40);
    p.rect(this.x - barWidth / 2, this.y - this.size - 5, barWidth, barHeight);
    
    p.fill(healthPercent > 0.5 ? 100 : healthPercent > 0.25 ? 200 : 255, healthPercent > 0.5 ? 200 : healthPercent > 0.25 ? 200 : 100, 100);
    p.rect(this.x - barWidth / 2, this.y - this.size - 5, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
}

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.collected = false;
    this.lifetime = 600; // 10 seconds
  }
  
  update() {
    this.lifetime--;
    
    // Check if any unit collects it
    for (const unit of gameState.units) {
      const dist = Math.sqrt((this.x - unit.x) ** 2 + (this.y - unit.y) ** 2);
      if (dist < 20) {
        this.collect(unit);
        break;
      }
    }
  }
  
  collect(unit) {
    this.collected = true;
    // Apply boost effect (temporary damage increase)
    unit.damage = Math.floor(unit.damage * 1.5);
    setTimeout(() => {
      unit.damage = Math.floor(unit.damage / 1.5);
    }, 5000);
  }
  
  render(p) {
    if (this.collected || this.lifetime <= 0) return;
    
    p.push();
    p.fill(255, 215, 0, 200);
    p.noStroke();
    p.star(this.x, this.y, 5, 10, 5);
    p.pop();
  }
}

// Helper function to draw star
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = -Math.PI / 2;
    let angleStep = Math.PI / npoints;
    
    this.beginShape();
    for (let i = 0; i < npoints * 2; i++) {
      let r = i % 2 === 0 ? radius1 : radius2;
      let sx = x + Math.cos(angle) * r;
      let sy = y + Math.sin(angle) * r;
      this.vertex(sx, sy);
      angle += angleStep;
    }
    this.endShape(this.CLOSE);
  };
}