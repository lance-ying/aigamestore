// globals.js - Game constants and global state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.98;
export const GROUND_Y = CANVAS_HEIGHT - 40;

// Player constants
export const PLAYER_SPEED = 4;
export const PLAYER_JUMP_POWER = -11;
export const PLAYER_DOUBLE_JUMP_POWER = -10;
export const PLAYER_SHOVEL_DROP_POWER = 12;
export const PLAYER_BOUNCE_POWER = -13;

// Game configuration
export const TOTAL_GEMS_TO_WIN = 15;
export const ENEMY_COUNT = 5;
export const PLATFORM_COUNT = 8;

// Color palette (retro 8-bit inspired)
export const COLORS = {
  sky: [60, 120, 180],
  ground: [90, 70, 50],
  platform: [120, 100, 80],
  platformEdge: [80, 60, 40],
  player: [70, 160, 230],
  playerArmor: [180, 160, 140],
  playerShovel: [200, 200, 200],
  gem: [255, 220, 0],
  gemShine: [255, 255, 200],
  enemy: [200, 50, 50],
  enemyDetail: [150, 30, 30],
  health: [220, 50, 50],
  healthBg: [80, 20, 20],
  ui: [255, 255, 255],
  uiShadow: [40, 40, 40]
};

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  entities: [],
  platforms: [],
  enemies: [],
  gems: [],
  projectiles: [],
  particles: [],
  
  // Physics
  gravity: GRAVITY,
  friction: FRICTION,
  airResistance: AIR_RESISTANCE,
  
  // Game progress
  score: 0,
  gemsCollected: 0,
  enemiesDefeated: 0,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraShakeX: 0,
  cameraShakeY: 0,
  
  // Input tracking
  keys: {},
  lastAttackFrame: 0,
  attackCooldown: 20
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;