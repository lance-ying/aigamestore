import { BLOCK_SHAPES, BLOCK_COLORS, GRID_SIZE, gameState } from './globals.js';

// Generate a random block shape
export function generateRandomBlock(p) {
  const shapeIndex = Math.floor(p.random(BLOCK_SHAPES.length));
  const colorIndex = Math.floor(p.random(BLOCK_COLORS.length));
  
  return {
    shape: BLOCK_SHAPES[shapeIndex],
    color: BLOCK_COLORS[colorIndex],
    width: BLOCK_SHAPES[shapeIndex][0].length,
    height: BLOCK_SHAPES[shapeIndex].length
  };
}

// Generate three random blocks
export function generateBlocks(p) {
  const blocks = [];
  for (let i = 0; i < 3; i++) {
    blocks.push(generateRandomBlock(p));
  }
  return blocks;
}

// Check if a block can be placed at the given position
export function canPlaceBlock(block, x, y) {
  // Check if the block is within the grid boundaries
  if (x < 0 || y < 0 || x + block.width > GRID_SIZE || y + block.height > GRID_SIZE) {
    return false;
  }
  
  // Check if the block overlaps with any existing blocks
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      if (block.shape[i][j] === 1 && gameState.grid[y + i][x + j] !== 0) {
        return false;
      }
    }
  }
  
  return true;
}

// Place a block on the grid
export function placeBlock(block, x, y) {
  const colorIndex = BLOCK_COLORS.findIndex(color => 
    color[0] === block.color[0] && 
    color[1] === block.color[1] && 
    color[2] === block.color[2]
  ) + 1; // +1 because 0 means empty cell
  
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      if (block.shape[i][j] === 1) {
        gameState.grid[y + i][x + j] = colorIndex;
      }
    }
  }
}

// Check if any lines (rows or columns) are complete
export function checkLines() {
  let clearedLines = 0;
  const rowsToCheck = new Set();
  const colsToCheck = new Set();
  
  // Find all rows and columns that need to be checked
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[y][x] !== 0) {
        rowsToCheck.add(y);
        colsToCheck.add(x);
      }
    }
  }
  
  // Check rows
  const completedRows = [];
  for (const row of rowsToCheck) {
    let complete = true;
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[row][x] === 0) {
        complete = false;
        break;
      }
    }
    if (complete) {
      completedRows.push(row);
      clearedLines++;
    }
  }
  
  // Check columns
  const completedCols = [];
  for (const col of colsToCheck) {
    let complete = true;
    for (let y = 0; y < GRID_SIZE; y++) {
      if (gameState.grid[y][col] === 0) {
        complete = false;
        break;
      }
    }
    if (complete) {
      completedCols.push(col);
      clearedLines++;
    }
  }
  
  // Clear completed rows
  for (const row of completedRows) {
    for (let x = 0; x < GRID_SIZE; x++) {
      gameState.grid[row][x] = 0;
    }
  }
  
  // Clear completed columns
  for (const col of completedCols) {
    for (let y = 0; y < GRID_SIZE; y++) {
      gameState.grid[y][col] = 0;
    }
  }
  
  // Return the number of lines cleared
  return clearedLines;
}

// Check if any of the available blocks can be placed on the grid
export function canPlaceAnyBlock() {
  for (const block of gameState.availableBlocks) {
    for (let y = 0; y <= GRID_SIZE - block.height; y++) {
      for (let x = 0; x <= GRID_SIZE - block.width; x++) {
        if (canPlaceBlock(block, x, y)) {
          return true;
        }
      }
    }
  }
  return false;
}