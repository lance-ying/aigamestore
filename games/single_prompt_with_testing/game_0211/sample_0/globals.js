// globals.js - Global constants and game state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phase constants
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Game configuration
export const GAME_CONFIG = {
  playerSpeed: 4,
  playerAfterburnerSpeed: 7,
  bulletSpeed: 8,
  missileSpeed: 6,
  enemySpeed: 2,
  groundTargetCount: 8,
  enemySpawnRate: 120, // Frames between spawns
  powerUpSpawnRate: 300, // Frames between power-up spawns
  maxEnemies: 10,
  winScore: 1000,
  playerMaxHealth: 100,
  playerMaxShield: 50,
  shieldRegenRate: 0.1,
  missileMaxCount: 10,
  missileReloadTime: 180, // Frames
};

// Game state object
export const gameState = {
  // Core state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Entities
  player: null,
  entities: [],
  enemies: [],
  groundTargets: [],
  bullets: [],
  missiles: [],
  enemyBullets: [],
  powerUps: [],
  particles: [],
  explosions: [],
  
  // Game stats
  score: 0,
  enemiesDestroyed: 0,
  groundTargetsDestroyed: 0,
  missionProgress: 0,
  
  // Spawning
  enemySpawnTimer: 0,
  powerUpSpawnTimer: 0,
  missileReloadTimer: 0,
  
  // Camera/viewport (for parallax effects)
  cameraX: 0,
  cameraY: 0,
  
  // Background layers for parallax
  bgLayers: [],
  
  // Target lock system
  lockedTarget: null,
  lockProgress: 0,
};

// Expose game state globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Reset game state for new game
export function resetGameState() {
  gameState.gamePhase = PHASE_START;
  gameState.score = 0;
  gameState.enemiesDestroyed = 0;
  gameState.groundTargetsDestroyed = 0;
  gameState.missionProgress = 0;
  gameState.enemySpawnTimer = 0;
  gameState.powerUpSpawnTimer = 0;
  gameState.missileReloadTimer = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.lockedTarget = null;
  gameState.lockProgress = 0;
  
  // Clear all entity arrays
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.groundTargets = [];
  gameState.bullets = [];
  gameState.missiles = [];
  gameState.enemyBullets = [];
  gameState.powerUps = [];
  gameState.particles = [];
  gameState.explosions = [];
}