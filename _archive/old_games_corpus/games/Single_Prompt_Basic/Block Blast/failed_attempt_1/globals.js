// Game constants and global state
export const GRID_SIZE = 9;
export const CELL_SIZE = 30;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 50;
export const BLOCK_COLORS = [
  [255, 100, 100], // Red
  [100, 255, 100], // Green
  [100, 100, 255], // Blue
  [255, 255, 100], // Yellow
  [255, 100, 255], // Magenta
  [100, 255, 255], // Cyan
];

// Block shapes - represented as 2D arrays where 1 indicates a filled cell
export const BLOCK_SHAPES = [
  // Single block
  [[1]],
  
  // 2-block shapes
  [[1, 1]],
  [[1], [1]],
  
  // 3-block shapes
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1]],
  [[1, 1], [0, 1]],
  [[1], [1, 1]],
  [[0, 1], [1, 1]],
  
  // 4-block shapes
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [1]],
  [[1], [1, 1, 1]],
  [[1, 1, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1], [1, 0], [1, 0]],
  [[1, 1], [0, 1], [0, 1]],
];

// Game state object
export const gameState = {
  grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)),
  availableBlocks: [],
  selectedBlockIndex: 0,
  currentBlockX: 0,
  currentBlockY: 0,
  score: 0,
  highScore: 0,
  combo: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  lastPlacedTime: 0,
  lastClearedLines: 0,
};

// Function to reset the game state
export function resetGameState() {
  gameState.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  gameState.availableBlocks = [];
  gameState.selectedBlockIndex = 0;
  gameState.currentBlockX = 0;
  gameState.currentBlockY = 0;
  gameState.score = 0;
  gameState.combo = 0;
  gameState.gamePhase = "START";
  gameState.lastPlacedTime = 0;
  gameState.lastClearedLines = 0;
}

// Function to get the game state
export function getGameState() {
  return gameState;
}