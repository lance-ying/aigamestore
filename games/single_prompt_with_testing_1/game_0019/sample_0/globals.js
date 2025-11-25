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

// Game state object
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  coins: [],
  barriers: [],
  swingPoints: [],
  checkpoints: [],
  portal: null,
  
  score: 0,
  health: 3,
  maxHealth: 3,
  
  abilities: {
    doubleJump: false,
    karateKick: false,
    hookSwing: false
  },
  
  lastCheckpoint: { x: 100, y: 300 },
  
  invincible: false,
  invincibilityTimer: 0,
  
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  engine: null,
  world: null,
  
  // Testing state
  testFrameCount: 0,
  testPhase: 0,
  
  // Ability unlock thresholds
  abilityThresholds: {
    doubleJump: 50,
    hookSwing: 100,
    karateKick: 25
  }
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}