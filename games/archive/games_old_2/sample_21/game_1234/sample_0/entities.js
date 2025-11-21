// entities.js - Player and enemy classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseMaxHP = 100;
    this.maxHP = this.baseMaxHP + gameState.permanentUpgrades.maxHPBonus * 20;
    this.hp = this.maxHP;
    this.speed = 3;
    this.size = 20;
    this.baseDamage = 10;
    this.damage = this.baseDamage + gameState.permanentUpgrades.damageBonus * 2;
    this.baseAttackSpeed = 30; // frames between attacks
    this.attackSpeed = Math.max(10, this.baseAttackSpeed - gameState.permanentUpgrades.attackSpeedBonus * 2);
    this.attackTimer = 0;
    this.isMoving = false;
    this.projectileCount = 1;
    this.ricochetCount = 0;
    this.pierceCount = 0;
    this.projectileSpeed = 6;
  }

  update(p) {
    this.attackTimer--;
    
    // Auto-attack when stationary
    if (!this.isMoving && this.attackTimer <= 0) {
      this.autoAttack(p);
      this.attackTimer = this.attackSpeed;
    }
  }

  autoAttack(p) {
    const nearestEnemy = this.findNearestEnemy();
    if (nearestEnemy) {
      // Calculate direction to enemy
      const dx = nearestEnemy.x - this.x;
      const dy = nearestEnemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const vx = (dx / dist) * this.projectileSpeed;
        const vy = (dy / dist) * this.projectileSpeed;
        
        // Fire projectiles based on projectileCount
        for (let i = 0; i < this.projectileCount; i++) {
          const angle = (i - (this.projectileCount - 1) / 2) * 0.2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rotatedVx = vx * cos - vy * sin;
          const rotatedVy = vx * sin + vy * cos;
          
          const projectile = new Projectile(
            this.x, this.y, rotatedVx, rotatedVy, 
            this.damage, true, this.ricochetCount, this.pierceCount
          );
          gameState.projectiles.push(projectile);
          gameState.entities.push(projectile);
        }
      }
    }
  }

  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      if (enemy.hp > 0) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      }
    }
    
    return nearest;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  render(p) {
    // Draw player as green triangle
    p.push();
    p.translate(this.x, this.y);
    p.fill(0, 255, 0);
    p.noStroke();
    p.triangle(0, -this.size/2, -this.size/2, this.size/2, this.size/2, this.size/2);
    p.pop();
    
    // Draw HP bar
    const barWidth = this.size;
    const barHeight = 4;
    const barY = this.y + this.size/2 + 5;
    
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(this.x - barWidth/2, barY, barWidth, barHeight);
    
    p.fill(0, 255, 0);
    const hpRatio = this.hp / this.maxHP;
    p.rect(this.x - barWidth/2, barY, barWidth * hpRatio, barHeight);
  }
}

export class Enemy {
  constructor(x, y, type, level) {
    this.x = x;
    this.y = y;
    this.type = type; // 'melee', 'ranged', 'miniboss', 'boss'
    this.level = level;
    this.hp = this.getMaxHP();
    this.maxHP = this.hp;
    this.damage = this.getDamage();
    this.speed = this.getSpeed();
    this.size = this.getSize();
    this.attackTimer = 0;
    this.attackCooldown = this.getAttackCooldown();
    this.moveTimer = 0;
    this.targetX = x;
    this.targetY = y;
    this.gold = this.getGoldDrop();
    this.scoreValue = this.getScoreValue();
  }

  getMaxHP() {
    const baseHP = {
      'melee': 20,
      'ranged': 15,
      'miniboss': 200,
      'boss': 500
    };
    return baseHP[this.type] * (1 + (this.level - 1) * 0.5);
  }

  getDamage() {
    const baseDamage = {
      'melee': 10,
      'ranged': 8,
      'miniboss': 15,
      'boss': 20
    };
    return baseDamage[this.type] * (1 + (this.level - 1) * 0.3);
  }

  getSpeed() {
    const baseSpeed = {
      'melee': 1.5,
      'ranged': 1.0,
      'miniboss': 1.2,
      'boss': 0.8
    };
    return baseSpeed[this.type] * (1 + (this.level - 1) * 0.1);
  }

  getSize() {
    return {
      'melee': 25,
      'ranged': 20,
      'miniboss': 40,
      'boss': 60
    }[this.type];
  }

  getAttackCooldown() {
    return {
      'melee': 0, // melee attacks on contact
      'ranged': 90,
      'miniboss': 60,
      'boss': 45
    }[this.type];
  }

  getGoldDrop() {
    const baseGold = {
      'melee': 2,
      'ranged': 3,
      'miniboss': 20,
      'boss': 100
    };
    return Math.floor(baseGold[this.type] * (1 + gameState.permanentUpgrades.goldBonus * 0.2));
  }

  getScoreValue() {
    return {
      'melee': 10,
      'ranged': 10,
      'miniboss': 100,
      'boss': 500
    }[this.type];
  }

