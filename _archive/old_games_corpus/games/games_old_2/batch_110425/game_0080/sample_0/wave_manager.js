// wave_manager.js - Manages enemy wave spawning

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy } from './enemy.js';
import { Portal } from './portal.js';

export class WaveManager {
  constructor(p) {
    this.p = p;
    this.spawnTimer = 0;
    this.spawnDelay = 60;
  }
  
  startWave() {
    gameState.waveComplete = false;
    gameState.enemiesDefeated = 0;
    
    // Calculate enemies for this wave
    const baseEnemies = 3;
    const levelBonus = Math.floor((gameState.level - 1) * 1.5);
    const waveBonus = (gameState.wave - 1) * 2;
    gameState.totalEnemiesForWave = baseEnemies + levelBonus + waveBonus;
    gameState.enemiesInWave = 0;
    
    this.spawnTimer = 0;
  }
  
  update() {
    if (gameState.waveComplete) return;
    
    // Spawn enemies gradually
    if (gameState.enemiesInWave < gameState.totalEnemiesForWave) {
      this.spawnTimer++;
      
      if (this.spawnTimer >= this.spawnDelay) {
        this.spawnEnemy();
        this.spawnTimer = 0;
      }
    }
    
    // Check if wave is complete
    if (gameState.enemiesInWave >= gameState.totalEnemiesForWave &&
        gameState.enemiesDefeated >= gameState.totalEnemiesForWave) {
      this.completeWave();
    }
  }
  
  spawnEnemy() {
    // Choose enemy type based on level
    let type = 'basic';
    const rand = this.p.random(100);
    
    if (gameState.level >= 2) {
      if (rand < 30) type = 'fast';
      else if (rand < 50) type = 'basic';
      else if (rand < 70 && gameState.level >= 3) type = 'tank';
      else if (rand < 85 && gameState.level >= 4) type = 'sniper';
      else type = 'basic';
    }
    
    // Spawn at random edge
    let x, y;
    const edge = this.p.floor(this.p.random(4));
    
    switch(edge) {
      case 0: // Top
        x = this.p.random(50, CANVAS_WIDTH - 50);
        y = 20;
        break;
      case 1: // Right
        x = CANVAS_WIDTH - 20;
        y = this.p.random(50, CANVAS_HEIGHT - 50);
        break;
      case 2: // Bottom
        x = this.p.random(50, CANVAS_WIDTH - 50);
        y = CANVAS_HEIGHT - 20;
        break;
      case 3: // Left
        x = 20;
        y = this.p.random(50, CANVAS_HEIGHT - 50);
        break;
    }
    
    const enemy = new Enemy(this.p, x, y, type);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
    gameState.enemiesInWave++;
  }
  
  completeWave() {
    gameState.waveComplete = true;
    gameState.wave++;
    
    // Check if level complete (3 waves per level)
    if (gameState.wave > 3) {
      this.completeLevel();
    } else {
      // Start next wave after delay
      setTimeout(() => {
        if (gameState.gamePhase === 'PLAYING') {
          this.startWave();
        }
      }, 2000);
    }
  }
  
  completeLevel() {
    // Spawn exit portal
    if (!gameState.exitPortal) {
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      gameState.exitPortal = new Portal(this.p, centerX, centerY);
      gameState.exitPortal.activate();
    }
  }
  
  nextLevel() {
    gameState.level++;
    gameState.wave = 1;
    gameState.exitPortal = null;
    gameState.shieldCharges = Math.min(gameState.shieldCharges + 1, 3);
    this.startWave();
  }
}