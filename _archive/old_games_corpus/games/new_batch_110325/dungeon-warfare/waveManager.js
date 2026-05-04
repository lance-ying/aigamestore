// waveManager.js - Manage enemy waves

import { Enemy } from './entities.js';
import { gameState, ENEMY_BASIC, ENEMY_FAST, ENEMY_TANK } from './globals.js';

export class WaveManager {
  constructor(p) {
    this.p = p;
    this.waveEnemies = [];
    this.spawnTimer = 0;
    this.spawnDelay = 30; // Spawn every 0.5 seconds
  }
  
  startWave() {
    gameState.wave++;
    gameState.waveInProgress = true;
    this.generateWave();
    this.spawnTimer = 0;
  }
  
  generateWave() {
    this.waveEnemies = [];
    const wave = gameState.wave;
    
    // Increase difficulty with each wave
    const basicCount = Math.min(5 + wave * 2, 15);
    const fastCount = Math.min(Math.floor(wave / 2), 8);
    const tankCount = Math.min(Math.floor(wave / 3), 4);
    
    for (let i = 0; i < basicCount; i++) {
      this.waveEnemies.push(ENEMY_BASIC);
    }
    for (let i = 0; i < fastCount; i++) {
      this.waveEnemies.push(ENEMY_FAST);
    }
    for (let i = 0; i < tankCount; i++) {
      this.waveEnemies.push(ENEMY_TANK);
    }
    
    // Shuffle
    for (let i = this.waveEnemies.length - 1; i > 0; i--) {
      const j = Math.floor(this.p.random() * (i + 1));
      [this.waveEnemies[i], this.waveEnemies[j]] = [this.waveEnemies[j], this.waveEnemies[i]];
    }
  }
  
  update() {
    if (!gameState.waveInProgress) return;
    
    // Spawn enemies
    if (this.waveEnemies.length > 0) {
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnDelay) {
        const enemyType = this.waveEnemies.shift();
        const enemy = new Enemy(enemyType, gameState.path, this.p);
        gameState.enemies.push(enemy);
        gameState.entities.push(enemy);
        this.spawnTimer = 0;
      }
    }
    
    // Check if wave is complete
    if (this.waveEnemies.length === 0) {
      const activeEnemies = gameState.enemies.filter(e => e.alive && !e.escaped);
      if (activeEnemies.length === 0) {
        gameState.waveInProgress = false;
        gameState.waveTimer = 0;
      }
    }
  }
}