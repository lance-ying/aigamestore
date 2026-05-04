// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  coins: [],
  hazards: [],
  platforms: [],
  exitPortal: null,
  score: 0,
  currentLevel: 0,
  totalLevels: 5,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  coinsCollected: 0,
  totalCoins: 0,
  deaths: 0,
  levelStartTime: 0,
  hardcoreMode: false,
  levelCompleted: false,
  cameraOffsetX: 0,
  cameraOffsetY: 0
};

// Physics constants
export const PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -12,
  MOVE_SPEED: 4,
  INFLATED_MOVE_SPEED: 6,
  DEFLATED_MOVE_SPEED: 2,
  INFLATION_RATE: 0.1,
  DEFLATION_RATE: 0.1,
  TERMINAL_VELOCITY: 15,
  FRICTION: 0.85,
  AIR_RESISTANCE: 0.98,
  INFLATED_GRAVITY: 0.15,
  DEFLATED_GRAVITY: 0.8
};

// Player states
export const PLAYER_STATES = {
  NORMAL: "NORMAL",
  INFLATED: "INFLATED",
  DEFLATED: "DEFLATED"
};

// Export function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}