// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const CELL_SIZE = 35;
export const GRID_OFFSET_X = 50;
export const GRID_OFFSET_Y = 60;

export const MAX_ERRORS = 5;

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Puzzle data
  grid: [], // 9x9 array of cell objects
  fixedCells: [], // Array of {row, col} for fixed cells
  difficulty: "EASY", // "EASY", "MEDIUM", "HARD", "EXPERT"
  
  // Player state
  selectedRow: 0,
  selectedCol: 0,
  pencilMarkMode: false,
  errors: 0,
  correctPlacements: 0,
  hintsUsed: 0,
  
  // Game tracking
  score: 0,
  startTime: 0,
  elapsedTime: 0,
  pausedTime: 0,
  
  // History for undo
  history: [],
  
  // Player info for logging
  player: {
    x: 0,
    y: 0,
    row: 0,
    col: 0
  },
  
  // Testing
  testingActions: [],
  testingIndex: 0
};

// Difficulty settings
export const DIFFICULTY_SETTINGS = {
  EASY: { 
    filledCells: 52, 
    timeBonus: 500, 
    multiplier: 1.0,
    name: "Easy"
  },
  MEDIUM: { 
    filledCells: 42, 
    timeBonus: 750, 
    multiplier: 1.2,
    name: "Medium"
  },
  HARD: { 
    filledCells: 32, 
    timeBonus: 1000, 
    multiplier: 1.5,
    name: "Hard"
  },
  EXPERT: { 
    filledCells: 25, 
    timeBonus: 1500, 
    multiplier: 2.0,
    name: "Expert"
  }
};

// Scoring constants
export const SCORE_CONSTANTS = {
  CORRECT_NUMBER: 10,
  INCORRECT_NUMBER: -50,
  HINT_PENALTY: -100,
  COMPLETION_BONUS: 500,
  TIME_PENALTY_PER_SECOND: 1
};