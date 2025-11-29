// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

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

// Physics constants
export const PHYSICS = {
  GRAVITY: 0.4,
  FRICTION: 0.98,
  AIR_RESISTANCE: 0.99,
  GROUND_Y: 350,
  MAX_VELOCITY: 15,
  CLIMB_SPEED: 2,
  JUMP_POWER: -10,
  SPRINT_MULTIPLIER: 1.5,
  GRAB_DISTANCE: 40,
  PULL_FORCE: 0.8,
  FLING_MULTIPLIER: 1.5
};

// Game configuration
export const CONFIG = {
  ROUND_TIME: 20, // seconds
  START_HEIGHT: 0,
  CLIMBER_HEIGHT: 60,
  CLIMBER_WIDTH: 35,
  LIMB_RADIUS: 8,
  MAX_ROUNDS: 10,
  ELIMINATION_DELAY: 60, // frames
  TOWER_SWAY_FACTOR: 0.05,
  WIN_HEIGHT_THRESHOLD: 30 // pixels above highest point to win
};

// Game state object
export const gameState = {
  // Core state
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Entities
  player: null,
  entities: [],
  climbers: [], // Tower of climbers
  goat: null, // Base of tower
  
  // Game progression
  currentRound: 1,
  currentPlayerIndex: 0,
  eliminatedPlayers: [],
  score: 0,
  highestPoint: PHYSICS.GROUND_Y,
  roundTimer: CONFIG.ROUND_TIME * 60, // Convert to frames
  targetHeight: 0, // Height player must reach
  
  // Physics
  gravity: PHYSICS.GRAVITY,
  friction: PHYSICS.FRICTION,
  airResistance: PHYSICS.AIR_RESISTANCE,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraTarget: null,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Input tracking
  keys: {},
  
  // Game specific
  grabbedLimb: null,
  isGrabbing: false,
  roundComplete: false,
  eliminationTimer: 0,
  
  // Tower stability
  towerSway: 0,
  swayVelocity: 0,
  
  // Particles for effects
  particles: []
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;