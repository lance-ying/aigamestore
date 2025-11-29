// globals.js - Game constants and global state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game state object - tracks all game data
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  entities: [],
  creatures: [],
  foodOrbs: [],
  platforms: [],
  particles: [],
  
  // Physics
  gravity: 0.6,
  friction: 0.85,
  airResistance: 0.98,
  
  // Game progress
  score: 0,
  foodCollected: 0,
  foodRequired: 15,
  
  // Animation and effects
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  worldPulse: 0, // Global pulse animation value
  pulseSpeed: 0.03,
  
  // Camera (for potential scrolling)
  cameraX: 0,
  cameraY: 0,
  
  // World dimensions
  worldWidth: CANVAS_WIDTH,
  worldHeight: CANVAS_HEIGHT,
  
  // Timers
  creatureSpawnTimer: 0,
  particleSpawnTimer: 0,
  
  // Friend (NPC that receives food)
  friend: null,
  friendSatisfaction: 0,
  
  // Environmental state
  backgroundLayers: [],
  organicShapes: []
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Key code constants
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

// Color palette for the pink surreal world
export const COLORS = {
  // Pink flesh tones
  pinkLight: [255, 200, 220],
  pinkMedium: [255, 150, 180],
  pinkDark: [220, 100, 140],
  pinkDeep: [180, 60, 100],
  
  // Accent colors
  organic: [240, 180, 200],
  glow: [255, 255, 150],
  foodGlow: [255, 230, 100],
  shadow: [150, 80, 110],
  
  // Creature colors
  creatureSkin: [230, 160, 180],
  creatureEye: [100, 40, 60]
};

// Initialize game state
export function initializeGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.creatures = [];
  gameState.foodOrbs = [];
  gameState.platforms = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.foodCollected = 0;
  gameState.frameCount = 0;
  gameState.worldPulse = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.friend = null;
  gameState.friendSatisfaction = 0;
  gameState.backgroundLayers = [];
  gameState.organicShapes = [];
}