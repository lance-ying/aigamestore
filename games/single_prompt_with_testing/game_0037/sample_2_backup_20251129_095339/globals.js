// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = 0.6;
export const FRICTION = 0.88;
export const AIR_RESISTANCE = 0.98;
export const MAX_VELOCITY_X = 8;
export const MAX_VELOCITY_Y = 16;

// Player constants
export const PLAYER_WIDTH = 20;
export const PLAYER_HEIGHT = 30;
export const PLAYER_SPEED = 3.5;
export const PLAYER_ACCELERATION = 0.5;
export const JUMP_POWER = -11;
export const SPIN_DASH_MAX_POWER = 15;
export const SPIN_DASH_CHARGE_RATE = 0.3;

// Ring constants
export const RING_VALUE = 1;
export const RING_PROTECTION_ENABLED = true;
export const EXTRA_LIFE_RINGS = 100;
export const SPECIAL_STAGE_RING_REQUIREMENT = 50;

// Enemy constants
export const ENEMY_DAMAGE = 1;
export const INVINCIBILITY_DURATION = 90; // frames

// Level constants
export const LEVEL_WIDTH = 3000;
export const LEVEL_HEIGHT = 400;
export const GOAL_POST_X = LEVEL_WIDTH - 100;

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE", "SPECIAL_STAGE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Player reference
  player: null,
  
  // Entity arrays
  entities: [],
  platforms: [],
  rings: [],
  enemies: [],
  springs: [],
  loops: [],
  particles: [],
  scatteredRings: [],
  giantRings: [],
  specialStageRings: [],
  
  // Game progression
  score: 0,
  ringCount: 0,
  chaosEmeralds: 0,
  lives: 3,
  currentAct: 1,
  currentZone: 1,
  
  // Special abilities
  isSuperSonic: false,
  superSonicTimer: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Physics
  gravity: GRAVITY,
  friction: FRICTION,
  airResistance: AIR_RESISTANCE,
  
  // Time tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameTime: 0,
  
  // Special Stage state
  specialStageActive: false,
  specialStageComplete: false,
  
  // Performance
  spatialGrid: null,
  
  // Level completion
  levelComplete: false,
  completionTimer: 0,
  
  // Background layers for parallax
  backgroundLayers: [],
};

// Initialize game state
export function initGameState() {
  gameState.gamePhase = "START";
  gameState.controlMode = "HUMAN";
  gameState.score = 0;
  gameState.ringCount = 0;
  gameState.chaosEmeralds = 0;
  gameState.lives = 3;
  gameState.currentAct = 1;
  gameState.currentZone = 1;
  gameState.isSuperSonic = false;
  gameState.superSonicTimer = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.frameCount = 0;
  gameState.lastFrameTime = 0;
  gameState.deltaTime = 0;
  gameState.gameTime = 0;
  gameState.levelComplete = false;
  gameState.completionTimer = 0;
  gameState.specialStageActive = false;
  gameState.specialStageComplete = false;
  
  // Clear entity arrays
  gameState.entities = [];
  gameState.platforms = [];
  gameState.rings = [];
  gameState.enemies = [];
  gameState.springs = [];
  gameState.loops = [];
  gameState.particles = [];
  gameState.scatteredRings = [];
  gameState.giantRings = [];
  gameState.specialStageRings = [];
  gameState.backgroundLayers = [];
  
  gameState.player = null;
}

// Get game state (exposed globally)
export function getGameState() {
  return gameState;
}

// Set control mode
export function setControlMode(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
}

// Expose functions globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
  window.setControlMode = setControlMode;
}