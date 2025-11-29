// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 8;
export const TILE_SIZE = 40;
export const GRID_OFFSET_X = 50;
export const GRID_OFFSET_Y = 50;

export const TILE_TYPES = {
  EMPTY: 'EMPTY',
  TOWER: 'TOWER',
  ROAD: 'ROAD',
  FLAG: 'FLAG',
  GARDEN: 'GARDEN',
  ARCHER: 'ARCHER',
  CANNON: 'CANNON',
  MAGIC: 'MAGIC'
};

export const gameState = {
  player: null,
  entities: [],
  grid: [],
  coins: 50,
  score: 0,
  wave: 0,
  maxWaves: 5,
  currentTile: null,
  cursorX: 3,
  cursorY: 3,
  enemies: [],
  projectiles: [],
  escapedEnemies: 0,
  maxEscapedEnemies: 10,
  waveInProgress: false,
  enemiesSpawned: 0,
  enemiesToSpawn: 5,
  spawnTimer: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  buildableArea: [],
  towerCooldowns: {},
  framesSinceLastCoin: 0,
  coinsPerSecond: 0
};

export function resetGameState() {
  gameState.grid = [];
  gameState.coins = 50;
  gameState.score = 0;
  gameState.wave = 0;
  gameState.currentTile = null;
  gameState.cursorX = 3;
  gameState.cursorY = 3;
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.escapedEnemies = 0;
  gameState.waveInProgress = false;
  gameState.enemiesSpawned = 0;
  gameState.enemiesToSpawn = 5;
  gameState.spawnTimer = 0;
  gameState.buildableArea = [];
  gameState.towerCooldowns = {};
  gameState.framesSinceLastCoin = 0;
  gameState.coinsPerSecond = 0;
  
  // Initialize grid
  for (let y = 0; y < GRID_SIZE; y++) {
    gameState.grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      gameState.grid[y][x] = {
        type: TILE_TYPES.EMPTY,
        data: null
      };
    }
  }
  
  // Initialize buildable area (starting 3x3 in center)
  for (let y = 2; y <= 5; y++) {
    for (let x = 2; x <= 5; x++) {
      gameState.buildableArea.push({ x, y });
    }
  }
  
  // Set starting position
  gameState.grid[0][3] = {
    type: TILE_TYPES.ROAD,
    data: { isStart: true }
  };
}

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;