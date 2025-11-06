// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Grid configuration
export const GRID_SIZE = 40;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

// Trap types
export const TRAP_DART = "DART";
export const TRAP_SPRING = "SPRING";
export const TRAP_LAVA = "LAVA";
export const TRAP_SUMMON = "SUMMON";

// Trap costs and stats
export const TRAP_DATA = {
  [TRAP_DART]: {
    name: "Dart Trap",
    baseCost: 50,
    upgradeCost: [0, 75, 100],
    damage: [10, 20, 35],
    cooldown: [60, 45, 30],
    range: 80,
    description: "Shoots darts at enemies"
  },
  [TRAP_SPRING]: {
    name: "Spring Trap",
    baseCost: 60,
    upgradeCost: [0, 80, 120],
    damage: [5, 8, 12],
    knockback: [50, 80, 120],
    cooldown: [90, 70, 50],
    description: "Launches enemies backward"
  },
  [TRAP_LAVA]: {
    name: "Lava Flow",
    baseCost: 80,
    upgradeCost: [0, 100, 150],
    damage: [2, 4, 7],
    duration: [300, 450, 600],
    description: "Creates damaging lava pool"
  },
  [TRAP_SUMMON]: {
    name: "Summon Portal",
    baseCost: 100,
    upgradeCost: [0, 120, 180],
    damage: [8, 15, 25],
    cooldown: [120, 90, 60],
    description: "Summons minion to attack"
  }
};

// Enemy configuration
export const ENEMY_TYPES = {
  WARRIOR: {
    name: "Warrior",
    health: 50,
    speed: 1.0,
    gold: 10,
    color: [200, 50, 50]
  },
  SCOUT: {
    name: "Scout",
    health: 30,
    speed: 1.5,
    gold: 8,
    color: [50, 200, 50]
  },
  TANK: {
    name: "Tank",
    health: 100,
    speed: 0.7,
    gold: 20,
    color: [100, 100, 200]
  },
  RUNNER: {
    name: "Runner",
    health: 20,
    speed: 2.0,
    gold: 6,
    color: [200, 200, 50]
  }
};

// Wave configuration
export const TOTAL_WAVES = 20;
export const WAVE_SPAWN_DELAY = 180; // frames between waves
export const ENEMIES_PER_WAVE = 3;

// Game balance
export const STARTING_GOLD = 150;
export const MAX_ESCAPED = 20;
export const CORE_POSITION = { x: 14, y: 5 };

// Path waypoints (grid coordinates)
export const PATH_WAYPOINTS = [
  { x: 0, y: 5 },
  { x: 3, y: 5 },
  { x: 3, y: 2 },
  { x: 7, y: 2 },
  { x: 7, y: 7 },
  { x: 11, y: 7 },
  { x: 11, y: 4 },
  { x: 14, y: 4 }
];

// Game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player resources
  gold: STARTING_GOLD,
  
  // Game progress
  currentWave: 0,
  enemiesSpawned: 0,
  enemiesKilled: 0,
  enemiesEscaped: 0,
  score: 0,
  
  // Entities
  player: null,
  traps: [],
  enemies: [],
  projectiles: [],
  effects: [],
  minions: [],
  
  // Grid state
  grid: [],
  pathCells: new Set(),
  
  // UI state
  selectedTrapType: null,
  selectedGridPos: null,
  menuIndex: 0,
  cursorPos: { x: 0, y: 0 },
  
  // Timing
  waveTimer: 0,
  frameCount: 0,
  
  // Upgrade mode
  upgradingTrap: null
};

// Initialize grid
for (let y = 0; y < GRID_ROWS; y++) {
  gameState.grid[y] = [];
  for (let x = 0; x < GRID_COLS; x++) {
    gameState.grid[y][x] = null;
  }
}

// Mark path cells
for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
  const start = PATH_WAYPOINTS[i];
  const end = PATH_WAYPOINTS[i + 1];
  
  if (start.x === end.x) {
    // Vertical path
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    for (let y = minY; y <= maxY; y++) {
      gameState.pathCells.add(`${start.x},${y}`);
    }
  } else {
    // Horizontal path
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    for (let x = minX; x <= maxX; x++) {
      gameState.pathCells.add(`${x},${start.y}`);
    }
  }
}

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}