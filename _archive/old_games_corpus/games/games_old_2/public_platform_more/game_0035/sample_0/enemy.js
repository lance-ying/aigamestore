// enemy.js - Enemy entity and wave management

import { gameState } from './globals.js';
import { createParticles } from './particle.js';

export class Enemy {
  constructor(type, wave) {
    this.type = type;
    this.pathIndex = 0;
    this.x = gameState.path[0].x;
    this.y = gameState.path[0].y;
    this.progress = 0;
    this.alive = true;
    this.reachedEnd = false;
    
    // Scale with wave
    const waveScale = 1 + wave * 0.3;
    this.maxHealth = Math.floor(type.health * waveScale);
    this.health = this.maxHealth;
    this.speed = type.speed;
    this.goldValue = Math.floor(type.gold * (1 + wave * 0.1));
    this.color = type.color;
    this.size = type.size;
    
    // Boss properties
    this.isBoss = type.isBoss || false;
    if (this.isBoss) {
      this.maxHealth *= 5;
      this.health = this.maxHealth;
      this.goldValue *= 3;
      this.size *= 1.5;
    }
  }
  
  update(p) {
    if (!this.alive) return;
    
    if (this.pathIndex >= gameState.path.length - 1) {
      this.reachedEnd = true;
      this.alive = false;
      gameState.lives--;
      
      // Log when enemy reaches end
      p.logs.game_info.push({
        data: { event: "enemy_reached_end", lives: gameState.lives },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    const target = gameState.path[this.pathIndex + 1];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      this.pathIndex++;
      if (this.pathIndex < gameState.path.length - 1) {
        const nextTarget = gameState.path[this.pathIndex + 1];
        this.x = gameState.path[this.pathIndex].x;
        this.y = gameState.path[this.pathIndex].y;
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
    
    this.progress = this.pathIndex / (gameState.path.length - 1);
  }
  
  takeDamage(damage, p) {
    this.health -= damage;
    
    if (this.health <= 0 && this.alive) {
      this.alive = false;
      gameState.gold += this.goldValue;
      gameState.score += this.goldValue;
      
      // Create death particles
      createParticles(p, this.x, this.y, this.color);
      
      return true;
    }
    return false;
  }
  
  draw(p) {
    if (!this.alive) return;
    
    // Draw health bar
    const barWidth = this.size * 1.2;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(200, 50, 50);
    p.noStroke();
    p.rect(this.x - barWidth / 2, this.y - this.size - 8, barWidth, barHeight, 2);
    
    p.fill(50, 200, 50);
    p.rect(this.x - barWidth / 2, this.y - this.size - 8, barWidth * healthPercent, barHeight, 2);
    
    // Draw enemy body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.isBoss) {
      // Boss appearance
      p.push();
      p.translate(this.x, this.y);
      p.rotate(p.frameCount * 0.05);
      p.rect(-this.size / 2, -this.size / 2, this.size, this.size);
      p.fill(255, 0, 0);
      p.triangle(-this.size / 4, -this.size / 2, this.size / 4, -this.size / 2, 0, -this.size);
      p.pop();
    } else {
      p.circle(this.x, this.y, this.size);
    }
  }
}

const ENEMY_TYPES = [
  { name: "Goblin", health: 20, speed: 1.5, gold: 5, color: [100, 180, 100], size: 12, isBoss: false },
  { name: "Orc", health: 40, speed: 1.0, gold: 8, color: [180, 100, 100], size: 14, isBoss: false },
  { name: "Troll", health: 80, speed: 0.8, gold: 12, color: [100, 100, 180], size: 16, isBoss: false },
  { name: "Dragon", health: 150, speed: 1.2, gold: 20, color: [200, 50, 50], size: 18, isBoss: true }
];

export function spawnWave(p) {
  const wave = gameState.wave;
  const enemiesPerWave = gameState.enemiesPerWave + Math.floor(wave / 2);
  
  // Determine enemy composition
  let enemyType;
  if (wave > 0 && wave % 5 === 0) {
    // Boss wave
    enemyType = ENEMY_TYPES[3];
  } else if (wave >= 7) {
    enemyType = ENEMY_TYPES[2];
  } else if (wave >= 4) {
    enemyType = ENEMY_TYPES[1];
  } else {
    enemyType = ENEMY_TYPES[0];
  }
  
  gameState.enemiesSpawned = 0;
  gameState.spawnInterval = 40 - Math.min(wave * 2, 20);
  gameState.enemiesToSpawn = enemiesPerWave;
  gameState.currentEnemyType = enemyType;
  
  // Log wave start
  p.logs.game_info.push({
    data: { event: "wave_start", wave: wave, enemyType: enemyType.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateWaveSpawning(p) {
  if (gameState.enemiesSpawned < gameState.enemiesToSpawn) {
    if (p.frameCount % gameState.spawnInterval === 0) {
      const enemy = new Enemy(gameState.currentEnemyType, gameState.wave);
      gameState.enemies.push(enemy);
      gameState.enemiesSpawned++;
    }
  }
}