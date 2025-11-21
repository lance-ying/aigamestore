// enemies.js - Enemy class and spawning
import { gameState, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';

export class Enemy {
  constructor(type, level, p) {
    this.type = type;
    this.level = level;
    this.pathIndex = 0;
    this.pathProgress = 0;
    this.x = gameState.path[0].x;
    this.y = gameState.path[0].y;
    
    const stats = this.getBaseStats();
    this.maxHealth = stats.health;
    this.health = stats.health;
    this.speed = stats.speed;
    this.baseDamage = stats.damage;
    this.reward = stats.reward;
    this.points = stats.points;
    
    this.isDead = false;
    this.hitFlash = 0;
    
    this.p = p;
  }
  
  getBaseStats() {
    const levelMultiplier = 1 + (this.level - 1) * 0.3;
    
    let baseStats = {};
    if (this.type === 'Basic') {
      baseStats = { health: 30, speed: 1.5, damage: 10, reward: 5, points: 10 };
    } else if (this.type === 'Fast') {
      baseStats = { health: 20, speed: 2.5, damage: 8, reward: 8, points: 25 };
    } else if (this.type === 'Tanky') {
      baseStats = { health: 80, speed: 1, damage: 15, reward: 12, points: 50 };
    } else if (this.type === 'Boss') {
      baseStats = { health: 200, speed: 0.8, damage: 25, reward: 30, points: 150 };
    }
    
    return {
      health: Math.floor(baseStats.health * levelMultiplier),
      speed: baseStats.speed,
      damage: baseStats.damage,
      reward: baseStats.reward,
      points: baseStats.points
    };
  }
  
  update() {
    if (this.isDead) return false;
    
    if (this.hitFlash > 0) this.hitFlash--;
    
    // Move along path
    if (this.pathIndex < gameState.path.length - 1) {
      const current = gameState.path[this.pathIndex];
      const next = gameState.path[this.pathIndex + 1];
      
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      this.pathProgress += this.speed;
      
      if (this.pathProgress >= dist) {
        this.pathProgress = 0;
        this.pathIndex++;
        
        if (this.pathIndex >= gameState.path.length - 1) {
          // Reached base
          this.reachedBase();
          return false;
        }
      }
      
      const t = this.pathProgress / dist;
      this.x = current.x + dx * t;
      this.y = current.y + dy * t;
    } else {
      this.reachedBase();
      return false;
    }
    
    return true;
  }
  
  reachedBase() {
    gameState.baseHealth -= this.baseDamage;
    gameState.shakeAmount = 10;
    
    if (gameState.baseHealth <= 0) {
      gameState.baseHealth = 0;
      gameState.gamePhase = "GAME_OVER";
      gameState.gameOverReason = "LOSE";
    }
    
    this.isDead = true;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 5;
    
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      
      // Reward
      gameState.currency += this.reward;
      gameState.score += this.points;
      
      // Particle effect
      for (let i = 0; i < 8; i++) {
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: this.p.random(-2, 2),
          vy: this.p.random(-2, 2),
          life: 30,
          color: [255, 200, 0]
        });
      }
      
      return true;
    }
    
    return false;
  }
  
  draw(p) {
    if (this.isDead) return;
    
    p.push();
    
    const enemyColors = {
      'Basic': [255, 100, 100],
      'Fast': [255, 255, 100],
      'Tanky': [255, 150, 50],
      'Boss': [50, 50, 50]
    };
    
    const enemySizes = {
      'Basic': 15,
      'Fast': 12,
      'Tanky': 25,
      'Boss': 35
    };
    
    // Hit flash
    if (this.hitFlash > 0) {
      p.fill(255, 255, 255);
    } else {
      p.fill(...enemyColors[this.type]);
    }
    
    p.stroke(0);
    p.strokeWeight(2);
    
    const size = enemySizes[this.type];
    
    if (this.type === 'Basic') {
      p.circle(this.x, this.y, size);
    } else if (this.type === 'Fast') {
      p.triangle(this.x, this.y - size / 2, this.x - size / 2, this.y + size / 2, this.x + size / 2, this.y + size / 2);
    } else if (this.type === 'Tanky') {
      p.rect(this.x - size / 2, this.y - size / 2, size, size);
    } else if (this.type === 'Boss') {
      p.push();
      p.translate(this.x, this.y);
      p.beginShape();
      for (let i = 0; i < 8; i++) {
        const angle = p.TWO_PI * i / 8;
        const r = size / 2;
        p.vertex(r * p.cos(angle), r * p.sin(angle));
      }
      p.endShape(p.CLOSE);
      p.pop();
    }
    
    // Health bar
    const barWidth = size * 1.2;
    const barHeight = 3;
    const healthPercent = this.health / this.maxHealth;
    
    p.noStroke();
    p.fill(255, 0, 0);
    p.rect(this.x - barWidth / 2, this.y - size / 2 - 8, barWidth, barHeight);
    p.fill(0, 255, 0);
    p.rect(this.x - barWidth / 2, this.y - size / 2 - 8, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
}

export function generateWaveEnemies(level, wave, totalWaves) {
  const enemies = [];
  
  if (level === 1) {
    // Only basic enemies
    const count = 5 + wave * 2;
    for (let i = 0; i < count; i++) {
      enemies.push({ type: 'Basic', delay: i * 60 });
    }
  } else if (level === 2) {
    // Basic and Fast
    const basicCount = 4 + wave;
    const fastCount = 2 + wave;
    
    for (let i = 0; i < basicCount; i++) {
      enemies.push({ type: 'Basic', delay: i * 45 });
    }
    for (let i = 0; i < fastCount; i++) {
      enemies.push({ type: 'Fast', delay: (basicCount + i) * 45 });
    }
  } else if (level === 3) {
    // All types
    const basicCount = 3 + wave;
    const fastCount = 2 + wave;
    const tankyCount = 1 + Math.floor(wave / 2);
    
    let delay = 0;
    for (let i = 0; i < basicCount; i++) {
      enemies.push({ type: 'Basic', delay: delay });
      delay += 40;
    }
    for (let i = 0; i < fastCount; i++) {
      enemies.push({ type: 'Fast', delay: delay });
      delay += 40;
    }
    for (let i = 0; i < tankyCount; i++) {
      enemies.push({ type: 'Tanky', delay: delay });
      delay += 60;
    }
    
    // Boss on final wave
    if (wave === totalWaves) {
      enemies.push({ type: 'Boss', delay: delay + 120 });
    }
  }
  
  return enemies;
}