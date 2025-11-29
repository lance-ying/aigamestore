// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
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

// Game state object
export const gameState = {
  // Core state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Entities
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  enemyProjectiles: [],
  powerUps: [],
  particles: [],
  
  // Game variables
  score: 0,
  wave: 1,
  maxWaves: 5,
  enemiesDefeated: 0,
  
  // Boss state
  bossActive: false,
  bossDefeated: false,
  
  // Physics
  gravity: 0,
  friction: 0.95,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Wave management
  waveTimer: 0,
  waveDelay: 180, // 3 seconds between waves
  enemySpawnTimer: 0,
  enemySpawnDelay: 60, // 1 second between spawns
  enemiesInWave: 0,
  
  // Special effects
  screenShake: 0,
  flashAlpha: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;