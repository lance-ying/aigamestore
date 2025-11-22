import { gameState } from './globals.js';
import { spawnEnemy } from './enemy.js';

export class WaveManager {
  constructor() {
    this.waves = this.generateWaves();
    this.spawnTimer = 0;
    this.spawnInterval = 60; // Frames between spawns
  }
  
  generateWaves() {
    const waves = [];
    
    // Wave 1: Basic enemies
    waves.push([
      { type: 'basic', count: 8 }
    ]);
    
    // Wave 2: Basic + fast
    waves.push([
      { type: 'basic', count: 10 },
      { type: 'fast', count: 5 }
    ]);
    
    // Wave 3: More variety
    waves.push([
      { type: 'basic', count: 12 },
      { type: 'fast', count: 6 },
      { type: 'armored', count: 2 }
    ]);
    
    // Wave 4: Tank introduction
    waves.push([
      { type: 'basic', count: 10 },
      { type: 'fast', count: 8 },
      { type: 'tank', count: 3 }
    ]);
    
    // Wave 5: Flying enemies
    waves.push([
      { type: 'basic', count: 8 },
      { type: 'flying', count: 10 },
      { type: 'armored', count: 4 }
    ]);
    
    // Wave 6: Mixed challenge
    waves.push([
      { type: 'basic', count: 15 },
      { type: 'fast', count: 10 },
      { type: 'tank', count: 4 },
      { type: 'flying', count: 8 }
    ]);
    
    // Wave 7: Armored wave
    waves.push([
      { type: 'armored', count: 12 },
      { type: 'tank', count: 5 },
      { type: 'flying', count: 6 }
    ]);
    
    // Wave 8: Speed challenge
    waves.push([
      { type: 'fast', count: 20 },
      { type: 'flying', count: 12 },
      { type: 'basic', count: 10 }
    ]);
    
    // Wave 9: Heavy wave
    waves.push([
      { type: 'tank', count: 8 },
      { type: 'armored', count: 15 },
      { type: 'flying', count: 10 },
      { type: 'basic', count: 12 }
    ]);
    
    // Wave 10: Boss wave
    waves.push([
      { type: 'boss', count: 2 },
      { type: 'tank', count: 6 },
      { type: 'armored', count: 10 },
      { type: 'flying', count: 8 }
    ]);
    
    return waves;
  }
  
  startWave() {
    if (gameState.currentWave >= gameState.totalWaves) return;
    
    gameState.waveInProgress = true;
    gameState.enemiesSpawnedThisWave = 0;
    gameState.enemiesKilledThisWave = 0;
    gameState.framesSinceWaveStart = 0;
    
    const waveData = this.waves[gameState.currentWave];
    let totalEnemies = 0;
    for (let group of waveData) {
      totalEnemies += group.count;
    }
    gameState.totalEnemiesThisWave = totalEnemies;
    
    this.spawnTimer = 0;
  }
  
  update() {
    if (!gameState.waveInProgress) return;
    
    gameState.framesSinceWaveStart++;
    this.spawnTimer--;
    
    if (this.spawnTimer <= 0 && gameState.enemiesSpawnedThisWave < gameState.totalEnemiesThisWave) {
      this.spawnNextEnemy();
      this.spawnTimer = this.spawnInterval;
    }
    
    // Check if wave is complete
    if (gameState.enemiesSpawnedThisWave >= gameState.totalEnemiesThisWave) {
      const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
      if (aliveEnemies === 0) {
        this.completeWave();
      }
    }
  }
  
  spawnNextEnemy() {
    const waveData = this.waves[gameState.currentWave];
    let spawned = 0;
    
    for (let group of waveData) {
      if (spawned + group.count > gameState.enemiesSpawnedThisWave) {
        const waveMultiplier = gameState.currentWave * 0.2;
        spawnEnemy(group.type, waveMultiplier);
        gameState.enemiesSpawnedThisWave++;
        return;
      }
      spawned += group.count;
    }
  }
  
  completeWave() {
    gameState.waveInProgress = false;
    gameState.currentWave++;
    gameState.gold += 50 + gameState.currentWave * 10;
    gameState.score += 500;
    
    // Bonus gold for perfect wave
    if (gameState.lives === gameState.maxLives) {
      gameState.gold += 30;
    }
    
    gameState.waveTimer = 300; // 5 seconds before next wave
  }
}