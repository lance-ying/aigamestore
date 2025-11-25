// game_logic.js - Core game logic

import { gameState, WAVE_CONFIG, GROUND_Y, CANVAS_WIDTH } from './globals.js';
import { Wobbler } from './wobbler.js';

export function spawnPlayerUnit(type = 'basic') {
  const wobbler = new Wobbler(gameState.cursorX, GROUND_Y, 'player', type);
  gameState.entities.push(wobbler);
  return wobbler;
}

export function spawnEnemyUnit(type = 'basic') {
  const spawnX = CANVAS_WIDTH - 50 + Math.random() * 30 - 15;
  const wobbler = new Wobbler(spawnX, GROUND_Y, 'enemy', type);
  gameState.entities.push(wobbler);
  return wobbler;
}

export function updateWaveSpawning(frameCount) {
  if (gameState.currentWave >= WAVE_CONFIG.length) return;
  
  const wave = WAVE_CONFIG[gameState.currentWave];
  
  if (gameState.betweenWaves) {
    gameState.betweenWaveTimer++;
    if (gameState.betweenWaveTimer > 180) { // 3 seconds between waves
      gameState.betweenWaves = false;
      gameState.betweenWaveTimer = 0;
      gameState.waveEnemiesSpawned = 0;
      gameState.defeatedThisWave = 0;
      gameState.waveComplete = false;
    }
    return;
  }
  
  if (gameState.waveEnemiesSpawned < wave.enemyCount) {
    gameState.waveSpawnTimer++;
    if (gameState.waveSpawnTimer >= wave.spawnDelay) {
      let type = 'basic';
      if (wave.enemyType === 'mixed') {
        type = Math.random() < 0.3 ? 'strong' : 'basic';
      } else if (wave.enemyType === 'strong') {
        type = Math.random() < 0.5 ? 'strong' : 'basic';
      }
      
      spawnEnemyUnit(type);
      gameState.waveEnemiesSpawned++;
      gameState.waveSpawnTimer = 0;
    }
  } else {
    // Check if all enemies in wave are defeated
    const remainingEnemies = gameState.entities.filter(e => e.team === 'enemy' && e.alive).length;
    
    if (remainingEnemies === 0 && !gameState.waveComplete) {
      gameState.waveComplete = true;
      gameState.currentWave++;
      gameState.score += 500;
      
      if (gameState.currentWave >= WAVE_CONFIG.length) {
        // Victory!
        return;
      }
      
      gameState.betweenWaves = true;
    }
  }
}

export function updateEntities(frameCount) {
  // Update all wobblers
  for (let entity of gameState.entities) {
    entity.update(frameCount);
  }
  
  // Handle collisions between wobblers
  for (let i = 0; i < gameState.entities.length; i++) {
    for (let j = i + 1; j < gameState.entities.length; j++) {
      gameState.entities[i].handleCollision(gameState.entities[j]);
    }
  }
  
  // Combat logic
  const playerUnits = gameState.entities.filter(e => e.team === 'player' && e.alive);
  const enemyUnits = gameState.entities.filter(e => e.team === 'enemy' && e.alive);
  
  for (let player of playerUnits) {
    for (let enemy of enemyUnits) {
      const dx = enemy.getCenterX() - player.getCenterX();
      const dy = enemy.getCenterY() - player.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60) {
        if (player.attack(enemy)) {
          if (!enemy.alive) {
            gameState.score += enemy.type === 'strong' ? 100 : 50;
            gameState.totalEnemiesDefeated++;
            gameState.defeatedThisWave++;
          }
        }
        if (enemy.attack(player)) {
          // Player unit was hit
        }
      }
    }
  }
  
  // Remove dead entities after a delay
  gameState.entities = gameState.entities.filter(e => {
    if (!e.alive && e.getCenterY() > GROUND_Y + 50) {
      return false;
    }
    return true;
  });
  
  // Check lose condition - enemy reached player side
  for (let enemy of enemyUnits) {
    if (enemy.getCenterX() < 100 && enemy.alive) {
      return 'lose';
    }
  }
  
  // Check win condition
  if (gameState.currentWave >= WAVE_CONFIG.length && enemyUnits.length === 0) {
    return 'win';
  }
  
  return null;
}

export function updatePoints() {
  gameState.points += 15 / 60; // POINTS_PER_SECOND / 60 fps
}

export function resetGame() {
  gameState.entities = [];
  gameState.score = 0;
  gameState.points = 200;
  gameState.cursorX = 150;
  gameState.currentWave = 0;
  gameState.waveEnemiesSpawned = 0;
  gameState.waveSpawnTimer = 0;
  gameState.totalEnemiesDefeated = 0;
  gameState.defeatedThisWave = 0;
  gameState.waveComplete = false;
  gameState.betweenWaves = false;
  gameState.betweenWaveTimer = 0;
}