  update(p) {
    if (!gameState.player) return;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (this.type === 'melee') {
      // Move towards player
      if (dist > this.size) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
      
      // Check collision with player for damage
      if (dist < this.size + gameState.player.size/2) {
        if (this.attackTimer <= 0) {
          gameState.player.takeDamage(this.damage);
          this.attackTimer = 60;
        }
      }
    } else if (this.type === 'ranged' || this.type === 'miniboss' || this.type === 'boss') {
      // Maintain distance and shoot
      const idealDist = 150;
      
      if (dist < idealDist - 20) {
        // Move away
        this.x -= (dx / dist) * this.speed * 0.5;
        this.y -= (dy / dist) * this.speed * 0.5;
      } else if (dist > idealDist + 20) {
        // Move closer
        this.x += (dx / dist) * this.speed * 0.5;
        this.y += (dy / dist) * this.speed * 0.5;
      }
      
      // Attack
      if (this.attackTimer <= 0) {
        this.shootAtPlayer();
        this.attackTimer = this.attackCooldown;
      }
    }
    
    this.attackTimer--;
    
    // Keep in bounds
    this.x = Math.max(40, Math.min(CANVAS_WIDTH - 40, this.x));
    this.y = Math.max(40, Math.min(CANVAS_HEIGHT - 40, this.y));
  }

  shootAtPlayer() {
    if (!gameState.player) return;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const speed = 4;
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      
      const projectileCount = this.type === 'boss' ? 3 : (this.type === 'miniboss' ? 2 : 1);
      
      for (let i = 0; i < projectileCount; i++) {
        const angle = (i - (projectileCount - 1) / 2) * 0.3;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedVx = vx * cos - vy * sin;
        const rotatedVy = vx * sin + vy * cos;
        
        const projectile = new Projectile(
          this.x, this.y, rotatedVx, rotatedVy, 
          this.damage, false, 0, 0
        );
        gameState.projectiles.push(projectile);
        gameState.entities.push(projectile);
      }
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  render(p) {
    // Draw enemy based on type
    p.push();
    p.fill(255, 0, 0);
    p.noStroke();
    
    if (this.type === 'melee') {
      p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    } else if (this.type === 'ranged') {
      p.circle(this.x, this.y, this.size);
    } else if (this.type === 'miniboss') {
      p.push();
      p.translate(this.x, this.y);
      p.rotate(p.frameCount * 0.02);
      p.rect(-this.size/2, -this.size/2, this.size, this.size);
      p.pop();
    } else if (this.type === 'boss') {
      p.push();
      p.translate(this.x, this.y);
      p.rotate(p.frameCount * 0.01);
      for (let i = 0; i < 6; i++) {
        p.rotate(Math.PI / 3);
        p.triangle(0, -this.size/2, -this.size/4, this.size/4, this.size/4, this.size/4);
      }
      p.pop();
    }
    p.pop();
    
    // Draw HP bar
    const barWidth = this.size;
    const barHeight = 4;
    const barY = this.y - this.size/2 - 8;
    
    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(this.x - barWidth/2, barY, barWidth, barHeight);
    
    p.fill(0, 255, 0);
    const hpRatio = this.hp / this.maxHP;
    p.rect(this.x - barWidth/2, barY, barWidth * hpRatio, barHeight);
  }
}

export class Projectile {
  constructor(x, y, vx, vy, damage, isPlayerProjectile, ricochetCount, pierceCount) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isPlayerProjectile = isPlayerProjectile;
    this.size = 5;
    this.active = true;
    this.ricochetCount = ricochetCount;
    this.pierceCount = pierceCount;
    this.hitEnemies = new Set();
  }

  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      if (this.ricochetCount > 0) {
        // Bounce off walls
        if (this.x < 0 || this.x > CANVAS_WIDTH) this.vx *= -1;
        if (this.y < 0 || this.y > CANVAS_HEIGHT) this.vy *= -1;
        this.ricochetCount--;
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(CANVAS_WIDTH, this.x));
        this.y = Math.max(0, Math.min(CANVAS_HEIGHT, this.y));
      } else {
        this.active = false;
      }
    }
    
    // Check collisions
    if (this.isPlayerProjectile) {
      for (const enemy of gameState.enemies) {
        if (enemy.hp > 0 && !this.hitEnemies.has(enemy)) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < enemy.size/2 + this.size) {
            enemy.takeDamage(this.damage);
            this.hitEnemies.add(enemy);
            
            if (this.pierceCount <= 0) {
              this.active = false;
            } else {
              this.pierceCount--;
            }
            break;
          }
        }
      }
    } else {
      if (gameState.player) {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < gameState.player.size/2 + this.size) {
          gameState.player.takeDamage(this.damage);
          this.active = false;
        }
      }
    }
  }

  render(p) {
    p.fill(...(this.isPlayerProjectile ? [0, 150, 255] : [255, 100, 0]));
    p.noStroke();
    p.circle(this.x, this.y, this.size * 2);
  }
}