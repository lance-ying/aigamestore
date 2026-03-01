// game_logic.js - Core game logic and systems

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_CONSTANTS,
  ENEMY_TYPES,
  randomChoice,
  randomRange,
  randomInt,
} from './globals.js';

import { Player, Enemy } from './entities.js';
import { updateParticles } from './particles.js';

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

export function initGame() {
  // Create player at center
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Reset timers
  gameState.enemySpawnTimer = 0;
  gameState.gameTime = 0;
}

// ============================================================================
// GAME UPDATE LOOP
// ============================================================================

export function updateGame(p) {
  // Update game time
  gameState.gameTime += 1 / 60;
  gameState.stats.survivalTime = gameState.gameTime;
  
  // Update difficulty
  updateDifficulty();
  
  // Spawn enemies
  updateEnemySpawning();
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update all entities
  gameState.projectiles.forEach(projectile => projectile.update(p));
  gameState.enemies.forEach(enemy => enemy.update(p));
  gameState.powerups.forEach(powerup => powerup.update(p));
  
  // Update particles
  updateParticles();
  
  // Update camera shake
  if (gameState.cameraShake > 0) {
    gameState.cameraShake *= 0.9;
    if (gameState.cameraShake < 0.1) {
      gameState.cameraShake = 0;
      gameState.cameraX = 0;
      gameState.cameraY = 0;
    } else {
      gameState.cameraX = (Math.random() - 0.5) * gameState.cameraShake;
      gameState.cameraY = (Math.random() - 0.5) * gameState.cameraShake;
    }
  }
  
  // Decay score multiplier
  gameState.scoreMultiplier *= GAME_CONSTANTS.SCORE_MULTIPLIER_DECAY;
  if (gameState.scoreMultiplier < 1) {
    gameState.scoreMultiplier = 1;
  }
  
  // Check win condition (optional - survive for X time or kill Y enemies)
  // For endless mode, there is no win condition
}

// ============================================================================
// DIFFICULTY SCALING
// ============================================================================

export function updateDifficulty() {
  // Increase difficulty over time
  gameState.enemySpawnRate *= GAME_CONSTANTS.ENEMY_DIFFICULTY_INCREASE;
  gameState.enemySpawnRate = Math.max(
    GAME_CONSTANTS.ENEMY_MIN_SPAWN_RATE,
    gameState.enemySpawnRate
  );
  
  // Increase enemy stats gradually
  const timeFactor = gameState.gameTime / 60; // Minutes
  gameState.enemySpeedMultiplier = 1 + timeFactor * 0.1;
  gameState.enemyHealthMultiplier = 1 + timeFactor * 0.15;
  
  // Update difficulty level for display
  gameState.difficultyLevel = Math.floor(1 + timeFactor);
}

// ============================================================================
// ENEMY SPAWNING
// ============================================================================

export function updateEnemySpawning() {
  gameState.enemySpawnTimer++;
  
  if (gameState.enemySpawnTimer >= gameState.enemySpawnRate) {
    spawnEnemy();
    gameState.enemySpawnTimer = 0;
  }
}

export function spawnEnemy() {
  // Choose spawn position at screen edge
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
  
  // Choose enemy type based on difficulty
  let type;
  const rand = Math.random();
  const difficulty = gameState.difficultyLevel;
  
  if (difficulty < 2) {
    type = ENEMY_TYPES.BASIC;
  } else if (difficulty < 4) {
    if (rand < 0.7) type = ENEMY_TYPES.BASIC;
    else if (rand < 0.9) type = ENEMY_TYPES.FAST;
    else type = ENEMY_TYPES.SHOOTER;
  } else if (difficulty < 6) {
    if (rand < 0.5) type = ENEMY_TYPES.BASIC;
    else if (rand < 0.7) type = ENEMY_TYPES.FAST;
    else if (rand < 0.85) type = ENEMY_TYPES.TANK;
    else type = ENEMY_TYPES.SHOOTER;
  } else {
    if (rand < 0.4) type = ENEMY_TYPES.BASIC;
    else if (rand < 0.6) type = ENEMY_TYPES.FAST;
    else if (rand < 0.8) type = ENEMY_TYPES.TANK;
    else type = ENEMY_TYPES.SHOOTER;
  }
  
  new Enemy(x, y, type);
}

// ============================================================================
// GAME STATE QUERIES
// ============================================================================

export function isGameActive() {
  return gameState.gamePhase === "PLAYING";
}

export function isGameOver() {
  return gameState.gamePhase === "GAME_OVER_WIN" || 
         gameState.gamePhase === "GAME_OVER_LOSE";
}