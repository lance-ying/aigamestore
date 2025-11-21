// spawner.js - Enemy and merchant spawning logic

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Enemy, ENEMY_TYPES, Merchant } from './entities.js';

export function updateSpawning(p) {
  const currentTime = Date.now();
  
  // Update difficulty
  updateDifficulty();
  
  // Spawn enemies
  if (currentTime - gameState.lastEnemySpawnTime > gameState.enemySpawnRate) {
    spawnEnemy(p);
    gameState.lastEnemySpawnTime = currentTime;
  }
  
  // Spawn merchant
  if (!gameState.merchant && currentTime - gameState.lastMerchantSpawnTime > gameState.merchantSpawnInterval) {
    spawnMerchant();
    gameState.lastMerchantSpawnTime = currentTime;
  }
  
  // Update merchant
  if (gameState.merchant) {
    gameState.merchant.update(p);
    if (!gameState.merchant.active) {
      gameState.merchant = null;
    }
  }
}

function updateDifficulty() {
  const survivalSeconds = (Date.now() - gameState.gameStartTime) / 1000;
  gameState.survivalTime = survivalSeconds;
  
  // Increase difficulty every 30 seconds
  const newDifficultyLevel = Math.floor(survivalSeconds / 30) + 1;
  
  if (newDifficultyLevel > gameState.difficultyLevel) {
    gameState.difficultyLevel = newDifficultyLevel;
    
    // Decrease spawn rate (faster spawning)
    gameState.enemySpawnRate = Math.max(500, 2000 - (gameState.difficultyLevel * 150));
  }
}

function spawnEnemy(p) {
  // Select enemy type based on difficulty
  let enemyTypeIndex = 0;
  
  if (gameState.difficultyLevel >= 5) {
    enemyTypeIndex = Math.floor(p.random(0, 5));
  } else if (gameState.difficultyLevel >= 4) {
    enemyTypeIndex = Math.floor(p.random(0, 4));
  } else if (gameState.difficultyLevel >= 3) {
    enemyTypeIndex = Math.floor(p.random(0, 3));
  } else if (gameState.difficultyLevel >= 2) {
    enemyTypeIndex = Math.floor(p.random(0, 2));
  }
  
  const enemyType = ENEMY_TYPES[enemyTypeIndex];
  
  // Spawn from sides
  const spawnX = p.random() < 0.5 ? 0 : CANVAS_WIDTH;
  const spawnY = CANVAS_HEIGHT - 80;
  
  const enemy = new Enemy(enemyType, spawnX, spawnY, p);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}

function spawnMerchant() {
  const merchantX = CANVAS_WIDTH / 2;
  const merchantY = CANVAS_HEIGHT - 80;
  
  gameState.merchant = new Merchant(merchantX, merchantY);
}

export function cleanupDeadEnemies() {
  gameState.enemies = gameState.enemies.filter(enemy => enemy.alive);
  gameState.entities = gameState.entities.filter(entity => {
    if (entity instanceof Enemy) {
      return entity.alive;
    }
    return true;
  });
}