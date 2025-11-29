// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const PLAYER_SIZE = 25;
export const PLAYER_SPEED = 4;
export const PLAYER_BOOST_SPEED = 7;
export const PLAYER_MAX_ENERGY = 100;
export const PLAYER_ENERGY_DRAIN = 0.1;
export const PLAYER_ENERGY_REGEN = 0.2;
export const PLAYER_SHIELD_COST = 0.5;
export const PLAYER_BOOST_COST = 0.3;

export const ASTEROID_MIN_SIZE = 20;
export const ASTEROID_MAX_SIZE = 50;
export const ASTEROID_SPEED = 1.5;
export const ASTEROID_COUNT = 8;

export const DRONE_SIZE = 20;
export const DRONE_SPEED = 2;
export const DRONE_COUNT = 5;
export const DRONE_FIRE_RATE = 120; // frames between shots

export const CRYSTAL_SIZE = 15;
export const CRYSTAL_COUNT = 10;

export const PROJECTILE_SPEED = 8;
export const PROJECTILE_SIZE = 5;
export const PROJECTILE_LIFETIME = 90;

export const PARTICLE_LIFETIME = 30;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  
  // Entity arrays
  asteroids: [],
  drones: [],
  crystals: [],
  projectiles: [],
  enemyProjectiles: [],
  particles: [],
  stars: [],
  
  // Game status
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
  
  // Score and stats
  score: 0,
  crystalsCollected: 0,
  totalCrystals: CRYSTAL_COUNT,
  enemiesDestroyed: 0,
  asteroidsDestroyed: 0,
  
  // Physics
  gravity: 0, // No gravity in space
  friction: 0.98,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera (fixed for this game)
  cameraX: 0,
  cameraY: 0,
  
  // Game world
  worldWidth: CANVAS_WIDTH,
  worldHeight: CANVAS_HEIGHT
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Key codes for reference
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