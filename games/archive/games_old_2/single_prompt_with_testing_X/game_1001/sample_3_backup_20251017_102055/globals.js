// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Track configuration
export const NUM_TRACKS = 3;
export const TRACK_SPACING = 3;
export const TRACK_POSITIONS = [-TRACK_SPACING, 0, TRACK_SPACING]; // Left, Center, Right

// Game constants
export const INITIAL_SPEED = 0.15;
export const SPEED_INCREMENT = 0.002;
export const MAX_SPEED = 0.5;
export const SPAWN_DISTANCE = 50;
export const DESPAWN_DISTANCE = -10;

// Player constants
export const JUMP_POWER = 0.4;
export const GRAVITY = 0.02;
export const SLIDE_DURATION = 30; // frames
export const LANE_CHANGE_SPEED = 0.3;

// Obstacle types
export const OBSTACLE_TYPES = {
  TRAIN: 'TRAIN',
  BARRIER: 'BARRIER',
  LOW_BARRIER: 'LOW_BARRIER',
  COIN: 'COIN'
};

// Scoring
export const COIN_VALUE = 10;
export const DISTANCE_SCORE_MULTIPLIER = 1;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  score: 0,
  distance: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  scene: null,
  camera: null,
  renderer: null,
  currentSpeed: INITIAL_SPEED,
  frameCount: 0,
  nextSpawnDistance: SPAWN_DISTANCE,
  difficulty: 1,
  keys: {
    left: false,
    right: false,
    up: false,
    down: false
  }
};

// Logs object (write-only)
export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Expose logs globally
window.logs = logs;