// globals.js - Game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 9;
export const CELL_SIZE = 30;
export const GRID_START_X = 50;
export const GRID_START_Y = 60;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  level: 1,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER", "PAUSED", "LEVEL_TRANSITION", "WIN"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  grid: [], // 9x9 grid of cells
  availableBlocks: [], // 3 blocks available to place
  selectedBlockIndex: 0,
  cursorX: 4,
  cursorY: 4,
  streak: 0,
  lastClearCount: 0,
  prefilledCells: [],
  levelTargets: [200, 500, 1000, 1800, 3000],
  transitionTimer: 0,
  transitionDuration: 120, // frames
  gameOverChecked: false
};

// Block shape definitions (relative coordinates)
export const BLOCK_SHAPES = {
  // Level 1 shapes
  SINGLE: [[0, 0]],
  HORIZONTAL_2: [[0, 0], [1, 0]],
  VERTICAL_2: [[0, 0], [0, 1]],
  HORIZONTAL_3: [[0, 0], [1, 0], [2, 0]],
  VERTICAL_3: [[0, 0], [0, 1], [0, 2]],
  SQUARE_2X2: [[0, 0], [1, 0], [0, 1], [1, 1]],
  
  // Level 2+ shapes
  L_SHAPE_1: [[0, 0], [0, 1], [0, 2], [1, 2]],
  L_SHAPE_2: [[0, 0], [1, 0], [2, 0], [0, 1]],
  L_SHAPE_3: [[0, 0], [1, 0], [1, 1], [1, 2]],
  L_SHAPE_4: [[0, 1], [1, 1], [2, 1], [2, 0]],
  T_SHAPE: [[0, 0], [1, 0], [2, 0], [1, 1]],
  Z_SHAPE: [[0, 0], [1, 0], [1, 1], [2, 1]],
  S_SHAPE: [[1, 0], [2, 0], [0, 1], [1, 1]],
  
  // Level 3+ shapes
  BIG_L: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  SQUARE_3X3: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  HOLLOW_SQUARE: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  PLUS_SHAPE: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  
  // Level 4+ shapes
  HORIZONTAL_4: [[0, 0], [1, 0], [2, 0], [3, 0]],
  VERTICAL_4: [[0, 0], [0, 1], [0, 2], [0, 3]],
  HORIZONTAL_5: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  BIG_T: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]]
};

export const BLOCK_COLORS = {
  0: [255, 100, 100],  // Red
  1: [100, 150, 255],  // Blue
  2: [100, 255, 150],  // Green
  3: [255, 220, 100],  // Yellow
  4: [255, 150, 255],  // Purple
  5: [255, 180, 100],  // Orange
  6: [150, 255, 255],  // Cyan
  7: [255, 100, 200]   // Pink
};