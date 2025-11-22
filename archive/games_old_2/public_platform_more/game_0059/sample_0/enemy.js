import { gameState } from './globals.js';
import { getPathPosition, getPathDirection } from './path.js';

export class Enemy {
  constructor(type, waveMultiplier = 1) {
    this.type = type;
    this.pathProgress = -0.05;
    this.speed = this.getSpeed(type) * (1 + waveMultiplier * 0.1);
    this.maxHealth = this.getMaxHealth(type) * (1 + waveMultiplier * 0.3);
    this.health = this.maxHealth;
    this.reward = this.getReward(type);
    this.size = this.getSize(type);
    this.color = this.getColor(type);
    this.alive = true;
    this.x = 0;
    this.y = 0;
    this.slowed = false;
    this.slowDuration = 0;
    this.armor = this.getArmor(type);
    this.flying = this.isFlying(type);
  }
  
  getSpeed(type) {
    const speeds = { 
      basic: 0.0008, fast: 0.0015, tank: 0.0004, 
      armored: 0.0006, flying: 0.0012, boss: 0.0003 
    };
    return speeds[type] || 0.0008;
  }
  
  getMaxHealth(type) {
    const healths = { 
      basic: 50, fast: 30, tank: 200, 
      armored: 100, flying: 40, boss: 500 
    };
    return healths[type] || 50;
  }
  
  getReward(type) {
    const rewards = { 
      basic: 5, fast: 4, tank: 15, 
      armored: 10, flying: 6, boss: 50 
    };
    return rewards[type] || 5;
  }
  
  getSize(type) {
    const sizes = { 
      basic: 8, fast: 6, tank: 14, 
      armored: 10, flying: 7, boss: 20 
    };
    return sizes[type] || 8;
  }
  
  getColor(type) {
    const colors = {
      basic: [150, 50, 50],
      fast: [255, 100, 100],
      tank: [80, 80, 120],
      armored: [120, 120, 150],
      flying: [200, 150, 255],
      boss: [200, 50, 50]
    };
    return colors[type] || [150, 50, 50];
  }
  
  getArmor(type) {
    const armors = { 
      basic: 0, fast: 0, tank: 2, 
      armored: 5, flying: 0, boss: 10 
    };
    return armors[type] || 0;
  }
  
  isFlying(type) {
    return type === "flying";
  }
  
  update() {
    if (!this.alive) return;
    
    // Update slow effect
    if (this.slowed) {
      this.slowDuration--;
      if (this.slowDuration <= 0) {
        this.slowed = false;
      }
    }
    
    const moveSpeed = this.slowed ? this.speed * 0.5 : this.speed;
    this.pathProgress += moveSpeed;
    
    const pos = getPathPosition(gameState.path, this.pathProgress);
    this.x = pos.x;
    this.y = pos.y;
    
    // Check if reached end
    if (this.pathProgress >= 1.0) {
      this.reachEnd();
    }
  }
  
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.armor);
    this.health -= actualDamage;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  applySlow(duration) {
    this.slowed = true;
    this.slowDuration = Math.max(this.slowDuration, duration);
  }
  
  die() {
    this.alive = false;
    gameState.gold += this.reward;
    gameState.score += this.reward * 10;
    gameState.enemiesKilledThisWave++;
  }
  
  reachEnd() {
    this.alive = false;
    gameState.lives--;
  }
  
  draw(p) {
    if (!this.alive) return;
    
    p.push();
    
    // Draw enemy body
    if (this.flying) {
      // Flying enemy - diamond shape
      p.fill(...this.color);
      p.noStroke();
      p.translate(this.x, this.y - 10);
      p.rotate(p.frameCount * 0.1);
      p.quad(0, -this.size, this.size, 0, 0, this.size, -this.size, 0);
    } else {
      // Ground enemy - circle
      p.fill(...this.color);
      p.noStroke();
      p.circle(this.x, this.y, this.size * 2);
      
      // Tank enemies have extra armor visual
      if (this.type === "tank" || this.type === "armored" || this.type === "boss") {
        p.stroke(180, 180, 200);
        p.strokeWeight(2);
        p.noFill();
        p.circle(this.x, this.y, this.size * 2 + 4);
      }
    }
    
    p.pop();
    
    // Draw health bar
    const barWidth = this.size * 2;
    const barHeight = 3;
    const barY = this.flying ? this.y - this.size - 15 : this.y - this.size - 8;
    
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(this.x - barWidth / 2, barY, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    p.fill(255 * (1 - healthPercent), 255 * healthPercent, 0);
    p.rect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    
    // Slow effect visual
    if (this.slowed) {
      p.push();
      p.fill(100, 200, 255, 100);
      p.noStroke();
      p.circle(this.x, this.y, this.size * 2.5);
      p.pop();
    }
  }
}

export function spawnEnemy(type, waveMultiplier) {
  const enemy = new Enemy(type, waveMultiplier);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  return enemy;
}