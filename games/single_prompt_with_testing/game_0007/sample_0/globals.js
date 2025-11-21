// globals.js
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
  TEST_5: "TEST_5"
};

export const KEY_CODES = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  Z: 90,
  R: 82,
  SHIFT: 16
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  level: 1,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  currentBall: null,
  targetBall: null,
  tools: [],
  selectedToolIndex: 0,
  appliedOperations: [],
  maxLevels: 20,
  toolPaletteY: 320,
  ballY: 150,
  lastInputFrame: 0,
  inputCooldown: 10
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export default gameState;