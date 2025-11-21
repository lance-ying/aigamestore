import { 
  gameState, 
  GRID_SIZE,
  canPlaceBlock
} from './globals.js';

// TEST 1: Basic functionality test with sticky keys
function getStickyKeysAction(gameState) {
  // Every 30 frames, choose a new action
  const frameCount = window.gameInstance.frameCount;
  const actionSeed = Math.floor(frameCount / 30) % 10;
  
  // If we're not in PLAYING phase, do nothing
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Choose action based on seed
  switch (actionSeed) {
    case 0:
      return 37; // LEFT
    case 1:
      return 38; // UP
    case 2:
      return 39; // RIGHT
    case 3:
      return 40; // DOWN
    case 4:
      // Try to place block if possible
      if (gameState.availableBlocks.length > 0) {
        const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
        if (canPlaceBlock(selectedBlock.type, gameState.cursorX, gameState.cursorY)) {
          return 32; // SPACE
        }
      }
      return 90; // Z (cycle blocks)
    case 5:
      return 90; // Z (cycle blocks)
    default:
      // Move randomly
      return [37, 38, 39, 40][Math.floor(Math.random() * 4)];
  }
}

// TEST 2: Win strategy test
function getTestWinAction(gameState) {
  // If we're not in PLAYING phase, do nothing
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // If no blocks available, do nothing
  if (gameState.availableBlocks.length === 0) {
    return null;
  }
  
  const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
  const frameCount = window.gameInstance.frameCount;
  
  // Every few frames, try a different strategy
  const strategyPhase = Math.floor(frameCount / 60) % 3;
  
  // Check if current block can be placed at current position
  if (canPlaceBlock(selectedBlock.type, gameState.cursorX, gameState.cursorY)) {
    return 32; // SPACE (place block)
  }
  
  // Different strategies based on phase
  switch (strategyPhase) {
    case 0:
      // Strategy 1: Fill from left to right, top to bottom
      return fillLeftToRightTopToBottom();
    case 1:
      // Strategy 2: Fill to complete rows/columns
      return fillToCompleteLines();
    case 2:
      // Strategy 3: Try to find best fit for current block
      return findBestFitForBlock();
    default:
      return 90; // Z (cycle blocks)
  }
  
  // Strategy 1: Fill from left to right, top to bottom
  function fillLeftToRightTopToBottom() {
    // Check all blocks to find one that can be placed
    for (let i = 0; i < gameState.availableBlocks.length; i++) {
      // If not on the right block, cycle
      if (gameState.selectedBlockIndex !== i) {
        return 90; // Z (cycle blocks)
      }
      
      // Try to place from top-left to bottom-right
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceBlock(selectedBlock.type, x, y)) {
            // Move cursor to position
            if (gameState.cursorX < x) return 39; // RIGHT
            if (gameState.cursorX > x) return 37; // LEFT
            if (gameState.cursorY < y) return 40; // DOWN
            if (gameState.cursorY > y) return 38; // UP
            
            // If at position, place block
            return 32; // SPACE
          }
        }
      }
    }
    
    // If no placement found, cycle blocks
    return 90; // Z
  }
  
  // Strategy 2: Fill to complete rows/columns
  function fillToCompleteLines() {
    // Count filled cells in each row and column
    const rowCounts = Array(GRID_SIZE).fill(0);
    const colCounts = Array(GRID_SIZE).fill(0);
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (gameState.grid[y][x] !== 0) {
          rowCounts[y]++;
          colCounts[x]++;
        }
      }
    }
    
    // Find rows/cols that are almost complete (>= 6 filled cells)
    const nearCompleteRows = [];
    const nearCompleteCols = [];
    
    for (let i = 0; i < GRID_SIZE; i++) {
      if (rowCounts[i] >= 6 && rowCounts[i] < GRID_SIZE) {
        nearCompleteRows.push(i);
      }
      if (colCounts[i] >= 6 && colCounts[i] < GRID_SIZE) {
        nearCompleteCols.push(i);
      }
    }
    
    // Try to place in near-complete rows/columns
    for (let i = 0; i < gameState.availableBlocks.length; i++) {
      // If not on the right block, cycle
      if (gameState.selectedBlockIndex !== i) {
        return 90; // Z (cycle blocks)
      }
      
      // Try rows first
      for (const row of nearCompleteRows) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceBlock(selectedBlock.type, x, row)) {
            // Move cursor to position
            if (gameState.cursorX < x) return 39; // RIGHT
            if (gameState.cursorX > x) return 37; // LEFT
            if (gameState.cursorY < row) return 40; // DOWN
            if (gameState.cursorY > row) return 38; // UP
            
            // If at position, place block
            return 32; // SPACE
          }
        }
      }
      
      // Then try columns
      for (const col of nearCompleteCols) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (canPlaceBlock(selectedBlock.type, col, y)) {
            // Move cursor to position
            if (gameState.cursorX < col) return 39; // RIGHT
            if (gameState.cursorX > col) return 37; // LEFT
            if (gameState.cursorY < y) return 40; // DOWN
            if (gameState.cursorY > y) return 38; // UP
            
            // If at position, place block
            return 32; // SPACE
          }
        }
      }
    }
    
    // If no good placement found, fall back to default strategy
    return fillLeftToRightTopToBottom();
  }
  
  // Strategy 3: Find best fit for current block
  function findBestFitForBlock() {
    // Try all blocks
    for (let i = 0; i < gameState.availableBlocks.length; i++) {
      // If not on the right block, cycle
      if (gameState.selectedBlockIndex !== i) {
        return 90; // Z (cycle blocks)
      }
      
      let bestX = -1;
      let bestY = -1;
      let bestScore = -1;
      
      // Try all positions
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceBlock(selectedBlock.type, x, y)) {
            // Calculate score for this position
            let score = 0;
            
            // Prefer positions that would complete lines
            const shape = selectedBlock.type.shape;
            const rowsAffected = new Set();
            const colsAffected = new Set();
            
            for (let sy = 0; sy < shape.length; sy++) {
              for (let sx = 0; sx < shape[0].length; sx++) {
                if (shape[sy][sx] === 1) {
                  rowsAffected.add(y + sy);
                  colsAffected.add(x + sx);
                }
              }
            }
            
            // Check if placing would complete any lines
            for (const row of rowsAffected) {
              let emptyInRow = 0;
              for (let cx = 0; cx < GRID_SIZE; cx++) {
                if (gameState.grid[row][cx] === 0) {
                  // Check if this position would be filled by the block
                  let wouldBeFilled = false;
                  for (let sy = 0; sy < shape.length; sy++) {
                    for (let sx = 0; sx < shape[0].length; sx++) {
                      if (shape[sy][sx] === 1 && y + sy === row && x + sx === cx) {
                        wouldBeFilled = true;
                      }
                    }
                  }
                  if (!wouldBeFilled) {
                    emptyInRow++;
                  }
                }
              }
              if (emptyInRow === 0) {
                score += 100; // Would complete a row
              } else if (emptyInRow <= 2) {
                score += 50; // Almost complete a row
              }
            }
            
            for (const col of colsAffected) {
              let emptyInCol = 0;
              for (let cy = 0; cy < GRID_SIZE; cy++) {
                if (gameState.grid[cy][col] === 0) {
                  // Check if this position would be filled by the block
                  let wouldBeFilled = false;
                  for (let sy = 0; sy < shape.length; sy++) {
                    for (let sx = 0; sx < shape[0].length; sx++) {
                      if (shape[sy][sx] === 1 && y + sy === cy && x + sx === col) {
                        wouldBeFilled = true;
                      }
                    }
                  }
                  if (!wouldBeFilled) {
                    emptyInCol++;
                  }
                }
              }
              if (emptyInCol === 0) {
                score += 100; // Would complete a column
              } else if (emptyInCol <= 2) {
                score += 50; // Almost complete a column
              }
            }
            
            // Prefer positions near the edges or with adjacent filled cells
            let adjacentFilled = 0;
            for (let sy = 0; sy < shape.length; sy++) {
              for (let sx = 0; sx < shape[0].length; sx++) {
                if (shape[sy][sx] === 1) {
                  const gx = x + sx;
                  const gy = y + sy;
                  
                  // Check adjacent cells
                  if (gx > 0 && gameState.grid[gy][gx-1] !== 0) adjacentFilled++;
                  if (gx < GRID_SIZE-1 && gameState.grid[gy][gx+1] !== 0) adjacentFilled++;
                  if (gy > 0 && gameState.grid[gy-1][gx] !== 0) adjacentFilled++;
                  if (gy < GRID_SIZE-1 && gameState.grid[gy+1][gx] !== 0) adjacentFilled++;
                  
                  // Bonus for edge positions
                  if (gx === 0 || gx === GRID_SIZE-1) score += 5;
                  if (gy === 0 || gy === GRID_SIZE-1) score += 5;
                }
              }
            }
            
            score += adjacentFilled * 10;
            
            // Update best position if score is higher
            if (score > bestScore) {
              bestScore = score;
              bestX = x;
              bestY = y;
            }
          }
        }
      }
      
      // If found a good position, move to it
      if (bestX !== -1 && bestY !== -1) {
        // Move cursor to position
        if (gameState.cursorX < bestX) return 39; // RIGHT
        if (gameState.cursorX > bestX) return 37; // LEFT
        if (gameState.cursorY < bestY) return 40; // DOWN
        if (gameState.cursorY > bestY) return 38; // UP
        
        // If at position, place block
        return 32; // SPACE
      }
    }
    
    // If no good placement found, cycle blocks
    return 90; // Z
  }
}

