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
    const total = Math.floor(8 * difficultyMultiplier);
    const basicCount = Math.floor(total * 0.7);
    const fastCount = total - basicCount; // Ensure they sum correctly
    config.totalEnemies = total;
    config.composition = [
      { type: 'BASIC', count: basicCount },
      { type: 'FAST', count: fastCount }
    ];
  } else if (waveNumber === 3) {
    const total = Math.floor(10 * difficultyMultiplier);
    const basicCount = Math.floor(total * 0.5);
    const fastCount = Math.floor(total * 0.3);
    const tankCount = total - basicCount - fastCount; // Ensure they sum correctly
    config.totalEnemies = total;
    config.composition = [
      { type: 'BASIC', count: basicCount },
      { type: 'FAST', count: fastCount },
      { type: 'TANK', count: tankCount }
    ];
  } else if (waveNumber === 4) {
    const total = Math.floor(12 * difficultyMultiplier);
    const basicCount = Math.floor(total * 0.4);
    const fastCount = Math.floor(total * 0.3);
    const tankCount = total - basicCount - fastCount; // Ensure they sum correctly
    config.totalEnemies = total;
    config.composition = [
      { type: 'BASIC', count: basicCount },
      { type: 'FAST', count: fastCount },
      { type: 'TANK', count: tankCount }
    ];
  } else if (waveNumber === 5) {
    const total = Math.floor(15 * difficultyMultiplier);
    const basicCount = Math.floor(total * 0.3);
    const fastCount = Math.floor(total * 0.3);
    const tankCount = Math.floor(total * 0.2);
    const eliteCount = total - basicCount - fastCount - tankCount; // Ensure they sum correctly
    config.totalEnemies = total;
    config.composition = [
      { type: 'BASIC', count: basicCount },
      { type: 'FAST', count: fastCount },
      { type: 'TANK', count: tankCount },
      { type: 'ELITE', count: eliteCount }
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