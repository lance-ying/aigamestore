// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Object types
export const OBJECT_TYPES = {
  RAGDOLL: 'ragdoll',
  CANNON: 'cannon',
  MINE: 'mine',
  FAN: 'fan',
  WALL: 'wall'
};

// AI Behaviors
export const AI_BEHAVIORS = {
  NONE: 'none',
  ATTACKER: 'attacker',
  SEEKER: 'seeker',
  EXPLORER: 'explorer'
};

// Game state object
export const gameState = {
  player: null, // Not used in this sandbox game
  entities: [],
  score: 0, // Track objects placed
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  
  // Build mode state
  selectedObjectType: OBJECT_TYPES.RAGDOLL,
  cursorX: CANVAS_WIDTH / 2,
  cursorY: CANVAS_HEIGHT / 2,
  deleteMode: false,
  
  // Object properties (adjustable)
  ragdollScale: 1.0, // 0.5 to 2.0
  ragdollBehavior: AI_BEHAVIORS.EXPLORER,
  cannonForce: 1.0, // 0.5 to 2.0
  mineRadius: 1.0, // 0.5 to 2.0
  fanStrength: 1.0, // 0.5 to 2.0
  wallLength: 1.0, // 0.5 to 2.0
  
  // Tracking
  objectCount: 0,
  ragdollCount: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}