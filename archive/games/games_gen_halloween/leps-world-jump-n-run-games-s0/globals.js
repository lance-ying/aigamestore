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
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  player: null,
  entities: [],
  coins: [],
  enemies: [],
  cloverleaves: [],
  platforms: [],
  flag: null,
  score: 0,
  currentLevel: 1,
  camera: { x: 0, y: 0 },
  keys: {},
  // Test tracking
  testFrameCount: 0,
  testData: {
    jumpHeights: [],
    coinsCollected: 0,
    enemiesDefeated: 0,
    damageTaken: 0
  }
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;