import { GRID_SIZE, BLOCK_SHAPES, gameState, LEVELS } from './globals.js';

// Generate a random block shape
export function generateRandomBlock() {
  const shapeIndex = Math.floor(Math.random() * BLOCK_SHAPES.length);
  const colorIndex = Math.floor(Math.random() * BLOCK_SHAPES.length); // Using the same length for both arrays
  
  return {
    shape: BLOCK_SHAPES[shapeIndex],
    colorIndex: colorIndex
  };
}

// Generate a set of random blocks
export function generateBlocks(count) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    blocks.push(generateRandomBlock());
  }
  return blocks;
}

// Check if a block can be placed at a specific position
export function canPlaceBlock(grid, block, x, y) {
  const shape = block.shape;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        const gridX = x + col;
        const gridY = y + row;
        
        // Check if the position is within the grid
        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
          return false;
        }
        
        // Check if the cell is already occupied
        if (grid[gridY][gridX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Place a block on the grid
export function placeBlock(grid, block, x, y) {
  const shape = block.shape;
  const colorIndex = block.colorIndex;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        grid[y + row][x + col] = colorIndex + 1; // +1 so that 0 remains empty
      }
    }
  }
}

// Check for completed rows and columns
export function checkForCompletedLines(grid) {
  const completedRows = [];
  const completedCols = [];
  
  // Check rows
  for (let row = 0; row < GRID_SIZE; row++) {
    let isRowComplete = true;
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
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
      if (grid[row][col] === 0) {
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
export function clearCompletedLines(grid, completedRows, completedCols) {
  // Clear rows
  for (const row of completedRows) {
    for (let col = 0; col < GRID_SIZE; col++) {
      grid[row][col] = 0;
    }
  }
  
  // Clear columns
  for (const col of completedCols) {
    for (let row = 0; row < GRID_SIZE; row++) {
      grid[row][col] = 0;
    }
  }
  
  const totalLinesCleared = completedRows.length + completedCols.length;
  return totalLinesCleared;
}

// Calculate score based on lines cleared and combo
export function calculateScore(linesCleared, comboCount) {
  // Base score per line
  const baseScore = 10;
  
  // Bonus for multiple lines cleared at once
  let multiplier = 1;
  if (linesCleared > 1) {
    multiplier = Math.pow(2, linesCleared - 1);
  }
  
  // Combo bonus
  let comboBonus = 0;
  if (comboCount > 1) {
    comboBonus = comboCount * 5;
  }
  
  return (baseScore * linesCleared * multiplier) + comboBonus;
}

// Check if any of the available blocks can be placed on the grid
export function canPlaceAnyBlock() {
  const { grid, availableBlocks } = gameState;
  
  for (const block of availableBlocks) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlaceBlock(grid, block, x, y)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Reset the game state for a new game
export function resetGameState(resetLevel = true) {
  if (resetLevel) {
    gameState.player.score = 0;
    gameState.player.highScore = gameState.player.highScore; // Preserve high score
    gameState.level.currentIndex = 0;
  }
  
  gameState.player.comboCount = 0;
  gameState.player.lastClearedLines = 0;
  
  // Reset level progress
  gameState.level.linesCleared = 0;
  gameState.level.blocksPlaced = 0;
  
  gameState.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  gameState.availableBlocks = generateBlocks(3);
  gameState.selectedBlockIndex = 0;
  gameState.currentBlock = {
    shape: gameState.availableBlocks[0].shape,
    x: Math.floor(GRID_SIZE / 2),
    y: Math.floor(GRID_SIZE / 2)
  };
  gameState.framesSinceLastAction = 0;
  gameState.lastActionTaken = null;
  gameState.actionHistory = [];
  gameState.animations = [];

  // Clear any pending auto-restart when resetting game state
  if (gameState.autoRestartTimeoutId !== null) {
    console.log("Cancelling auto-restart due to resetGameState call.");
    clearTimeout(gameState.autoRestartTimeoutId);
    gameState.autoRestartTimeoutId = null;
  }
  gameState.autoRestartScheduled = false; // Ensure flag is reset
}

// Get the dimensions of a block shape
export function getBlockDimensions(shape) {
  return {
    width: shape[0].length,
    height: shape.length
  };
}