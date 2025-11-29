// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World constants
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;
export const TILE_SIZE = 30;

// Color palette - inspired by Hyper Light Drifter's neon aesthetic
export const COLORS = {
  background: [15, 10, 25],
  ground: [25, 20, 35],
  wall: [40, 35, 55],
  player: [255, 80, 200],
  playerGlow: [255, 120, 220, 150],
  enemy: [200, 50, 50],
  enemyGlow: [255, 80, 80, 150],
  health: [0, 255, 100],
  energy: [100, 200, 255],
  crystal: [255, 220, 100],
  artifact: [150, 100, 255],
  hazardSpike: [180, 50, 50],
  hazardPoison: [100, 255, 150, 100],
  ui: [200, 200, 220],
  uiDark: [60, 60, 80]
};

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
  
  // Entities
  player: null,
  entities: [],
  enemies: [],
  collectibles: [],
  hazards: [],
  particles: [],
  projectiles: [],
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraShakeX: 0,
  cameraShakeY: 0,
  cameraShakeIntensity: 0,
  
  // World
  worldTiles: [],
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  
  // Game stats
  score: 0,
  artifactsCollected: 0,
  crystalsCollected: 0,
  totalCrystals: 5,
  enemiesDefeated: 0,
  
  // Time tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameTime: 0,
  
  // Physics
  gravity: 0,
  friction: 0.85,
  
  // Map state
  showMap: false,
  mapDiscovered: new Set(),
  
  // Input tracking
  keys: {},
  lastDashTime: 0,
  lastAttackTime: 0
};

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

// Expose global functions
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;