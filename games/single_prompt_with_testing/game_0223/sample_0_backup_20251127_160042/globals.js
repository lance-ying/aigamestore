// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const PLAYER_SPEED = 2;
export const PLAYER_TURN_SPEED = 0.08;
export const PLAYER_RADIUS = 15;

export const FLASHLIGHT_DRAIN_RATE = 0.15;
export const FLASHLIGHT_RECHARGE_RATE = 2.0;
export const FLASHLIGHT_SHAKE_NOISE = 0.8;
export const FLASHLIGHT_RANGE = 150;

export const TATTLETAIL_NEED_DECAY = 0.05;
export const TATTLETAIL_NOISE_BASE = 0.3;
export const TATTLETAIL_NOISE_UNHAPPY = 1.5;

export const MAMA_SPAWN_THRESHOLD = 60;
export const MAMA_SPEED = 1.5;
export const MAMA_CATCH_DISTANCE = 30;

export const NOISE_DECAY_RATE = 0.5;
export const MOVEMENT_NOISE = 0.2;

export const GAME_DURATION = 180; // 3 minutes in seconds

// Wall definitions for the house
export const WALLS = [
  // Outer boundaries
  { x1: 0, y1: 0, x2: 800, y2: 0 },
  { x1: 800, y1: 0, x2: 800, y2: 600 },
  { x1: 800, y1: 600, x2: 0, y2: 600 },
  { x1: 0, y1: 600, x2: 0, y2: 0 },
  
  // Interior walls - Living room to hallway
  { x1: 300, y1: 0, x2: 300, y2: 200 },
  { x1: 300, y1: 280, x2: 300, y2: 600 },
  
  // Kitchen wall
  { x1: 500, y1: 0, x2: 500, y2: 200 },
  { x1: 500, y1: 280, x2: 500, y2: 400 },
  
  // Bedroom wall
  { x1: 0, y1: 300, x2: 200, y2: 300 },
  { x1: 280, y1: 300, x2: 500, y2: 300 },
];

// Room definitions
export const ROOMS = [
  { name: "Living Room", x: 150, y: 150, width: 300, height: 300, color: [40, 30, 50] },
  { name: "Hallway", x: 300, y: 200, width: 200, height: 80, color: [30, 25, 40] },
  { name: "Kitchen", x: 500, y: 150, width: 300, height: 250, color: [45, 35, 45] },
  { name: "Bedroom", x: 0, y: 0, width: 300, height: 300, color: [35, 25, 45] },
];

// Furniture/interaction points
export const FURNITURE = [
  { type: "food", x: 650, y: 100, label: "Food Bowl" },
  { type: "brush", x: 100, y: 100, label: "Brush" },
  { type: "charger", x: 650, y: 500, label: "Charger" },
];

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  tattletail: null,
  mama: null,
  entities: [],
  
  // Game variables
  score: 0,
  timeRemaining: GAME_DURATION,
  noiseLevel: 0,
  
  // Player state
  flashlightOn: false,
  flashlightBattery: 100,
  lastShakeTime: 0,
  
  // Tattletail state
  tattletailHunger: 100,
  tattletailCleanliness: 100,
  tattletailBattery: 100,
  tattletailNeedType: "none", // "food", "brush", "charge", "none"
  
  // Mama state
  mamaSpawned: false,
  mamaActive: false,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameStartTime: 0,
  
  // Camera (for 3D-like effect)
  cameraX: 0,
  cameraY: 0,
  
  // Input state
  keys: {},
};

// Expose getGameState function
export function getGameState() {
  return gameState;
}

// Make it globally accessible
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}