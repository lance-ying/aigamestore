// wave.js - Wave management
import { gameState } from './globals.js';
import { Enemy, generateWaveEnemies } from './enemies.js';

export function updateWaves(p) {
  if (gameState.waveState === 'COUNTDOWN') {
    gameState.waveTimer--;
    if (gameState.waveTimer <= 0) {
      startWave(p);
    }
  } else if (gameState.waveState === 'ACTIVE') {
    // Spawn enemies
    if (gameState.enemiesToSpawn.length > 0) {
      gameState.enemySpawnTimer--;
      
      while (gameState.enemiesToSpawn.length > 0 && gameState.enemiesToSpawn[0].delay <= 0) {
        const enemyData = gameState.enemiesToSpawn.shift();
        const enemy = new Enemy(enemyData.type, gameState.level, p);
        gameState.enemies.push(enemy);
      }
      
      // Decrement delays
      for (const enemyData of gameState.enemiesToSpawn) {
        enemyData.delay--;
      }
    }
    
    // Check if wave complete
    if (gameState.enemiesToSpawn.length === 0 && gameState.enemies.length === 0) {
      waveComplete(p);
    }
  } else if (gameState.waveState === 'COMPLETE') {
    gameState.waveTimer--;
    if (gameState.waveTimer <= 0) {
      if (gameState.currentWave >= gameState.totalWaves) {
        levelComplete(p);
      } else {
        gameState.waveState = 'COUNTDOWN';
        gameState.waveTimer = 180;
      }
    }
  }
}

function startWave(p) {
  gameState.currentWave++;
  gameState.waveState = 'ACTIVE';
  
  const enemyList = generateWaveEnemies(gameState.level, gameState.currentWave, gameState.totalWaves);
  gameState.enemiesToSpawn = enemyList;
  gameState.enemySpawnTimer = 0;
}

function waveComplete(p) {
  gameState.waveState = 'COMPLETE';
  gameState.waveTimer = 120; // 2 seconds
}

function levelComplete(p) {
  // Bonus points
  gameState.score += 100; // Level complete bonus
  gameState.score += gameState.baseHealth; // HP bonus
  gameState.score += Math.floor(gameState.currency * 0.1); // Currency bonus
  
  if (gameState.level >= 3) {
    // Game complete!
    gameState.gamePhase = 'GAME_OVER';
    gameState.gameOverReason = 'WIN';
    
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER', reason: 'WIN', score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Next level
    gameState.level++;
    initLevel(p);
  }
}

function initLevel(p) {
  const { initLevel: initLevelFunc } = require('./input.js');
  // This is handled in input.js
}