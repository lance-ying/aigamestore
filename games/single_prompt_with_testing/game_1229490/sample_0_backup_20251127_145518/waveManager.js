import { gameState, MAX_ENEMIES_PER_WAVE, TOTAL_WAVES, ARENA_SIZE, logGameInfo } from './globals.js';
import { Enemy } from './entities.js';

// Initialize wave system
export function initWaveSystem() {
  gameState.currentWave = 0;
  gameState.enemiesKilledThisWave = 0;
  gameState.enemiesSpawnedThisWave = 0;
  gameState.waveSpawnTimer = 0;
  
  // Initialize style system
  gameState.styleCombo = 0;
  gameState.stylePoints = 0;
  gameState.lastKillTime = 0;
  gameState.currentStyleRank = 'D';
  
  // Define style thresholds
  gameState.styleRanks = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'ULTRAKILL'];
  gameState.styleThresholds = [0, 500, 1000, 2000, 3500, 5000, 7500, 10000];
}

// Update wave system
export function updateWaveSystem(deltaTime) {
  // Check if current wave is complete
  if (gameState.currentWave > 0) {
    const waveSize = getWaveSize(gameState.currentWave);
    
    if (gameState.enemiesKilledThisWave >= waveSize && gameState.enemies.length === 0) {
      // Wave complete
      if (gameState.currentWave >= TOTAL_WAVES) {
        // All waves complete - victory!
        gameState.gamePhase = "GAME_OVER_WIN";
        logGameInfo("GAME_OVER_WIN", {
          score: gameState.score,
          rank: gameState.currentStyleRank,
          enemiesKilled: gameState.totalEnemiesKilled
        });
        return;
      } else {
        // Start next wave
        startNextWave();
      }
    }
  }
  
  // Spawn enemies for current wave
  if (gameState.currentWave > 0) {
    gameState.waveSpawnTimer += deltaTime;
    
    const waveSize = getWaveSize(gameState.currentWave);
    const spawnInterval = getSpawnInterval(gameState.currentWave);
    
    if (gameState.waveSpawnTimer >= spawnInterval && 
        gameState.enemiesSpawnedThisWave < waveSize) {
      spawnEnemy();
      gameState.waveSpawnTimer = 0;
    }
  }
}

// Start first wave
export function startFirstWave() {
  gameState.currentWave = 1;
  gameState.enemiesKilledThisWave = 0;
  gameState.enemiesSpawnedThisWave = 0;
  gameState.waveSpawnTimer = 0;
  
  logGameInfo("WAVE_START", { wave: gameState.currentWave });
}

// Start next wave
function startNextWave() {
  gameState.currentWave++;
  gameState.enemiesKilledThisWave = 0;
  gameState.enemiesSpawnedThisWave = 0;
  gameState.waveSpawnTimer = 0;
  
  logGameInfo("WAVE_START", { wave: gameState.currentWave });
}

// Get wave size
function getWaveSize(wave) {
  return Math.min(5 + wave * 2, MAX_ENEMIES_PER_WAVE);
}

// Get spawn interval
function getSpawnInterval(wave) {
  return Math.max(1.0 - wave * 0.1, 0.3);
}

// Spawn a single enemy
function spawnEnemy() {
  // Random position around arena perimeter
  const angle = Math.random() * Math.PI * 2;
  const distance = ARENA_SIZE / 2 - 2;
  
  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  const y = 2;
  
  const enemy = new Enemy(x, y, z);
  gameState.enemies.push(enemy);
  gameState.enemiesSpawnedThisWave++;
}