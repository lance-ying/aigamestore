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

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player and game progress
  currentLevel: 1,
  totalLevels: 5,
  difficulty: "MEDIUM", // EASY, MEDIUM, HARD
  score: 0,
  hintsRemaining: 3,
  
  // Grid state
  grid: [],
  gridSize: { rows: 0, cols: 0 },
  selectedCell: { row: -1, col: -1 },
  stagedNumber: null,
  mistakes: 0,
  maxMistakes: 2,
  
  // Timer
  levelStartTime: 0,
  elapsedTime: 0,
  maxLevelTime: 300, // seconds
  
  // Level completion tracking
  levelsCompleted: 0,
  
  // Entities for tracking
  player: null,
  entities: []
};

// Cell types
export const CELL_TYPES = {
  EMPTY: "EMPTY",
  FIXED: "FIXED",
  OPERATOR: "OPERATOR",
  RESULT: "RESULT"
};

// Operators
export const OPERATORS = ["+", "-", "*", "/"];

// Grid layout constants
export const GRID_START_X = 50;
export const GRID_START_Y = 80;
export const CELL_SIZE = 50;
export const CELL_PADDING = 5;

// Colors
export const COLORS = {
  BACKGROUND: [34, 34, 34],
  CELL_EMPTY: [255, 255, 255],
  CELL_FIXED: [220, 220, 220],
  CELL_OPERATOR: [80, 80, 80],
  CELL_RESULT: [160, 160, 160],
  CELL_SELECTED: [0, 123, 255],
  CELL_ERROR: [255, 80, 80],
  CELL_HINT: [80, 255, 120],
  TEXT_DARK: [0, 0, 0],
  TEXT_LIGHT: [255, 255, 255],
  UI_TEXT: [200, 200, 200]
};