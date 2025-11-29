// waveManager.js - Wave and level management

import { gameState, getCurrentLevelConfig, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { spawnEnemy } from './enemies.js';

export function startWave() {
  const config = getCurrentLevelConfig();
  gameState.currentWave++;
  gameState.waveState = "COUNTDOWN";
  gameState.waveCountdownTimer = 180; // 3 seconds
  gameState.enemiesSpawnedThisWave = 0;
  gameState.enemiesToSpawnThisWave = config.enemiesPerWave[gameState.currentWave - 1] || 10;
  gameState.enemySpawnTimer = 0;
}

export function updateWaveState(p) {
  const config = getCurrentLevelConfig();
  
  if (gameState.waveState === "COUNTDOWN") {
    gameState.waveCountdownTimer--;
    if (gameState.waveCountdownTimer <= 0) {
      gameState.waveState = "ACTIVE";
    }
  } else if (gameState.waveState === "ACTIVE") {
    // Spawn enemies
    if (gameState.enemiesSpawnedThisWave < gameState.enemiesToSpawnThisWave) {
      gameState.enemySpawnTimer++;
      if (gameState.enemySpawnTimer >= 60) { // Spawn every second
        spawnEnemy(p);
        gameState.enemiesSpawnedThisWave++;
        gameState.enemySpawnTimer = 0;
      }
    }
    
    // Check if wave is complete
    if (gameState.enemiesSpawnedThisWave >= gameState.enemiesToSpawnThisWave && gameState.enemies.length === 0) {
      gameState.waveState = "COMPLETE";
      gameState.waveCompleteTimer = 120; // 2 seconds
    }
  } else if (gameState.waveState === "COMPLETE") {
    gameState.waveCompleteTimer--;
    if (gameState.waveCompleteTimer <= 0) {
      if (gameState.currentWave >= config.waves) {
        // Level complete
        if (gameState.currentLevel >= 3) {
          // Game won
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
          gameState.score += 100;
          gameState.score += gameState.baseHealth;
          gameState.score += Math.floor(gameState.currency * 0.1);
        } else {
          // Next level
          gameState.currentLevel++;
          initializeLevel();
        }
      } else {
        startWave();
      }
    }
  }
  
  // Check lose condition
  if (gameState.baseHealth <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
}

export function initializeLevel() {
  const config = getCurrentLevelConfig();
  gameState.currentWave = 0;
  gameState.totalWavesInLevel = config.waves;
  gameState.baseHealth = config.baseHp;
  gameState.maxBaseHealth = config.baseHp;
  gameState.currency = config.startCurrency;
  gameState.waveState = "COUNTDOWN";
  gameState.waveCountdownTimer = 180;
  
  // Clear entities
  gameState.units = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.activeBuffs = [];
  
  // Reinitialize grid
  const { initializeGrid } = require('./grid.js');
  initializeGrid();
  
  startWave();
}