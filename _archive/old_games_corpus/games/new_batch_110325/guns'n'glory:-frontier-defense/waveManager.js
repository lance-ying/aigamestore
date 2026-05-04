// waveManager.js - Manage enemy waves

import { gameState, ENEMY_SETTLER, ENEMY_STAGECOACH, ENEMY_SPECIAL } from './globals.js';
import { Enemy } from './entities.js';

export function startWave() {
  gameState.wave++;
  gameState.waveTimer = gameState.waveDelay;
  gameState.enemiesSpawned = 0;
  
  // Increase difficulty with waves
  const baseEnemies = 10 + (gameState.wave - 1) * 3;
  gameState.enemiesPerWave = baseEnemies;
}

export function updateWave(p) {
  if (gameState.wave === 0) {
    startWave();
    return;
  }
  
  gameState.waveTimer--;
  
  // Spawn enemies at intervals
  if (gameState.waveTimer > 0 && gameState.waveTimer % 15 === 0) {
    if (gameState.enemiesSpawned < gameState.enemiesPerWave) {
      spawnEnemy(p);
      gameState.enemiesSpawned++;
    }
  }
  
  // Check if wave is complete
  if (gameState.enemiesSpawned >= gameState.enemiesPerWave && 
      gameState.enemies.filter(e => !e.dead && !e.escaped).length === 0) {
    
    if (gameState.wave >= gameState.maxWaves) {
      // Level complete
      if (gameState.level >= 3) {
        // Game won!
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_WIN", reason: "All levels completed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Next level
        gameState.level++;
        gameState.wave = 0;
        gameState.gold += 100; // Bonus gold for completing level
        startWave();
      }
    } else {
      // Next wave
      startWave();
    }
  }
}

function spawnEnemy(p) {
  const rand = p.random();
  let enemyType;
  
  // Wave-based enemy composition
  if (gameState.wave <= 2) {
    enemyType = rand < 0.8 ? ENEMY_SETTLER : ENEMY_STAGECOACH;
  } else if (gameState.wave <= 4) {
    enemyType = rand < 0.5 ? ENEMY_SETTLER : rand < 0.85 ? ENEMY_STAGECOACH : ENEMY_SPECIAL;
  } else {
    enemyType = rand < 0.3 ? ENEMY_SETTLER : rand < 0.7 ? ENEMY_STAGECOACH : ENEMY_SPECIAL;
  }
  
  const enemy = new Enemy(enemyType, gameState.paths);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}

export function renderWaveInfo(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level: ${gameState.level} | Wave: ${gameState.wave}/${gameState.maxWaves}`, 10, 10);
  p.text(`Gold: ${gameState.gold} | Score: ${gameState.score}`, 10, 30);
  p.text(`Escaped: ${gameState.escapedEnemies}/10`, 10, 50);
  
  // Wave timer
  if (gameState.waveTimer > 0 && gameState.enemiesSpawned < gameState.enemiesPerWave) {
    p.fill(200, 200, 100);
    p.text(`Next spawn in: ${Math.ceil(gameState.waveTimer / 60)}s`, 10, 70);
  }
  
  p.pop();
}