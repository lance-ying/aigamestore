// entities.js - Game entities

import { GRID_SIZE, ENEMY_DEFINITIONS, gameState } from './globals.js';
import { getPathWorldPos } from './pathGenerator.js';

export class Enemy {
  constructor(type, path, p) {
    this.type = type;
    this.path = path;
    const def = ENEMY_DEFINITIONS[type];
    this.maxHp = def.hp;
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.goldReward = def.goldReward;
    this.xpReward = def.xpReward;
    this.color = [...def.color];
    
    this.pathIndex = 0;
    const startPos = getPathWorldPos(0, path);
    this.x = startPos.x;
    this.y = startPos.y;
    this.alive = true;
    this.escaped = false;
    this.slowFactor = 1;
    this.slowTimer = 0;
    this.p = p;
  }
  
  update() {
    if (!this.alive || this.escaped) return;
    
    // Update slow effect
    if (this.slowTimer > 0) {
      this.slowTimer--;
      this.slowFactor = 0.5;
    } else {
      this.slowFactor = 1;
    }
    
    // Move along path
    const targetPos = getPathWorldPos(this.pathIndex + 1, this.path);
    if (!targetPos) {
      // Reached end of path
      this.escaped = true;
      gameState.enemiesEscaped++;
      return;
    }
    
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed * this.slowFactor) {
      this.pathIndex++;
      const newPos = getPathWorldPos(this.pathIndex, this.path);
      if (newPos) {
        this.x = newPos.x;
        this.y = newPos.y;
      }
    } else {
      this.x += (dx / dist) * this.speed * this.slowFactor;
      this.y += (dy / dist) * this.speed * this.slowFactor;
    }
  }
  
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      gameState.gold += this.goldReward;
      gameState.xp += this.xpReward;
      gameState.enemiesKilled++;
      
      // Level up every 100 XP
      const newLevel = Math.floor(gameState.xp / 100) + 1;
      if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.skillPoints++;
      }
    }
  }
  
  applySlow(duration) {
    this.slowTimer = Math.max(this.slowTimer, duration);
  }
  
  draw(p) {
    if (!this.alive || this.escaped) return;
    
    p.push();
    
    // Enemy body
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, 12, 12);
    
    // HP bar
    const barWidth = 16;
    const barHeight = 3;
    const hpPercent = this.hp / this.maxHp;
    
    p.fill(60);
    p.rect(this.x - barWidth / 2, this.y - 12, barWidth, barHeight);
    
    p.fill(200, 50, 50);
    p.rect(this.x - barWidth / 2, this.y - 12, barWidth * hpPercent, barHeight);
    
    // Slow effect indicator
    if (this.slowTimer > 0) {
      p.fill(100, 200, 255, 100);
      p.ellipse(this.x, this.y, 18, 18);
    }
    
    p.pop();
  }
}

export class Trap {
  constructor(type, gridX, gridY, definition) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = gridY * GRID_SIZE + GRID_SIZE / 2;
    
    this.damage = definition.damage;
    this.range = definition.range;
    this.maxCooldown = definition.cooldown;
    this.cooldown = 0;
    this.color = [...definition.color];
    this.level = 1;
    this.cost = definition.cost;
  }
  
  update(enemies, p) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    
    // Find enemies in range
    const enemiesInRange = enemies.filter(enemy => {
      if (!enemy.alive || enemy.escaped) return false;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= this.range;
    });
    
    if (enemiesInRange.length > 0) {
      // Attack closest enemy
      enemiesInRange.sort((a, b) => {
        const distA = Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2);
        const distB = Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2);
        return distA - distB;
      });
      
      const target = enemiesInRange[0];
      this.attack(target, p);
      this.cooldown = this.maxCooldown;
    }
  }
  
  attack(enemy, p) {
    const damageBonus = 1 + gameState.skills.damage * 0.1;
    enemy.takeDamage(this.damage * damageBonus);
    
    // Special effects
    if (this.type === 'ICE') {
      enemy.applySlow(60); // 1 second slow
    }
  }
  
  upgrade() {
    const upgradeCost = Math.floor(this.cost * this.level * 0.5);
    if (gameState.gold >= upgradeCost) {
      gameState.gold -= upgradeCost;
      this.level++;
      this.damage *= 1.2;
      this.range *= 1.1;
      return true;
    }
    return false;
  }
  
  sell() {
    const sellValue = Math.floor(this.cost * 0.7 + (this.level - 1) * this.cost * 0.3);
    gameState.gold += sellValue;
  }
  
  draw(p) {
    p.push();
    
    // Trap base
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, GRID_SIZE * 0.7, GRID_SIZE * 0.7, 3);
    
    // Cooldown indicator
    if (this.cooldown > 0) {
      const cooldownPercent = this.cooldown / this.maxCooldown;
      p.fill(0, 0, 0, 150);
      const height = GRID_SIZE * 0.7 * cooldownPercent;
      p.rect(this.x, this.y + (GRID_SIZE * 0.7 - height) / 2, GRID_SIZE * 0.7, height, 3);
    }
    
    // Level indicator
    if (this.level > 1) {
      p.fill(255, 255, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.text(this.level, this.x, this.y - GRID_SIZE * 0.25);
    }
    
    // Range indicator when hovered
    if (gameState.hoveredTrap === this) {
      p.noFill();
      p.stroke(255, 255, 255, 100);
      p.strokeWeight(1);
      p.ellipse(this.x, this.y, this.range * 2, this.range * 2);
    }
    
    p.pop();
  }
}