// TEST 3: Block selection test
function getBlockSelectionTestAction(gameState) {
  // If we're not in PLAYING phase, do nothing
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  const frameCount = window.gameInstance.frameCount;
  
  // Every 10 frames, cycle blocks
  if (frameCount % 10 === 0) {
    return 90; // Z (cycle blocks)
  }
  
  // Every 30 frames, try to place the current block
  if (frameCount % 30 === 0) {
    // Find a place to put the current block
    if (gameState.availableBlocks.length > 0) {
      const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
      
      // Try all positions
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceBlock(selectedBlock.type, x, y)) {
            // Move cursor to position
            if (gameState.cursorX < x) return 39; // RIGHT
            if (gameState.cursorX > x) return 37; // LEFT
            if (gameState.cursorY < y) return 40; // DOWN
            if (gameState.cursorY > y) return 38; // UP
            
            // If at position, place block
            if (gameState.cursorX === x && gameState.cursorY === y) {
              return 32; // SPACE
            }
          }
        }
      }
    }
  }
  
  // Move cursor randomly
  const moveDir = Math.floor(Math.random() * 4);
  return [37, 38, 39, 40][moveDir];
}

// TEST 4: Line clearing test
function getLineClearTestAction(gameState) {
  // If we're not in PLAYING phase, do nothing
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Count filled cells in each row and column
  const rowCounts = Array(GRID_SIZE).fill(0);
  const colCounts = Array(GRID_SIZE).fill(0);
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (gameState.grid[y][x] !== 0) {
        rowCounts[y]++;
        colCounts[x]++;
      }
    }
  }
  
  // Find the most filled row and column
  let bestRow = -1;
  let bestRowCount = -1;
  let bestCol = -1;
  let bestColCount = -1;
  
  for (let i = 0; i < GRID_SIZE; i++) {
    if (rowCounts[i] > bestRowCount && rowCounts[i] < GRID_SIZE) {
      bestRowCount = rowCounts[i];
      bestRow = i;
    }
    if (colCounts[i] > bestColCount && colCounts[i] < GRID_SIZE) {
      bestColCount = colCounts[i];
      bestCol = i;
    }
  }
  
  // Try to place blocks to complete lines
  for (let i = 0; i < gameState.availableBlocks.length; i++) {
    // If not on the right block, cycle
    if (gameState.selectedBlockIndex !== i) {
      return 90; // Z (cycle blocks)
    }
    
    const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
    
    // Try to place in the best row first
    if (bestRow !== -1) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (gameState.grid[bestRow][x] === 0 && canPlaceBlock(selectedBlock.type, x, bestRow)) {
          // Move cursor to position
          if (gameState.cursorX < x) return 39; // RIGHT
          if (gameState.cursorX > x) return 37; // LEFT
          if (gameState.cursorY < bestRow) return 40; // DOWN
          if (gameState.cursorY > bestRow) return 38; // UP
          
          // If at position, place block
          if (gameState.cursorX === x && gameState.cursorY === bestRow) {
            return 32; // SPACE
          }
        }
      }
    }
    
    // Then try the best column
    if (bestCol !== -1) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (gameState.grid[y][bestCol] === 0 && canPlaceBlock(selectedBlock.type, bestCol, y)) {
          // Move cursor to position
          if (gameState.cursorX < bestCol) return 39; // RIGHT
          if (gameState.cursorX > bestCol) return 37; // LEFT
          if (gameState.cursorY < y) return 40; // DOWN
          if (gameState.cursorY > y) return 38; // UP
          
          // If at position, place block
          if (gameState.cursorX === bestCol && gameState.cursorY === y) {
            return 32; // SPACE
          }
        }
      }
    }
  }
  
  // If no good placement found, fall back to default strategy
  return getStickyKeysAction(gameState);
}

