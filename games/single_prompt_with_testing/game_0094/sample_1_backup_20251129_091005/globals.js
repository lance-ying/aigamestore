// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid configuration
export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const GRID_START_X = 100;
export const GRID_START_Y = 50;
export const CELL_WIDTH = 50;
export const CELL_HEIGHT = 60;

// Game balance constants
export const INITIAL_SUN = 150;
export const SUN_VALUE = 25;
export const SUN_FALL_INTERVAL = 180; // frames
export const SUNFLOWER_PRODUCTION_INTERVAL = 480; // frames (8 seconds at 60fps)

// Plant costs
export const PLANT_COSTS = {
  SUNFLOWER: 50,
  PEASHOOTER: 100,
  WALLNUT: 50,
  CHERRY_BOMB: 150
};

// Zombie wave configuration
export const ZOMBIE_WAVES = [
  { count: 5, interval: 180, types: ['BASIC'] },
  { count: 8, interval: 150, types: ['BASIC', 'CONE'] },
  { count: 10, interval: 120, types: ['BASIC', 'CONE', 'BUCKET'] }
];

// Game state object
export const gameState = {
  // Core state
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
  
  // Entities
  player: null,
  entities: [],
  plants: [], // 2D grid of plants [row][col]
  zombies: [],
  projectiles: [],
  particles: [],
  sunDrops: [],
  
  // Resources
  sun: INITIAL_SUN,
  score: 0,
  
  // Game progress
  currentWave: 0,
  zombiesSpawned: 0,
  zombiesKilled: 0,
  totalZombiesInWave: 0,
  waveComplete: false,
  waveSpawnTimer: 0,
  sunFallTimer: 0,
  
  // UI state
  selectedPlantType: null,
  cursorRow: 2,
  cursorCol: 4,
  hoveredSun: null,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Physics
  gravity: 0.3,
  
  // Camera
  cameraX: 0,
  cameraY: 0
};

// Initialize plants grid
for (let row = 0; row < GRID_ROWS; row++) {
  gameState.plants[row] = [];
  for (let col = 0; col < GRID_COLS; col++) {
    gameState.plants[row][col] = null;
  }
}

// Expose game state globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Helper function to get grid position from row/col
export function getGridPosition(row, col) {
  return {
    x: GRID_START_X + col * CELL_WIDTH + CELL_WIDTH / 2,
    y: GRID_START_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2
  };
}

// Helper function to check if position is valid grid cell
export function isValidGridPosition(row, col) {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

// Helper function to get row from y position
export function getRowFromY(y) {
  return Math.floor((y - GRID_START_Y) / CELL_HEIGHT);
}

// Helper function to get col from x position
export function getColFromX(x) {
  return Math.floor((x - GRID_START_X) / CELL_WIDTH);
}