// spawning.js - Enemy and power-up spawning system

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONSTANTS } from './globals.js';
import { Enemy, PowerUp } from './entities.js';

export function updateSpawning() {
  gameState.enemySpawnTimer++;
  gameState.powerupSpawnTimer++;
  
  // Spawn enemies
  if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
    spawnEnemy();
    gameState.enemySpawnTimer = 0;
    
    // Increase difficulty over time
    gameState.difficultyMultiplier += 0.02;
    gameState.enemySpawnInterval = Math.max(
      GAME_CONSTANTS.ENEMY_MIN_SPAWN_INTERVAL,
      GAME_CONSTANTS.ENEMY_SPAWN_INTERVAL - (gameState.waveNumber * 5)
    );
  }
  
  // Spawn power-ups
  if (gameState.powerupSpawnTimer >= GAME_CONSTANTS.POWERUP_SPAWN_INTERVAL) {
    spawnPowerUp();
    gameState.powerupSpawnTimer = 0;
  }
}

function spawnEnemy() {
  // Choose random spawn side
  const side = Math.floor(Math.random() * 4);
  let x, y;
  
  switch (side) {
    case 0: // Top
      x = Math.random() * CANVAS_WIDTH;
      y = -30;
      break;
    case 1: // Right
      x = CANVAS_WIDTH + 30;
      y = Math.random() * CANVAS_HEIGHT;
      break;
    case 2: // Bottom
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT + 30;
      break;
    case 3: // Left
      x = -30;
      y = Math.random() * CANVAS_HEIGHT;
      break;
  }
  
  new Enemy(x, y);
}

function spawnPowerUp() {
  const margin = 50;
  const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
  const y = margin + Math.random() * (CANVAS_HEIGHT - margin * 2);
  
  new PowerUp(x, y);
}

export function spawnInitialEnemies(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnEnemy(), i * 500);
  }
}