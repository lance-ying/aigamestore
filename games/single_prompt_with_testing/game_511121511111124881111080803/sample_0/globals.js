// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GAME_CONSTANTS = {
  PLAYER_SIZE: 20,
  PLAYER_MAX_SPEED: 8,
  PLAYER_MIN_SPEED: 2,
  PLAYER_ACCELERATION: 0.3,
  PLAYER_TURN_SPEED: 0.08,
  PLAYER_BOOST_MULTIPLIER: 1.5,
  PLAYER_BRAKE_MULTIPLIER: 0.5,
  PLAYER_FRICTION: 0.98,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_INVULNERABILITY_TIME: 60, // frames
  
  PROJECTILE_SPEED: 8,
  PROJECTILE_SIZE: 4,
  PROJECTILE_LIFETIME: 80, // frames
  PROJECTILE_FIRE_RATE: 8, // frames between shots
  
  ENEMY_BASE_SIZE: 15,
  ENEMY_BASE_SPEED: 2,
  ENEMY_BASE_HEALTH: 30,
  ENEMY_SPAWN_RATE: 90, // frames between spawns
  ENEMY_MIN_SPAWN_RATE: 30,
  ENEMY_DIFFICULTY_INCREASE: 0.995, // multiplier per frame
  
  POWERUP_SIZE: 12,
  POWERUP_LIFETIME: 300, // frames
  POWERUP_SPAWN_CHANCE: 0.3, // chance when enemy dies
  
  PARTICLE_LIFETIME: 30,
  PARTICLE_COUNT: 8,
  
  SCORE_PER_ENEMY: 100,
  SCORE_MULTIPLIER_INCREMENT: 0.1,
  SCORE_MULTIPLIER_DECAY: 0.995,
  
  WORLD_WRAP: true, // whether entities wrap around screen edges
};

// Power-up types
export const POWERUP_TYPES = {
  RAPID_FIRE: 'rapidFire',
  SPREAD_SHOT: 'spreadShot',
  SHIELD: 'shield',
  BOMB: 'bomb',
  HEALTH: 'health',
};

// Enemy types
export const ENEMY_TYPES = {
  BASIC: 'basic',
  FAST: 'fast',
  TANK: 'tank',
  SHOOTER: 'shooter',
};

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  entities: [],
  projectiles: [],
  enemies: [],
  powerups: [],
  particles: [],
  
  // Score and game progress
  score: 0,
  highScore: 0,
  scoreMultiplier: 1.0,
  enemiesDestroyed: 0,
  waveNumber: 1,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameTime: 0, // seconds since game started
  
  // Difficulty
  enemySpawnRate: GAME_CONSTANTS.ENEMY_SPAWN_RATE,
  enemySpeedMultiplier: 1.0,
  enemyHealthMultiplier: 1.0,
  difficultyLevel: 1,
  
  // Spawn timers
  enemySpawnTimer: 0,
  
  // Camera (for effects)
  cameraShake: 0,
  cameraX: 0,
  cameraY: 0,
  
  // Special effects
  flashIntensity: 0,
  backgroundStars: [],
  
  // Power-up state
  activePowerups: {
    rapidFire: 0,
    spreadShot: 0,
    shield: 0,
  },
  
  // Statistics for testing
  stats: {
    totalShots: 0,
    totalHits: 0,
    powerupsCollected: 0,
    damageTaken: 0,
    maxCombo: 0,
    survivalTime: 0,
  },
};

// Initialize background stars
export function initializeStars(count = 100) {
  gameState.backgroundStars = [];
  for (let i = 0; i < count; i++) {
    gameState.backgroundStars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 100 + 155,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
}

// Get game state for external access
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Reset game state
export function resetGameState() {
  // Clear all entity arrays
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.enemies = [];
  gameState.powerups = [];
  gameState.particles = [];
  
  // Reset player
  gameState.player = null;
  
  // Reset score and progress
  gameState.score = 0;
  gameState.scoreMultiplier = 1.0;
  gameState.enemiesDestroyed = 0;
  gameState.waveNumber = 1;
  
  // Reset timing
  gameState.frameCount = 0;
  gameState.gameTime = 0;
  
  // Reset difficulty
  gameState.enemySpawnRate = GAME_CONSTANTS.ENEMY_SPAWN_RATE;
  gameState.enemySpeedMultiplier = 1.0;
  gameState.enemyHealthMultiplier = 1.0;
  gameState.difficultyLevel = 1;
  gameState.enemySpawnTimer = 0;
  
  // Reset camera
  gameState.cameraShake = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.flashIntensity = 0;
  
  // Reset power-ups
  gameState.activePowerups = {
    rapidFire: 0,
    spreadShot: 0,
    shield: 0,
  };
  
  // Reset stats
  gameState.stats = {
    totalShots: 0,
    totalHits: 0,
    powerupsCollected: 0,
    damageTaken: 0,
    maxCombo: 0,
    survivalTime: 0,
  };
}

// Utility functions
export function wrapPosition(x, y) {
  let newX = x;
  let newY = y;
  
  if (x < 0) newX = CANVAS_WIDTH;
  if (x > CANVAS_WIDTH) newX = 0;
  if (y < 0) newY = CANVAS_HEIGHT;
  if (y > CANVAS_HEIGHT) newY = 0;
  
  return { x: newX, y: newY };
}

export function clampPosition(x, y, margin = 0) {
  const newX = Math.max(margin, Math.min(CANVAS_WIDTH - margin, x));
  const newY = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, y));
  return { x: newX, y: newY };
}

export function distanceBetween(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}