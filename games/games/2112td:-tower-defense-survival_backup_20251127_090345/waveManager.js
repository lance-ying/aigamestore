import { gameState, ENEMY_TYPES, MAPS } from './globals.js';
import { Enemy } from './entities.js';

export function startWave() {
  gameState.wave++;
  gameState.waveActive = true;
  gameState.waveEnemiesSpawned = 0;
  gameState.waveSpawnTimer = 0;
  
  const waveConfig = generateWaveConfig(gameState.wave, gameState.currentMap);
  gameState.waveEnemiesTotal = waveConfig.totalEnemies;
  gameState.currentWaveConfig = waveConfig;
}

function generateWaveConfig(waveNumber, mapKey) {
  const config = {
    totalEnemies: 0,
    spawnInterval: 60,
    composition: []
  };
  
  // Base difficulty on map
  let difficultyMultiplier = 1;
  if (mapKey === "MEDIUM") {
    difficultyMultiplier = 1.3;
  } else if (mapKey === "HARD") {
    difficultyMultiplier = 1.6;
  }
  
  // Wave progression within the map (1-5)
  if (waveNumber === 1) {
    config.totalEnemies = Math.floor(5 * difficultyMultiplier);
    config.composition = [
      { type: 'BASIC', count: config.totalEnemies }
    ];
  } else if (waveNumber === 2) {
    config.totalEnemies = Math.floor(8 * difficultyMultiplier);
    config.composition = [
      { type: 'BASIC', count: Math.floor(config.totalEnemies * 0.7) },
      { type: 'FAST', count: Math.floor(config.totalEnemies * 0.3) }
    ];
  } else if (waveNumber === 3) {
    config.totalEnemies = Math.floor(10 * difficultyMultiplier);
    config.composition = [
      { type: 'BASIC', count: Math.floor(config.totalEnemies * 0.5) },
      { type: 'FAST', count: Math.floor(config.totalEnemies * 0.3) },
      { type: 'TANK', count: Math.floor(config.totalEnemies * 0.2) }
    ];
  } else if (waveNumber === 4) {
    config.totalEnemies = Math.floor(12 * difficultyMultiplier);
    config.composition = [
      { type: 'BASIC', count: Math.floor(config.totalEnemies * 0.4) },
      { type: 'FAST', count: Math.floor(config.totalEnemies * 0.3) },
      { type: 'TANK', count: Math.floor(config.totalEnemies * 0.3) }
    ];
  } else if (waveNumber === 5) {
    config.totalEnemies = Math.floor(15 * difficultyMultiplier);
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
      
      const maxWaves = MAPS[gameState.currentMap].maxWaves;
      if (gameState.wave >= maxWaves) {
        gameState.gamePhase = "MAP_COMPLETE";
        p.logs.game_info.push({
          data: { phase: "MAP_COMPLETE", wave: gameState.wave, map: gameState.currentMap },
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

export function canStartWave() {
  if (gameState.waveActive) return false;
  if (gameState.enemies.length > 0) return false;
  const maxWaves = MAPS[gameState.currentMap].maxWaves;
  if (gameState.wave >= maxWaves) return false;
  return true;
}