// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GAME_CONSTANTS = {
  PLAYER_SPEED: 3.5,
  PLAYER_DASH_SPEED: 12,
  PLAYER_DASH_DURATION: 10,
  PLAYER_DASH_COOLDOWN: 60,
  PLAYER_SWORD_RANGE: 40,
  PLAYER_SWORD_DAMAGE: 50,
  PLAYER_SWORD_COOLDOWN: 15,
  PLAYER_MAX_HEALTH: 100,
  
  ENEMY_BASE_SPEED: 1.5,
  ENEMY_SPAWN_INTERVAL: 90,
  ENEMY_MIN_SPAWN_INTERVAL: 30,
  ENEMY_HEALTH: 50,
  ENEMY_DAMAGE: 15,
  ENEMY_TOUCH_COOLDOWN: 30,
  
  POWERUP_SPAWN_INTERVAL: 300,
  POWERUP_DURATION: 600,
  
  SLOW_MO_MAX: 180,
  SLOW_MO_DRAIN_RATE: 2,
  SLOW_MO_RECHARGE_RATE: 0.5,
  SLOW_MO_FACTOR: 0.3
};

// Game state object
export const gameState = {
  // Core state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  entities: [],
  enemies: [],
  powerups: [],
  particles: [],
  slashEffects: [],
  
  // Game metrics
  score: 0,
  enemiesDefeated: 0,
  survivalTime: 0,
  waveNumber: 1,
  
  // Timers
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  enemySpawnTimer: 0,
  powerupSpawnTimer: 0,
  gameTimeSeconds: 0,
  
  // Difficulty scaling
  difficultyMultiplier: 1.0,
  enemySpawnInterval: GAME_CONSTANTS.ENEMY_SPAWN_INTERVAL,
  
  // Effects
  screenShake: 0,
  slowMotion: false,
  slowMoCharge: GAME_CONSTANTS.SLOW_MO_MAX,
  
  // Background elements
  stars: []
};

// Initialize stars for background
export function initializeStars() {
  gameState.stars = [];
  for (let i = 0; i < 50; i++) {
    gameState.stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;