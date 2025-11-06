// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases - export as object
export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Also export individual constants for backward compatibility
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const CONTROL_MODE_HUMAN = "HUMAN";
export const CONTROL_MODE_TEST_1 = "TEST_1";
export const CONTROL_MODE_TEST_2 = "TEST_2";

// Item types
export const ITEM_TYPES = {
  RED_CIRCLE: "RED_CIRCLE",
  BLUE_SQUARE: "BLUE_SQUARE",
  GREEN_TRIANGLE: "GREEN_TRIANGLE",
  YELLOW_DIAMOND: "YELLOW_DIAMOND",
  PURPLE_HEXAGON: "PURPLE_HEXAGON"
};

export const ITEM_COLORS = {
  RED_CIRCLE: [220, 50, 50],
  BLUE_SQUARE: [50, 120, 220],
  GREEN_TRIANGLE: [50, 200, 80],
  YELLOW_DIAMOND: [240, 200, 50],
  PURPLE_HEXAGON: [180, 80, 200]
};

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_MODE_HUMAN,
  currentLevel: 1,
  score: 0,
  highScore: 0,
  timeRemaining: 0,
  timeLimit: 60,
  selectorX: 0,
  selectorY: 0,
  selectorIndex: 0,
  isHoldingItem: false,
  heldItemId: null,
  items: [],
  containers: [],
  player: null, // Reference to selector state
  entities: [], // All interactive entities
  levelConfig: null
};

export const SELECTOR_SIZE = 60;
export const CONTAINER_SIZE = 80;
export const ITEM_SIZE = 35;
export const GRID_COLS = 8;
export const GRID_ROWS = 5;
export const CELL_WIDTH = CANVAS_WIDTH / GRID_COLS;
export const CELL_HEIGHT = CANVAS_HEIGHT / GRID_ROWS;

// Scoring
export const POINTS_CORRECT = 100;
export const POINTS_INCORRECT = -25;

// Expose gameState globally - always available
window.getGameState = function() {
  return {
    phase: gameState.gamePhase,
    gamePhase: gameState.gamePhase,
    controlMode: gameState.controlMode,
    currentLevel: gameState.currentLevel,
    score: gameState.score,
    timeRemaining: gameState.timeRemaining,
    isHoldingItem: gameState.isHoldingItem,
    items: gameState.items,
    containers: gameState.containers
  };
};