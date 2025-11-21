// wave_manager.js - Enemy wave spawning system

import { gameState } from './globals.js';
import { spawnEnemy } from './enemy.js';

export function updateWaveSystem(p) {
  const currentTime = p.frameCount / 60; // Convert to seconds
  
  // Increase wave level every 20 seconds
  const expectedWave = Math.floor(currentTime / 20) + 1;
  if (expectedWave > gameState.waveLevel) {
    gameState.waveLevel = expectedWave;
    gameState.lastWaveTime = currentTime;
    
    // Log wave increase
    p.logs.game_info.push({
      data: { event: "wave_increase", wave: gameState.waveLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Spawn enemies based on wave level
  const spawnRate = getSpawnRate();
  
  if (Math.random() < spawnRate) {
    spawnEnemy(p);
  }
}

function getSpawnRate() {
  // Base spawn rate increases with wave level
  const baseRate = 0.015; // ~1 enemy per second at 60fps
  const waveMultiplier = 1 + (gameState.waveLevel - 1) * 0.3;
  
  return Math.min(baseRate * waveMultiplier, 0.1); // Cap at 6 per second
}

export function getWaveInfo() {
  return {
    level: gameState.waveLevel,
    enemyCount: gameState.enemies.length,
    spawnRate: getSpawnRate()
  };
}