// TEST 5: Game over test
function getGameOverTestAction(gameState) {
  // If we're not in PLAYING phase, do nothing
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Strategy: Fill the grid from top-left to bottom-right to trigger game over
  for (let i = 0; i < gameState.availableBlocks.length; i++) {
    // If not on the right block, cycle
    if (gameState.selectedBlockIndex !== i) {
      return 90; // Z (cycle blocks)
    }
    
    const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
    
    // Try to place blocks in a pattern that will eventually make placement impossible
    // Focus on filling the top-left corner first
    for (let y = 0; y < Math.ceil(GRID_SIZE/2); y++) {
      for (let x = 0; x < Math.ceil(GRID_SIZE/2); x++) {
        if (canPlaceBlock(selectedBlock.type, x, y)) {
          // Move cursor to position
          if (gameState.cursorX < x) return 39; // RIGHT
          if (gameState.cursorX > x) return 37; // LEFT
          if (gameState.cursorY < y) return 40; // DOWN
          if (gameState.cursorY > y) return 38; // UP
          
          // If at position, place block
          if (gameState.cursorX === x && gameState.cursorY === y) {
            return 32; // SPACE
          }
        }
      }
    }
    
    // Then try the rest of the grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlaceBlock(selectedBlock.type, x, y)) {
          // Move cursor to position
          if (gameState.cursorX < x) return 39; // RIGHT
          if (gameState.cursorX > x) return 37; // LEFT
          if (gameState.cursorY < y) return 40; // DOWN
          if (gameState.cursorY > y) return 38; // UP
          
          // If at position, place block
          if (gameState.cursorX === x && gameState.cursorY === y) {
            return 32; // SPACE
          }
        }
      }
    }
  }
  
  // If no placement found, cycle blocks
  return 90; // Z
}

// Main testing controller
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getBlockSelectionTestAction(gameState);
    case "TEST_4":
      return getLineClearTestAction(gameState);
    case "TEST_5":
      return getGameOverTestAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;