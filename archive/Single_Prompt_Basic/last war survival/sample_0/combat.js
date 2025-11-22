// combat.js - Combat management

import { gameState, CANVAS_WIDTH, NUM_LANES, STATE_LEVEL_TRANSITION } from './globals.js';
import { LEVEL_CONFIG } from './config.js';
import { Zombie, Obstacle } from './entities.js';

export function initCombat() {
  // Clear entities
  gameState.heroes = [];
  gameState.zombies = [];
  gameState.obstacles = [];
  gameState.projectiles = [];
  gameState.effects = [];
  
  // Get level config
  const levelData = LEVEL_CONFIG[gameState.currentLevel - 1];
  gameState.totalWaves = levelData.waves.length;
  gameState.currentWave = 0;
  gameState.waveCompleted = false;
  gameState.levelCompleted = false;
  
  // Start first wave
  startNextWave();
}

export function startNextWave() {
  gameState.currentWave++;
  gameState.waveCompleted = false;
  gameState.zombiesSpawnedThisWave = 0;
  
  const levelData = LEVEL_CONFIG[gameState.currentLevel - 1];
  const waveData = levelData.waves[gameState.currentWave - 1];
  
  // Calculate total zombies
  gameState.zombiesToSpawnThisWave = 0;
  for (const zombieType of waveData.zombies) {
    gameState.zombiesToSpawnThisWave += zombieType.count;
  }
  
  // Spawn obstacles
  for (const obstacleData of waveData.obstacles) {
    const obstacle = new Obstacle(obstacleData.type, obstacleData.lane);
    gameState.obstacles.push(obstacle);
  }
  
  // Store wave data for spawning
  gameState.currentWaveData = waveData;
  gameState.spawnTimer = 0;
  gameState.zombiesQueue = [];
  
  // Build spawn queue
  for (const zombieType of waveData.zombies) {
    for (let i = 0; i < zombieType.count; i++) {
      gameState.zombiesQueue.push(zombieType.type);
    }
  }
  
  // Shuffle queue
  for (let i = gameState.zombiesQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gameState.zombiesQueue[i], gameState.zombiesQueue[j]] = [gameState.zombiesQueue[j], gameState.zombiesQueue[i]];
  }
}

export function updateCombat(p) {
  // Spawn zombies over time
  if (gameState.zombiesQueue && gameState.zombiesQueue.length > 0) {
    gameState.spawnTimer++;
    
    if (gameState.spawnTimer >= 120) { // Spawn every 2 seconds
      gameState.spawnTimer = 0;
      const zombieType = gameState.zombiesQueue.shift();
      const lane = Math.floor(Math.random() * NUM_LANES);
      const zombie = new Zombie(zombieType, lane);
      gameState.zombies.push(zombie);
      gameState.zombiesSpawnedThisWave++;
    }
  }
  
  // Update entities
  for (const hero of gameState.heroes) {
    hero.update(p);
  }
  
  for (const zombie of gameState.zombies) {
    zombie.update(p);
  }
  
  for (const projectile of gameState.projectiles) {
    projectile.update();
  }
  
  for (const effect of gameState.effects) {
    effect.update();
  }
  
  // Remove dead/expired entities
  gameState.heroes = gameState.heroes.filter(h => !h.isDead);
  gameState.zombies = gameState.zombies.filter(z => !z.isDead && !z.reachedBase);
  gameState.obstacles = gameState.obstacles.filter(o => !o.destroyed);
  gameState.projectiles = gameState.projectiles.filter(pr => pr.life > 0);
  gameState.effects = gameState.effects.filter(e => e.life > 0);
  
  // Update cooldowns
  for (const heroType in gameState.heroCooldowns) {
    if (gameState.heroCooldowns[heroType] > 0) {
      gameState.heroCooldowns[heroType]--;
    }
  }
  
  // Check wave completion
  if (!gameState.waveCompleted && 
      gameState.zombiesSpawnedThisWave === gameState.zombiesToSpawnThisWave &&
      gameState.zombiesQueue.length === 0 &&
      gameState.zombies.length === 0) {
    
    gameState.waveCompleted = true;
    gameState.score += 100;
    
    // Check level completion
    if (gameState.currentWave >= gameState.totalWaves) {
      completeLevel();
    } else {
      // Start next wave after delay
      setTimeout(() => {
        if (gameState.gameSubState === 'COMBAT') {
          startNextWave();
        }
      }, 2000);
    }
  }
  
  // Check game over
  if (gameState.baseHP <= 0) {
    gameState.gameSubState = 'GAME_OVER_LOSE';
    gameState.gamePhase = 'GAME_OVER';
  }
}

export function completeLevel() {
  gameState.levelCompleted = true;
  gameState.score += 500;
  
  // Bonus for base HP
  const hpPercent = gameState.baseHP / gameState.maxBaseHP;
  if (hpPercent > 0.8) {
    gameState.score += 200;
  }
  
  // Award resources
  const levelData = LEVEL_CONFIG[gameState.currentLevel - 1];
  gameState.gold += levelData.rewards.gold;
  gameState.supplies += levelData.rewards.supplies;
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('lastWarHighScore', gameState.highScore);
  }
  
  // Check if won game
  if (gameState.currentLevel >= 5) {
    gameState.gameSubState = 'GAME_OVER_WIN';
    gameState.gamePhase = 'GAME_OVER';
  } else {
    // Go to level transition
    gameState.gameSubState = STATE_LEVEL_TRANSITION;
    gameState.transitionTimer = 180; // 3 seconds
    gameState.currentLevel++;
  }
}