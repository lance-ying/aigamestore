// game_logic.js - Core game logic and state management

import { 
  gameState, 
  GRID_ROWS, 
  GRID_COLS,
  INITIAL_SUN,
  SUN_FALL_INTERVAL,
  ZOMBIE_WAVES,
  getGridPosition
} from './globals.js';
import { 
  BasicZombie, 
  ConeZombie, 
  BucketZombie,
  SunDrop 
} from './entities.js';

export function startGame() {
  gameState.gamePhase = "PLAYING";
  
  // Initialize game state
  gameState.sun = INITIAL_SUN;
  gameState.score = 0;
  gameState.currentWave = 0;
  gameState.zombiesSpawned = 0;
  gameState.zombiesKilled = 0;
  gameState.waveComplete = false;
  gameState.waveSpawnTimer = 0;
  gameState.sunFallTimer = SUN_FALL_INTERVAL;
  
  // Reset cooldowns
  gameState.plantCooldowns = {
    SUNFLOWER: 0,
    PEASHOOTER: 0,
    WALLNUT: 0,
    CHERRY_BOMB: 0
  };
  
  // Clear entities
  gameState.plants = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.plants[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.plants[row][col] = null;
    }
  }
  gameState.zombies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.sunDrops = [];
  gameState.entities = [];
  
  // Reset cursor
  gameState.cursorRow = 2;
  gameState.cursorCol = 4;
  gameState.selectedPlantIndex = -1;
  
  // Start first wave
  startWave(0);
}

export function resetGame() {
  gameState.gamePhase = "START";
  
  // Clear all entities
  gameState.plants = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.plants[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.plants[row][col] = null;
    }
  }
  gameState.zombies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.sunDrops = [];
  gameState.entities = [];
  
  gameState.sun = INITIAL_SUN;
  gameState.score = 0;
  gameState.currentWave = 0;
  gameState.zombiesSpawned = 0;
  gameState.zombiesKilled = 0;
  gameState.selectedPlantIndex = -1;
}

export function togglePause() {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
  }
}

export function updateGame(p) {
  // Update sun fall timer
  gameState.sunFallTimer--;
  if (gameState.sunFallTimer <= 0) {
    spawnSunFromSky();
    gameState.sunFallTimer = SUN_FALL_INTERVAL;
  }
  
  // Update cooldowns
  Object.keys(gameState.plantCooldowns).forEach(key => {
    if (gameState.plantCooldowns[key] > 0) {
      gameState.plantCooldowns[key]--;
    }
  });
  
  // Update wave spawning
  updateWaveSpawning();
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.active) {
      entity.update(p);
    }
  });
  
  // Check win condition
  checkWinCondition();
}

function startWave(waveIndex) {
  if (waveIndex >= ZOMBIE_WAVES.length) {
    // All waves complete - WIN!
    gameState.gamePhase = "GAME_OVER_WIN";
    return;
  }
  
  gameState.currentWave = waveIndex;
  gameState.zombiesSpawned = 0;
  gameState.zombiesKilled = 0;
  gameState.waveComplete = false;
  gameState.waveSpawnTimer = 0;
  
  const wave = ZOMBIE_WAVES[waveIndex];
  gameState.totalZombiesInWave = wave.count;
}

function updateWaveSpawning() {
  if (gameState.currentWave >= ZOMBIE_WAVES.length) return;
  if (gameState.waveComplete) return;
  
  const wave = ZOMBIE_WAVES[gameState.currentWave];
  
  if (gameState.zombiesSpawned < wave.count) {
    gameState.waveSpawnTimer++;
    
    if (gameState.waveSpawnTimer >= wave.interval) {
      spawnZombie(wave.types);
      gameState.zombiesSpawned++;
      gameState.waveSpawnTimer = 0;
    }
  } else {
    // All zombies spawned for this wave
    gameState.waveComplete = true;
  }
}

function spawnZombie(types) {
  // Random row
  const row = Math.floor(Math.random() * GRID_ROWS);
  
  // Random zombie type from available types
  const type = types[Math.floor(Math.random() * types.length)];
  
  let zombie;
  switch (type) {
    case 'BASIC':
      zombie = new BasicZombie(row);
      break;
    case 'CONE':
      zombie = new ConeZombie(row);
      break;
    case 'BUCKET':
      zombie = new BucketZombie(row);
      break;
    default:
      zombie = new BasicZombie(row);
  }
}

function spawnSunFromSky() {
  const x = Math.random() * 400 + 100;
  const sun = new SunDrop(x, -30, false);
  gameState.sunDrops.push(sun);
}

function checkWinCondition() {
  if (gameState.waveComplete && gameState.zombies.length === 0) {
    // Wave complete and all zombies dead
    if (gameState.currentWave < ZOMBIE_WAVES.length - 1) {
      // Start next wave
      startWave(gameState.currentWave + 1);
    } else {
      // All waves complete - WIN!
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }
}

export function getPlantCost(type) {
  const costs = {
    'SUNFLOWER': 50,
    'PEASHOOTER': 100,
    'WALLNUT': 50,
    'CHERRY_BOMB': 150
  };
  return costs[type] || 0;
}