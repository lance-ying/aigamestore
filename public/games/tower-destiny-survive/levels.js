// levels.js - Level and wave management
import { gameState, GAME_PHASES } from './globals.js';
import { Zombie, PowerUp } from './entities.js';

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
  gameState.powerups = [];
  
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
  
  // Spawn from random side
  const spawnFromLeft = Math.random() < 0.5;
  const x = spawnFromLeft ? 10 : 590;
  
  // Fixed y position - aligned with bullet firing height
  // Tower is at y=320 with height 60, so top is at 260
  // Bullets fire from y=250, so zombies should spawn at y=250
  const y = 250;
  
  const zombie = new Zombie(x, y, type, gameState.currentLevel, !spawnFromLeft);
  gameState.zombies.push(zombie);
  gameState.entities.push(zombie);
  
  // Store original zombie count for power-up drops
  zombie.dropPowerUp = Math.random() < 0.3; // 30% chance to drop power-up
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

// Called when a zombie is killed to potentially spawn power-ups
export function spawnPowerUpFromZombie(p, x, y) {
  if (Math.random() < 0.3) { // 30% chance
    const powerUpTypes = ["health", "energy", "damage"];
    const weights = [0.4, 0.4, 0.2]; // Health and energy more common
    
    let roll = Math.random();
    let type = "health";
    let cumulative = 0;
    
    for (let i = 0; i < powerUpTypes.length; i++) {
      cumulative += weights[i];
      if (roll < cumulative) {
        type = powerUpTypes[i];
        break;
      }
    }
    
    const powerup = new PowerUp(x, y, type);
    gameState.powerups.push(powerup);
  }
}