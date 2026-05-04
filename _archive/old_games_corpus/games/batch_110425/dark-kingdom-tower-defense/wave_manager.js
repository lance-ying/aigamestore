// wave_manager.js - Wave spawning and management

import { gameState, TOTAL_WAVES, ENEMIES_PER_WAVE_BASE, WAVE_SCALING, ENEMY_TYPES, PHASE_GAME_OVER_WIN } from './globals.js';
import { Enemy } from './entities.js';

export function startNextWave() {
  if (gameState.currentWave >= TOTAL_WAVES) {
    return;
  }
  
  gameState.currentWave++;
  gameState.waveInProgress = true;
  
  const enemyCount = Math.floor(ENEMIES_PER_WAVE_BASE * Math.pow(WAVE_SCALING, gameState.currentWave - 1));
  gameState.enemiesRemaining = enemyCount;
  
  // Spawn enemies over time
  spawnWaveEnemies(enemyCount);
}

function spawnWaveEnemies(count) {
  let spawned = 0;
  
  const spawnInterval = setInterval(() => {
    if (spawned >= count || gameState.gamePhase !== "PLAYING") {
      clearInterval(spawnInterval);
      return;
    }
    
    const enemyType = selectEnemyType(gameState.currentWave);
    const enemy = new Enemy(enemyType, gameState.path);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
    spawned++;
  }, 1000);
}

function selectEnemyType(wave) {
  // Early waves have basic enemies
  if (wave <= 2) {
    return ENEMY_TYPES[0]; // SOLDIER
  } else if (wave <= 4) {
    const types = [ENEMY_TYPES[0], ENEMY_TYPES[1]]; // SOLDIER, KNIGHT
    return types[Math.floor(Math.random() * types.length)];
  } else if (wave <= 6) {
    const types = [ENEMY_TYPES[0], ENEMY_TYPES[1], ENEMY_TYPES[2]]; // + MAGE
    return types[Math.floor(Math.random() * types.length)];
  } else if (wave <= 8) {
    const types = [ENEMY_TYPES[1], ENEMY_TYPES[2], ENEMY_TYPES[3]]; // KNIGHT, MAGE, TANK
    return types[Math.floor(Math.random() * types.length)];
  } else {
    // Late waves have all enemy types
    return ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  }
}

export function updateWaveState() {
  // Check if wave is complete
  if (gameState.waveInProgress && gameState.enemies.length === 0 && gameState.enemiesRemaining === 0) {
    gameState.waveInProgress = false;
    gameState.stars++;
    
    // Check win condition
    if (gameState.currentWave >= TOTAL_WAVES) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.totalStars += gameState.stars;
    } else {
      // Start next wave after delay
      gameState.waveStartDelay = 180; // 3 seconds
    }
  }
  
  // Auto-start next wave after delay
  if (gameState.waveStartDelay > 0) {
    gameState.waveStartDelay--;
    if (gameState.waveStartDelay === 0 && gameState.gamePhase === "PLAYING") {
      startNextWave();
    }
  }
}

export function checkEnemiesRemaining() {
  // Count enemies that haven't spawned yet
  let remaining = 0;
  for (const enemy of gameState.enemies) {
    if (!enemy.reachedEnd) remaining++;
  }
  gameState.enemiesRemaining = remaining;
}