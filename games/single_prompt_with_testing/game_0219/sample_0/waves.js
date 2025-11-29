// waves.js - Wave management and monster spawning

import { gameState, GAME_CONFIG } from './globals.js';
import { Monster } from './entities.js';

// Start a new wave
export function startWave(waveNumber) {
  gameState.currentWave = waveNumber;
  gameState.waveActive = true;
  gameState.waveSpawnCounter = 0;
  gameState.monstersSpawned = 0;
  
  // Calculate monsters for this wave
  const baseCount = GAME_CONFIG.MONSTER_BASE_COUNT;
  const increment = GAME_CONFIG.MONSTER_COUNT_INCREMENT;
  gameState.monstersToSpawn = baseCount + (waveNumber - 1) * increment;
  
  console.log(`Wave ${waveNumber} started with ${gameState.monstersToSpawn} monsters`);
}

// Update wave spawning
export function updateWave(p) {
  if (!gameState.waveActive) return;
  
  // Spawn monsters
  if (gameState.monstersSpawned < gameState.monstersToSpawn) {
    gameState.waveSpawnCounter++;
    
    if (gameState.waveSpawnCounter >= gameState.waveSpawnInterval) {
      gameState.waveSpawnCounter = 0;
      new Monster(gameState.currentWave);
      gameState.monstersSpawned++;
    }
  }
  
  // Check if wave is complete
  if (gameState.monstersSpawned >= gameState.monstersToSpawn && 
      gameState.monsters.length === 0) {
    completeWave();
  }
}

// Complete the current wave
function completeWave() {
  gameState.waveActive = false;
  
  // Award bonus mana
  const bonusMana = Math.floor(20 * Math.pow(GAME_CONFIG.WAVE_BONUS_MULTIPLIER, gameState.currentWave - 1));
  gameState.mana += bonusMana;
  gameState.score += 100;
  
  console.log(`Wave ${gameState.currentWave} complete! Bonus: ${bonusMana} mana`);
  
  // Check win condition
  if (gameState.currentWave >= gameState.totalWaves) {
    gameState.gamePhase = "GAME_OVER_WIN";
  }
}

// Can start next wave?
export function canStartNextWave() {
  return !gameState.waveActive && 
         gameState.currentWave < gameState.totalWaves &&
         gameState.monsters.length === 0;
}