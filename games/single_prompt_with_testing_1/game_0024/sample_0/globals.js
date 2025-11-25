// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Playfield dimensions
export const GRID_COLS = 10;
export const GRID_ROWS = 20;
export const CELL_SIZE = 18;
export const PLAYFIELD_X = 200;
export const PLAYFIELD_Y = 20;

// Tetromino shapes (relative to rotation center)
export const SHAPES = {
  I: [[0, -1], [0, 0], [0, 1], [0, 2]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[-1, 0], [0, 0], [1, 0], [0, 1]],
  S: [[-1, 1], [0, 1], [0, 0], [1, 0]],
  Z: [[-1, 0], [0, 0], [0, 1], [1, 1]],
  J: [[-1, 0], [0, 0], [1, 0], [-1, 1]],
  L: [[-1, 0], [0, 0], [1, 0], [1, 1]]
};

export const SHAPE_COLORS = {
  I: [0, 240, 240],
  O: [240, 240, 0],
  T: [160, 0, 240],
  S: [0, 240, 0],
  Z: [240, 0, 0],
  J: [0, 0, 240],
  L: [240, 160, 0]
};

export const SHAPE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Game state object
export const gameState = {
  gamePhase: "START",
  controlMode: "HUMAN",
  score: 0,
  level: 1,
  linesCleared: 0,
  
  // Playfield grid (0 = empty, color array = filled)
  grid: [],
  
  // Current falling piece
  currentPiece: null,
  currentShape: null,
  currentColor: null,
  currentRotation: 0,
  pieceX: 0,
  pieceY: 0,
  
  // Next piece
  nextShape: null,
  nextColor: null,
  
  // Timing
  fallSpeed: 800, // milliseconds per grid cell
  lastFallTime: 0,
  softDrop: false,
  lockDelay: 500, // milliseconds before piece locks
  lockDelayTimer: 0,
  isPieceLocked: false,
  
  // Animation
  clearingLines: [],
  clearAnimationTimer: 0,
  clearAnimationDuration: 300,
  
  // Control states
  keysPressed: {},
  moveRepeatDelay: 150,
  moveRepeatRate: 50,
  lastMoveTime: 0,
  
  // Testing
  testActions: [],
  testActionIndex: 0
};

// Initialize grid
export function initializeGrid() {
  gameState.grid = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      gameState.grid[row][col] = 0;
    }
  }
}

// Expose gameState getter
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;