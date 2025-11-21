// entities.js - Game entity classes

import { UNIT_TYPES, UNIT_CONFIGS, BUILDING_TYPES, BUILDING_CONFIGS, CELL_SIZE } from './globals.js';

export class Unit {
  constructor(gridX, gridY, type, isEnemy = false) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.isEnemy = isEnemy;
    
    const config = UNIT_CONFIGS[type];
    this.health = config.health;
    this.maxHealth = config.maxHealth;
    this.damage = config.damage;
    this.range = config.range;
    this.movementAllowance = config.movementAllowance;
    this.cost = config.cost;
    
    this.x = gridX * CELL_SIZE + CELL_SIZE / 2;
    this.y = gridY * CELL_SIZE + CELL_SIZE / 2;
    
    this.hasMoved = false;
    this.hasAttacked = false;
    this.target = null;
    this.scale = 0;
    this.animationProgress = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.fadeOut = false;
    this.alpha = 255;
  }
  
  update(p) {
    // Deployment animation
    if (this.scale < 1) {
      this.scale = Math.min(1, this.scale + 0.1);
    }
    
    // Shake animation
    if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
      this.shakeOffset.x *= 0.7;
      this.shakeOffset.y *= 0.7;
      if (Math.abs(this.shakeOffset.x) < 0.5) this.shakeOffset.x = 0;
      if (Math.abs(this.shakeOffset.y) < 0.5) this.shakeOffset.y = 0;
    }
    
    // Fade out animation
    if (this.fadeOut) {
      this.alpha = Math.max(0, this.alpha - 15);
      this.scale = Math.max(0, this.scale - 0.05);
    }
    
    // Update screen position
    this.x = this.gridX * CELL_SIZE + CELL_SIZE / 2 + this.shakeOffset.x;
    this.y = this.gridY * CELL_SIZE + CELL_SIZE / 2 + this.shakeOffset.y;
  }
  
  render(p) {
    const config = UNIT_CONFIGS[this.type];
    const color = this.isEnemy ? config.enemyColor : config.color;
    
    p.push();
    p.translate(this.x, this.y);
    p.scale(this.scale);
    
    // Unit shape
    p.fill(...color, this.alpha);
    p.stroke(0, this.alpha);
    p.strokeWeight(1);
    
    const size = CELL_SIZE * 0.6;
    
    if (this.type === UNIT_TYPES.INFANTRY) {
      p.circle(0, 0, size);
    } else if (this.type === UNIT_TYPES.ARTILLERY) {
      p.triangle(-size/2, size/2, size/2, size/2, 0, -size/2);
    } else if (this.type === UNIT_TYPES.TANK) {
      p.rectMode(p.CENTER);
      p.rect(0, 0, size, size * 0.7);
    }
    
    // Health bar
    if (this.scale >= 0.9) {
      const healthBarWidth = size * 0.8;
      const healthBarHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      p.noStroke();
      p.fill(60, this.alpha);
      p.rectMode(p.CENTER);
      p.rect(0, -size/2 - 5, healthBarWidth, healthBarHeight);
      
      const barColor = this.isEnemy ? [255, 100, 100] : [100, 255, 100];
      p.fill(...barColor, this.alpha);
      p.rectMode(p.CORNER);
      p.rect(-healthBarWidth/2, -size/2 - 5 - healthBarHeight/2, 
             healthBarWidth * healthPercent, healthBarHeight);
    }
    
    p.pop();
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.shakeOffset = { x: p5.prototype.random(-3, 3), y: p5.prototype.random(-3, 3) };
    if (this.health <= 0) {
      this.health = 0;
      this.fadeOut = true;
    }
  }
  
  isDead() {
    return this.health <= 0 && this.alpha <= 0;
  }
}

export class Building {
  constructor(gridX, gridY, type, isEnemy = false) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.isEnemy = isEnemy;
    
    const config = BUILDING_CONFIGS[type];
    this.health = config.health;
    this.maxHealth = config.maxHealth;
    this.damage = config.damage || 0;
    this.range = config.range || 0;
    
    this.x = gridX * CELL_SIZE + CELL_SIZE / 2;
    this.y = gridY * CELL_SIZE + CELL_SIZE / 2;
    
    this.shakeOffset = { x: 0, y: 0 };
    this.fadeOut = false;
    this.alpha = 255;
    this.scale = 1;
  }
  
  update(p) {
    // Shake animation
    if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
      this.shakeOffset.x *= 0.7;
      this.shakeOffset.y *= 0.7;
      if (Math.abs(this.shakeOffset.x) < 0.5) this.shakeOffset.x = 0;
      if (Math.abs(this.shakeOffset.y) < 0.5) this.shakeOffset.y = 0;
    }
    
    // Fade out animation
    if (this.fadeOut) {
      this.alpha = Math.max(0, this.alpha - 10);
      this.scale = Math.max(0, this.scale - 0.03);
    }
    
    this.x = this.gridX * CELL_SIZE + CELL_SIZE / 2 + this.shakeOffset.x;
    this.y = this.gridY * CELL_SIZE + CELL_SIZE / 2 + this.shakeOffset.y;
  }
  
  render(p) {
    const config = BUILDING_CONFIGS[this.type];
    
    p.push();
    p.translate(this.x, this.y);
    p.scale(this.scale);
    
    if (this.type === BUILDING_TYPES.PLAYER_HQ || this.type === BUILDING_TYPES.ENEMY_HQ) {
      const size = CELL_SIZE * 1.5;
      p.fill(...config.color, this.alpha);
      p.stroke(0, this.alpha);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(0, 0, size, size);
      
      // Flag
      p.fill(this.isEnemy ? 255 : 100, this.alpha);
      p.triangle(-size/4, -size/2, -size/4, -size/2 + 10, -size/4 + 8, -size/2 + 5);
    } else if (this.type === BUILDING_TYPES.TURRET) {
      const size = CELL_SIZE * 0.7;
      p.fill(...config.color, this.alpha);
      p.stroke(0, this.alpha);
      p.strokeWeight(1);
      p.circle(0, 0, size);
      
      // Barrel
      p.strokeWeight(3);
      p.line(0, 0, size/2, 0);
    }
    
    // Health bar
    const healthBarWidth = CELL_SIZE * 1.2;
    const healthBarHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(60, this.alpha);
    p.rectMode(p.CENTER);
    p.rect(0, CELL_SIZE - 8, healthBarWidth, healthBarHeight);
    
    const barColor = this.isEnemy ? [255, 100, 100] : [100, 255, 100];
    p.fill(...barColor, this.alpha);
    p.rectMode(p.CORNER);
    p.rect(-healthBarWidth/2, CELL_SIZE - 8 - healthBarHeight/2, 
           healthBarWidth * healthPercent, healthBarHeight);
    
    p.pop();
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.shakeOffset = { x: p5.prototype.random(-4, 4), y: p5.prototype.random(-4, 4) };
    if (this.health <= 0) {
      this.health = 0;
      this.fadeOut = true;
    }
  }
  
  isDead() {
    return this.health <= 0 && this.alpha <= 0;
  }
}

export class Projectile {
  constructor(startX, startY, endX, endY) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.progress = 0;
    this.speed = 0.15;
    this.active = true;
  }
  
  update() {
    this.progress += this.speed;
    this.x = this.startX + (this.endX - this.startX) * this.progress;
    this.y = this.startY + (this.endY - this.startY) * this.progress;
    
    if (this.progress >= 1) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(this.x, this.y, 5);
    p.pop();
  }
}