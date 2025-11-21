// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  score: 0,
  distance: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  gameSpeed: 4,
  baseSpeed: 4,
  spawnTimer: 0,
  spawnInterval: 60,
  coinSpawnTimer: 0,
  coinSpawnInterval: 40,
  difficultyLevel: 1,
  lastObstacleType: null,
  framesSinceStart: 0
};

// Lane positions
export const LANES = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2
};

export const LANE_X_POSITIONS = [150, 300, 450];
export const GROUND_Y = 320;
export const PLAYER_SIZE = 40;

// Obstacle types
export const OBSTACLE_TYPES = {
  TRAIN: 'TRAIN',
  LOW_BARRIER: 'LOW_BARRIER',
  HIGH_BARRIER: 'HIGH_BARRIER'
};

// Player states
export const PLAYER_STATES = {
  RUNNING: 'RUNNING',
  JUMPING: 'JUMPING',
  SLIDING: 'SLIDING'
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};