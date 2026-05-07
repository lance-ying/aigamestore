// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid configuration
export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const GRID_OFFSET_X = 100;
export const GRID_OFFSET_Y = 50;
export const CELL_WIDTH = 50;
export const CELL_HEIGHT = 60;

// Color palette
export const COLORS = {
  BG: [20, 20, 30],
  LAWN_LIGHT: [120, 200, 120],
  LAWN_DARK: [140, 220, 140],
  HUD_BG: [40, 30, 20],
  HUD_BORDER: [60, 40, 30],
  ACCENT: [255, 255, 0],
  DANGER: [255, 100, 100]
};

// Level-specific grass colors
export const LEVEL_GRASS_COLORS = [
  // Level 1 - Easy (Bright Green)
  { light: [120, 200, 120], dark: [140, 220, 140] },
  // Level 2 - Easy (Spring Green)
  { light: [150, 220, 100], dark: [170, 240, 120] },
  // Level 3 - Medium (Yellow-Green)
  { light: [180, 200, 80], dark: [200, 220, 100] },
  // Level 4 - Medium (Olive Green)
  { light: [140, 180, 80], dark: [160, 200, 100] },
  // Level 5 - Hard (Dark Green)
  { light: [100, 160, 100], dark: [120, 180, 120] },
  // Level 6 - Hard (Blue-Green)
  { light: [100, 180, 160], dark: [120, 200, 180] }
];

// Plant types configuration
export const PLANT_TYPES = {
  SUNFLOWER: {
    name: 'Sunflower',
    cost: 50,
    cooldown: 480,
    icon: '🌻'
  },
  PEASHOOTER: {
    name: 'Peashooter',
    cost: 100,
    cooldown: 480,
    icon: '🌱'
  },
  WALLNUT: {
    name: 'Wallnut',
    cost: 50,
    cooldown: 1800,
    icon: '🥜'
  },
  CHERRY_BOMB: {
    name: 'Cherry Bomb',
    cost: 150,
    cooldown: 3000,
    icon: '🍒'
  }
};

export const PLANT_KEYS = ['SUNFLOWER', 'PEASHOOTER', 'WALLNUT', 'CHERRY_BOMB'];

// Game balance constants
export const INITIAL_SUN = 150;
export const SUN_VALUE = 25;
export const SUN_FALL_INTERVAL = 180; // frames
export const SUNFLOWER_PRODUCTION_INTERVAL = 480; // frames (8 seconds at 60fps)
export const LEVEL_DURATION = 5400; // 90 seconds at 60fps (1.5 minutes per level)

// Plant costs (for backward compatibility)
export const PLANT_COSTS = {
  SUNFLOWER: 50,
  PEASHOOTER: 100,
  WALLNUT: 50,
  CHERRY_BOMB: 150
};

// Zombie wave configuration - 6 levels: 2 easy, 2 medium, 2 hard
export const ZOMBIE_WAVES = [
  // Level 1 - Easy
  { count: 8, interval: 240, types: ['BASIC'], difficulty: 'EASY', duration: LEVEL_DURATION },
  // Level 2 - Easy
  { count: 10, interval: 200, types: ['BASIC'], difficulty: 'EASY', duration: LEVEL_DURATION },
  // Level 3 - Medium
  { count: 12, interval: 160, types: ['BASIC', 'CONE'], difficulty: 'MEDIUM', duration: LEVEL_DURATION },
  // Level 4 - Medium
  { count: 15, interval: 140, types: ['BASIC', 'CONE'], difficulty: 'MEDIUM', duration: LEVEL_DURATION },
  // Level 5 - Hard
  { count: 18, interval: 120, types: ['BASIC', 'CONE', 'BUCKET'], difficulty: 'HARD', duration: LEVEL_DURATION },
  // Level 6 - Hard
  { count: 22, interval: 100, types: ['BASIC', 'CONE', 'BUCKET'], difficulty: 'HARD', duration: LEVEL_DURATION }
];

// Game state object
export const gameState = {
  // Core state
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // Only HUMAN mode remains
  
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
  totalWaves: ZOMBIE_WAVES.length,
  levelTimer: 0, // Timer for current level duration
  levelStartTime: 0,
  
  // UI state
  selectedPlantIndex: -1,
  cursorRow: 2,
  cursorCol: 4,
  plantCooldowns: {
    SUNFLOWER: 0,
    PEASHOOTER: 0,
    WALLNUT: 0,
    CHERRY_BOMB: 0
  },
  
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
window.gameState = gameState; // Expose gameState object directly for recorder script

// Helper function to get grid position from row/col
export function getGridPosition(row, col) {
  return {
    x: GRID_OFFSET_X + col * CELL_WIDTH + CELL_WIDTH / 2,
    y: GRID_OFFSET_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2
  };
}

// Helper function to check if position is valid grid cell
export function isValidGridPosition(row, col) {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

// Helper function to get row from y position
export function getRowFromY(y) {
  return Math.floor((y - GRID_OFFSET_Y) / CELL_HEIGHT);
}

// Helper function to get col from x position
export function getColFromX(x) {
  return Math.floor((x - GRID_OFFSET_X) / CELL_WIDTH);
}