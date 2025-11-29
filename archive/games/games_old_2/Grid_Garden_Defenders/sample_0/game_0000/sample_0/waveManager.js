// waveManager.js - Wave spawning and management

import { gameState, LEVEL_CONFIG, GAME_PHASES } from './globals.js';
import { Zombie } from './entities.js';

export class WaveManager {
  constructor() {
    this.waveSpawnQueue = [];
    this.spawnTimer = 0;
  }
  
  startWave(waveIndex) {
    const levelConfig = LEVEL_CONFIG[gameState.currentLevel - 1];
    if (waveIndex >= levelConfig.waves.length) {
      return false; // No more waves
    }
    
    const wave = levelConfig.waves[waveIndex];
    this.waveSpawnQueue = wave.zombies.map(z => ({...z, spawned: false}));
    this.spawnTimer = 0;
    return true;
  }
  
  update(p, deltaTime) {
    if (this.waveSpawnQueue.length === 0) {
      return;
    }
    
    this.spawnTimer += deltaTime;
    
    // Spawn zombies based on their delay
    for (let zombie of this.waveSpawnQueue) {
      if (!zombie.spawned && this.spawnTimer >= zombie.delay) {
        zombie.spawned = true;
        const newZombie = new Zombie(zombie.lane, zombie.type);
        gameState.zombies.push(newZombie);
        gameState.entities.push(newZombie);
      }
    }
    
    // Check if wave is complete
    if (this.waveSpawnQueue.every(z => z.spawned)) {
      this.waveSpawnQueue = [];
    }
  }
  
  isWaveActive() {
    return this.waveSpawnQueue.length > 0 || gameState.zombies.length > 0;
  }
}