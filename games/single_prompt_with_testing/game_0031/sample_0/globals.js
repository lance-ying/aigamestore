// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Key codes
export const KEY_CODES = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  Z: 90,
  R: 82
};

// Game state - single source of truth
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  xpGems: [],
  particles: [],
  score: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: 10,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  time: 0,
  waveNumber: 1,
  enemiesDefeated: 0,
  upgradesAvailable: [],
  isPendingUpgrade: false,
  lastSpawnTime: 0,
  spawnInterval: 120, // frames
  difficulty: 1.0,
  WIN_TIME: 90000, // 90 seconds to win
  startTime: 0
};

// Expose gameState getter
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.xpGems = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNextLevel = 10;
  gameState.time = 0;
  gameState.waveNumber = 1;
  gameState.enemiesDefeated = 0;
  gameState.upgradesAvailable = [];
  gameState.isPendingUpgrade = false;
  gameState.lastSpawnTime = 0;
  gameState.spawnInterval = 120;
  gameState.difficulty = 1.0;
  gameState.startTime = 0;
}