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

// Control keys
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_LEFT = 37;
export const KEY_RIGHT = 39;

// Game settings
export const GROUND_Y = 350;
export const SPAWN_ZONE_Y = GROUND_Y - 30;
export const PLAYER_SPAWN_X_MIN = 50;
export const PLAYER_SPAWN_X_MAX = 250;

// Unit costs and properties
export const BASIC_UNIT_COST = 100;
export const STRONG_UNIT_COST = 250;
export const POINTS_PER_SECOND = 15;

// Wave configuration
export const WAVE_CONFIG = [
  { enemyCount: 3, spawnDelay: 120, enemyType: 'basic' },
  { enemyCount: 5, spawnDelay: 100, enemyType: 'basic' },
  { enemyCount: 4, spawnDelay: 90, enemyType: 'mixed' },
  { enemyCount: 6, spawnDelay: 80, enemyType: 'mixed' },
  { enemyCount: 8, spawnDelay: 70, enemyType: 'strong' }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  points: 200, // Starting points
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  cursorX: 150,
  currentWave: 0,
  waveEnemiesSpawned: 0,
  waveSpawnTimer: 0,
  totalEnemiesDefeated: 0,
  defeatedThisWave: 0,
  waveComplete: false,
  betweenWaves: false,
  betweenWaveTimer: 0
};

// Function to get game state (required for testing)
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}