import { gameState } from './globals.js';
import { spawnEnemy, spawnBoss } from './enemy.js';

export function updateSpawning(p) {
  const frameCount = p.frameCount;
  
  // Check for boss spawn
  if (frameCount >= gameState.bossTime && !gameState.currentBoss) {
    spawnBoss(p);
    return;
  }
  
  // Check for wave progression
  if (frameCount >= gameState.nextWaveTime) {
    gameState.waveLevel++;
    gameState.nextWaveTime += 30 * 60; // Next wave in 30 seconds
  }
  
  // Spawn regular enemies
  const spawnRate = Math.max(5, 30 - gameState.waveLevel * 2); // Faster spawning each wave
  
  if (frameCount % spawnRate === 0) {
    const enemyCount = gameState.enemies.length;
    const maxEnemies = 30 + gameState.waveLevel * 3;
    
    if (enemyCount < maxEnemies) {
      spawnEnemy(p);
    }
  }
  
  // Spawn additional enemies in groups occasionally
  if (frameCount % 180 === 0 && gameState.waveLevel > 2) {
    const groupSize = Math.floor(gameState.waveLevel / 2);
    for (let i = 0; i < groupSize; i++) {
      spawnEnemy(p, 'fast');
    }
  }
}