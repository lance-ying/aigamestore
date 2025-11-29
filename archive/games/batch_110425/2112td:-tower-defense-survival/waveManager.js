import { gameState, ENEMY_TYPES } from './globals.js';
import { Enemy } from './entities.js';

export function startWave() {
  gameState.wave++;
  gameState.waveActive = true;
  gameState.waveEnemiesSpawned = 0;
  gameState.waveSpawnTimer = 0;
  
  const waveConfig = generateWaveConfig(gameState.wave);
  gameState.waveEnemiesTotal = waveConfig.totalEnemies;
  gameState.currentWaveConfig = waveConfig;
}

function generateWaveConfig(waveNumber) {
  const config = {
    totalEnemies: 0,
    spawnInterval: 60,
    composition: []
  };
  
  if (waveNumber <= 2) {
    config.totalEnemies = 5 + waveNumber * 2;
    config.composition = [
      { type: 'BASIC', count: config.totalEnemies }
    ];
  } else if (waveNumber <= 4) {
    config.totalEnemies = 8 + waveNumber * 2;
    config.composition = [
      { type: 'BASIC', count: Math.floor(config.totalEnemies * 0.6) },
      { type: 'FAST', count: Math.floor(config.totalEnemies * 0.4) }
    ];
  } else if (waveNumber <= 7) {
    config.totalEnemies = 10 + waveNumber * 2;
    config.composition = [
      { type: 'BASIC', count: Math.floor(config.totalEnemies * 0.4) },
      { type: 'FAST', count: Math.floor(config.totalEnemies * 0.4) },
      { type: 'TANK', count: Math.floor(config.totalEnemies * 0.2) }
    ];
  } else {
    config.totalEnemies = 12 + waveNumber * 3;
    config.composition = [
      { type: 'BASIC', count: Math.floor(config.totalEnemies * 0.3) },
      { type: 'FAST', count: Math.floor(config.totalEnemies * 0.3) },
      { type: 'TANK', count: Math.floor(config.totalEnemies * 0.2) },
      { type: 'ELITE', count: Math.floor(config.totalEnemies * 0.2) }
    ];
  }
  
  return config;
}

export function updateWaveSpawning(p) {
  if (!gameState.waveActive) return;
  
  if (gameState.waveEnemiesSpawned < gameState.waveEnemiesTotal) {
    gameState.waveSpawnTimer--;
    
    if (gameState.waveSpawnTimer <= 0) {
      spawnNextEnemy(p);
      gameState.waveSpawnTimer = gameState.currentWaveConfig.spawnInterval;
    }
  } else {
    if (gameState.enemies.length === 0) {
      gameState.waveActive = false;
      
      if (gameState.wave >= 10) {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_WIN", wave: gameState.wave },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

function spawnNextEnemy(p) {
  const config = gameState.currentWaveConfig;
  let typeToSpawn = null;
  
  for (const comp of config.composition) {
    if (comp.count > 0) {
      typeToSpawn = comp.type;
      comp.count--;
      break;
    }
  }
  
  if (typeToSpawn) {
    const waveMultiplier = 1 + (gameState.wave - 1) * 0.15;
    const enemy = new Enemy(typeToSpawn, gameState.path, waveMultiplier);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
    gameState.waveEnemiesSpawned++;
  }
}

export function checkWaveStart() {
  if (!gameState.waveActive && gameState.enemies.length === 0 && gameState.wave < 10) {
    return true;
  }
  return false;
}