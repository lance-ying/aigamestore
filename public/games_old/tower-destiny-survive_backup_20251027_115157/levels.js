// levels.js - Level and wave management
import { gameState, GAME_PHASES } from './globals.js';
import { Zombie } from './entities.js';

export function initializeLevel(levelNumber) {
  gameState.currentLevel = levelNumber;
  gameState.currentWave = 0;
  gameState.zombiesSpawnedInWave = 0;
  gameState.zombiesRemainingInWave = 0;
  gameState.waveSpawnTimer = 0;
  
  const levelConfig = gameState.levels[levelNumber - 1];
  gameState.totalZombiesInLevel = levelConfig.zombiesPerWave.reduce((a, b) => a + b, 0);
  
  // Clear entities
  gameState.zombies = [];
  gameState.bullets = [];
  gameState.blocks = [];
  
  startNextWave();
}

export function startNextWave() {
  gameState.currentWave++;
  const levelConfig = gameState.levels[gameState.currentLevel - 1];
  
  if (gameState.currentWave <= levelConfig.waves) {
    gameState.zombiesSpawnedInWave = 0;
    gameState.zombiesRemainingInWave = levelConfig.zombiesPerWave[gameState.currentWave - 1];
    gameState.waveSpawnTimer = 0;
  }
}

export function updateWaveSpawning(p) {
  const levelConfig = gameState.levels[gameState.currentLevel - 1];
  
  if (gameState.currentWave > levelConfig.waves) {
    return;
  }
  
  const zombiesInWave = levelConfig.zombiesPerWave[gameState.currentWave - 1];
  
  if (gameState.zombiesSpawnedInWave < zombiesInWave) {
    gameState.waveSpawnTimer++;
    
    if (gameState.waveSpawnTimer >= gameState.waveSpawnDelay) {
      spawnZombie(p, levelConfig);
      gameState.zombiesSpawnedInWave++;
      gameState.waveSpawnTimer = 0;
    }
  }
}

function spawnZombie(p, levelConfig) {
  const types = levelConfig.zombieTypes;
  let type = "basic";
  
  if (types.includes("tank") && Math.random() < 0.15) {
    type = "tank";
  } else if (types.includes("fast") && Math.random() < 0.35) {
    type = "fast";
  }
  
  const y = 250 + Math.random() * 30;
  const zombie = new Zombie(620, y, type, gameState.currentLevel);
  gameState.zombies.push(zombie);
  gameState.entities.push(zombie);
}

export function checkWaveComplete() {
  if (gameState.zombies.length === 0 && 
      gameState.zombiesSpawnedInWave >= gameState.levels[gameState.currentLevel - 1].zombiesPerWave[gameState.currentWave - 1]) {
    
    const levelConfig = gameState.levels[gameState.currentLevel - 1];
    
    if (gameState.currentWave >= levelConfig.waves) {
      // Level complete
      gameState.score += 500;
      
      if (gameState.currentLevel >= 3) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      } else {
        gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
      }
    } else {
      // Wave complete
      gameState.score += 100;
      startNextWave();
    }
  }
}