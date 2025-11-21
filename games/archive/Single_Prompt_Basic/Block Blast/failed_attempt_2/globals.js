// Game constants
export const GRID_SIZE = 9;
export const CELL_SIZE = 30;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 50;
export const BLOCK_PREVIEW_X = 30;
export const BLOCK_PREVIEW_Y = 100;
export const PREVIEW_CELL_SIZE = 15;

// Block types definitions
export const BLOCK_TYPES = [
  // 1x1 block
  { shape: [[1]], color: [255, 100, 100] },
  
  // 2x1 block
  { shape: [[1, 1]], color: [100, 255, 100] },
  
  // 1x2 block
  { shape: [[1], [1]], color: [100, 100, 255] },
  
  // 2x2 block
  { shape: [[1, 1], [1, 1]], color: [255, 255, 100] },
  
  // L shape
  { shape: [[1, 0], [1, 1]], color: [255, 100, 255] },
  
  // Reverse L shape
  { shape: [[0, 1], [1, 1]], color: [100, 255, 255] },
  
  // T shape
  { shape: [[1, 1, 1], [0, 1, 0]], color: [255, 150, 50] },
  
  // Z shape
  { shape: [[1, 1, 0], [0, 1, 1]], color: [150, 50, 255] },
  
  // S shape
  { shape: [[0, 1, 1], [1, 1, 0]], color: [50, 255, 150] },
];

// Game state object
export const gameState = {
  grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)),
  availableBlocks: [],
  selectedBlockIndex: 0,
  cursorX: Math.floor(GRID_SIZE / 2),
  cursorY: Math.floor(GRID_SIZE / 2),
  score: 0,
  combo: 0,
  lastClearTime: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  placementHistory: [],
  highScore: 0
};

// Function to get game state (exported and attached to window)
export function getGameState() {
  return gameState;
}

// Function to set control mode
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update UI buttons
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(`${mode.toLowerCase()}_ModeBtn`).classList.add('active');
  }
}

// Generate new random blocks
export function generateNewBlocks() {
  gameState.availableBlocks = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * BLOCK_TYPES.length);
    gameState.availableBlocks.push({
      type: BLOCK_TYPES[randomIndex],
      index: randomIndex
    });
  }
  gameState.selectedBlockIndex = 0;
}

// Check if a block can be placed at the current cursor position
export function canPlaceBlock(blockType, x, y) {
  const shape = blockType.shape;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        const gridX = x + col;
        const gridY = y + row;
        
        // Check if out of bounds
        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
          return false;
        }
        
        // Check if cell is already occupied
        if (gameState.grid[gridY][gridX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Place a block on the grid
export function placeBlock(blockType, x, y) {
  const shape = blockType.shape;
  const color = blockType.color;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        const gridX = x + col;
        const gridY = y + row;
        
        // Set the cell to the block's color index
        gameState.grid[gridY][gridX] = { color };
      }
    }
  }
  
  // Add to placement history
  gameState.placementHistory.push({
    block: gameState.availableBlocks[gameState.selectedBlockIndex],
    x,
    y,
    time: Date.now()
  });
  
  // Remove the placed block from available blocks
  gameState.availableBlocks.splice(gameState.selectedBlockIndex, 1);
  
  // If no blocks left, generate new ones
  if (gameState.availableBlocks.length === 0) {
    generateNewBlocks();
  } else if (gameState.selectedBlockIndex >= gameState.availableBlocks.length) {
    gameState.selectedBlockIndex = 0;
  }
  
  return true;
}

// Check for completed rows and columns
export function checkCompletedLines() {
  let completedRows = [];
  let completedCols = [];
  
  // Check rows
  for (let row = 0; row < GRID_SIZE; row++) {
    let isRowComplete = true;
    for (let col = 0; col < GRID_SIZE; col++) {
      if (gameState.grid[row][col] === 0) {
        isRowComplete = false;
        break;
      }
    }
    if (isRowComplete) {
      completedRows.push(row);
    }
  }
  
  // Check columns
  for (let col = 0; col < GRID_SIZE; col++) {
    let isColComplete = true;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (gameState.grid[row][col] === 0) {
        isColComplete = false;
        break;
      }
    }
    if (isColComplete) {
      completedCols.push(col);
    }
  }
  
  return { completedRows, completedCols };
}

// Clear completed lines and update score
export function clearCompletedLines() {
  const { completedRows, completedCols } = checkCompletedLines();
  const totalLines = completedRows.length + completedCols.length;
  
  if (totalLines === 0) {
    gameState.combo = 0;
    return false;
  }
  
  // Clear rows
  for (const row of completedRows) {
    for (let col = 0; col < GRID_SIZE; col++) {
      gameState.grid[row][col] = 0;
    }
  }
  
  // Clear columns
  for (const col of completedCols) {
    for (let row = 0; row < GRID_SIZE; row++) {
      gameState.grid[row][col] = 0;
    }
  }
  
  // Calculate score
  const now = Date.now();
  const timeSinceLastClear = now - gameState.lastClearTime;
  
  // Combo system
  if (timeSinceLastClear < 5000) { // 5 seconds for combo
    gameState.combo++;
  } else {
    gameState.combo = 0;
  }
  
  // Base score: 100 points per line
  let points = totalLines * 100;
  
  // Combo bonus: 50 points per combo level
  points += gameState.combo * 50;
  
  // Multiple lines bonus: 50 points per additional line
  if (totalLines > 1) {
    points += (totalLines - 1) * 50;
  }
  
  gameState.score += points;
  gameState.lastClearTime = now;
  
  return true;
}

// Check if game is over (no more possible placements)
export function checkGameOver() {
  if (gameState.availableBlocks.length === 0) {
    return true;
  }
  
  // Check if any available block can be placed anywhere on the grid
  for (const block of gameState.availableBlocks) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlaceBlock(block.type, x, y)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Reset game state
export function resetGame() {
  gameState.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  gameState.availableBlocks = [];
  gameState.selectedBlockIndex = 0;
  gameState.cursorX = Math.floor(GRID_SIZE / 2);
  gameState.cursorY = Math.floor(GRID_SIZE / 2);
  gameState.score = 0;
  gameState.combo = 0;
  gameState.lastClearTime = 0;
  gameState.placementHistory = [];
  
  // Keep high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
  }
  
  generateNewBlocks();
}

// Attach functions to window
window.getGameState = getGameState;
window.setControlMode = setControlMode;