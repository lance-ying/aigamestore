// globals.js - Game constants and global state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game state object
export const gameState = {
  // Game phase
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Entity references
  player: null,
  entities: [],
  enemies: [],
  platforms: [],
  projectiles: [],
  particles: [],
  collectibles: [],
  
  // Physics
  gravity: 0.6,
  friction: 0.85,
  airResistance: 0.95,
  
  // Game state
  score: 0,
  soul: 0,
  maxSoul: 100,
  enemiesDefeated: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  worldWidth: 2400,
  worldHeight: 800,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Level
  currentLevel: 1,
  relicCollected: false,
  relic: null,
  
  // Background
  backgroundLayers: []
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Key codes
export const KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  Z: 90,
  ENTER: 13,
  ESC: 27,
  R: 82
};

// Color palette (Hollow Knight inspired)
export const COLORS = {
  background: [10, 10, 15],
  backgroundLight: [20, 20, 30],
  accent: [180, 220, 255],
  soul: [150, 200, 255],
  enemy: [220, 100, 80],
  platform: [40, 40, 50],
  player: [240, 240, 255],
  health: [220, 50, 50],
  relic: [255, 220, 100]
};