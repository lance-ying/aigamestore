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
  
  // Calculate total enemies based on wave and difficulty
  const baseEnemies = 5 + (waveNumber * 2);
  config.totalEnemies = Math.floor(baseEnemies * difficultyMultiplier);
  const total = config.totalEnemies;
  
  // Wave composition based on map difficulty
  if (mapKey === "EASY") {
    if (waveNumber === 1) {
      config.composition = [{ type: 'BASIC', count: total }];
    } else if (waveNumber === 2) {
      const fast = Math.floor(total * 0.3);
      config.composition = [{ type: 'BASIC', count: total - fast }, { type: 'FAST', count: fast }];
    } else if (waveNumber === 3) {
      const tank = Math.floor(total * 0.2);
      const fast = Math.floor(total * 0.3);
      config.composition = [{ type: 'BASIC', count: total - tank - fast }, { type: 'FAST', count: fast }, { type: 'TANK', count: tank }];
    } else if (waveNumber === 4) {
      const tank = Math.floor(total * 0.3);
      const fast = Math.floor(total * 0.3);
      config.composition = [{ type: 'BASIC', count: total - tank - fast }, { type: 'FAST', count: fast }, { type: 'TANK', count: tank }];
    } else {
      const elite = Math.floor(total * 0.1);
      const tank = Math.floor(total * 0.3);
      const fast = Math.floor(total * 0.3);
      config.composition = [{ type: 'BASIC', count: total - elite - tank - fast }, { type: 'FAST', count: fast }, { type: 'TANK', count: tank }, { type: 'ELITE', count: elite }];
    }
  } else if (mapKey === "MEDIUM") {
    // Medium: Introduce tougher enemies earlier
    if (waveNumber === 1) {
      const fast = Math.floor(total * 0.4);
      config.composition = [{ type: 'BASIC', count: total - fast }, { type: 'FAST', count: fast }];
    } else if (waveNumber === 2) {
      const tank = Math.floor(total * 0.2);
      const fast = Math.floor(total * 0.4);
      config.composition = [{ type: 'BASIC', count: total - tank - fast }, { type: 'FAST', count: fast }, { type: 'TANK', count: tank }];
    } else if (waveNumber === 3) {
      const elite = Math.floor(total * 0.1);
      const tank = Math.floor(total * 0.3);
      config.composition = [{ type: 'FAST', count: total - elite - tank }, { type: 'TANK', count: tank }, { type: 'ELITE', count: elite }];
    } else if (waveNumber === 4) {
      const mech = Math.floor(total * 0.1);
      const elite = Math.floor(total * 0.2);
      const tank = Math.floor(total * 0.3);
      config.composition = [{ type: 'FAST', count: total - mech - elite - tank }, { type: 'TANK', count: tank }, { type: 'ELITE', count: elite }, { type: 'MECH', count: mech }];
    } else {
      const mech = Math.floor(total * 0.2);
      const elite = Math.floor(total * 0.3);
      const tank = Math.floor(total * 0.3);
      config.composition = [{ type: 'FAST', count: total - mech - elite - tank }, { type: 'TANK', count: tank }, { type: 'ELITE', count: elite }, { type: 'MECH', count: mech }];
    }
  } else if (mapKey === "HARD") {
    // Hard: High difficulty from the start, heavy use of Elite and Mech
    if (waveNumber === 1) {
      const fast = Math.floor(total * 0.8);
      config.composition = [{ type: 'BASIC', count: total - fast }, { type: 'FAST', count: fast }];
    } else if (waveNumber === 2) {
      const tank = Math.floor(total * 0.4);
      config.composition = [{ type: 'FAST', count: total - tank }, { type: 'TANK', count: tank }];
    } else if (waveNumber === 3) {
      const elite = Math.floor(total * 0.3);
      const tank = Math.floor(total * 0.4);
      config.composition = [{ type: 'FAST', count: total - elite - tank }, { type: 'TANK', count: tank }, { type: 'ELITE', count: elite }];
    } else if (waveNumber === 4) {
      const mech = Math.floor(total * 0.2);
      const elite = Math.floor(total * 0.4);
      config.composition = [{ type: 'TANK', count: total - mech - elite }, { type: 'ELITE', count: elite }, { type: 'MECH', count: mech }];
    } else {
      const mech = Math.floor(total * 0.4);
      const elite = Math.floor(total * 0.4);
      config.composition = [{ type: 'TANK', count: total - mech - elite }, { type: 'ELITE', count: elite }, { type: 'MECH', count: mech }];
    }
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
    
    // Map difficulty multipliers
    let mapHealthMult = 1;
    let mapSpeedMult = 1;
    
    if (gameState.currentMap === "MEDIUM") {
      mapHealthMult = 1.5;
      mapSpeedMult = 1.2;
    } else if (gameState.currentMap === "HARD") {
      mapHealthMult = 2.0;
      mapSpeedMult = 1.4;
    }
    
    const finalHealthMult = waveMultiplier * mapHealthMult;
    
    const enemy = new Enemy(typeToSpawn, gameState.path, finalHealthMult, mapSpeedMult);
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