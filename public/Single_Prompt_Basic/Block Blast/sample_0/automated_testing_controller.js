import { gameState, GRID_SIZE, MIN_SCORE_TO_WIN } from './globals.js';
import { canPlaceBlock } from './utils.js';
import { KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_Z } from './input.js';

// Helper function to check if we're stuck in the same position
function isStuck(history, currentPos, threshold = 60) {
  if (history.length < threshold) return false;
  
  const recentHistory = history.slice(-threshold);
  const uniquePositions = new Set(recentHistory.map(pos => `${pos.x},${pos.y},${pos.blockIndex}`));
  
  return uniquePositions.size < 3; // If we have less than 3 unique positions, we're probably stuck
}

// Basic testing with sticky keys
function getStickyKeysAction(gameState) {
  // Only take actions during PLAYING phase
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track position to detect if we're stuck
  gameState.actionHistory.push({
    x: gameState.currentBlock.x,
    y: gameState.currentBlock.y,
    blockIndex: gameState.selectedBlockIndex
  });
  
  // If we're stuck, take a random action
  if (isStuck(gameState.actionHistory, gameState.currentBlock)) {
    const randomAction = Math.floor(Math.random() * 6);
    switch (randomAction) {
      case 0: return KEY_LEFT;
      case 1: return KEY_RIGHT;
      case 2: return KEY_UP;
      case 3: return KEY_DOWN;
      case 4: return KEY_Z;
      case 5: return KEY_SPACE;
    }
  }
  
  // Every 30 frames, change the action
  gameState.framesSinceLastAction++;
  if (gameState.framesSinceLastAction >= 30) {
    gameState.framesSinceLastAction = 0;
    
    // Choose a random action
    const actions = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_Z];
    const randomIndex = Math.floor(Math.random() * actions.length);
    gameState.lastActionTaken = actions[randomIndex];
  }
  
  // Every 5 actions, try to place a block
  if (gameState.framesSinceLastAction % 5 === 0) {
    const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
    if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], currentBlock.x, currentBlock.y)) {
      return KEY_SPACE;
    }
  }
  
  return gameState.lastActionTaken;
}

// Test to demonstrate winning the game
function getTestWinAction(gameState) {
  // Only take actions during PLAYING phase
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track position to detect if we're stuck
  gameState.actionHistory.push({
    x: gameState.currentBlock.x,
    y: gameState.currentBlock.y,
    blockIndex: gameState.selectedBlockIndex
  });
  
  // If we're stuck, cycle through blocks or take a random movement
  if (isStuck(gameState.actionHistory, gameState.currentBlock)) {
    const randomAction = Math.floor(Math.random() * 5);
    switch (randomAction) {
      case 0: return KEY_LEFT;
      case 1: return KEY_RIGHT;
      case 2: return KEY_UP;
      case 3: return KEY_DOWN;
      case 4: return KEY_Z;
    }
  }
  
  const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
  
  // Try to find the best block to use
  let bestBlockIndex = selectedBlockIndex;
  let bestScore = -1;
  
  for (let i = 0; i < availableBlocks.length; i++) {
    const block = availableBlocks[i];
    
    // Calculate how many cells this block would fill
    let cellCount = 0;
    for (let row = 0; row < block.shape.length; row++) {
      for (let col = 0; col < block.shape[row].length; col++) {
        if (block.shape[row][col] === 1) {
          cellCount++;
        }
      }
    }
    
    // Prefer blocks with more cells
    if (cellCount > bestScore) {
      bestScore = cellCount;
      bestBlockIndex = i;
    }
  }
  
  // If we're not on the best block, cycle to it
  if (selectedBlockIndex !== bestBlockIndex) {
    return KEY_Z;
  }
  
  // Find the best position to place the block
  let bestX = currentBlock.x;
  let bestY = currentBlock.y;
  let bestPositionScore = -1;
  
  // Scan the grid for potential placements
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], x, y)) {
        // Calculate how many adjacent filled cells this placement would have
        let adjacentFilled = 0;
        const shape = availableBlocks[selectedBlockIndex].shape;
        
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
              // Check adjacent cells (up, down, left, right)
              const positions = [
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 }
              ];
              
              for (const pos of positions) {
                const adjX = x + col + pos.dx;
                const adjY = y + row + pos.dy;
                
                // Check if the adjacent cell is within bounds and filled
                if (
                  adjX >= 0 && adjX < GRID_SIZE && 
                  adjY >= 0 && adjY < GRID_SIZE && 
                  grid[adjY][adjX] !== 0
                ) {
                  adjacentFilled++;
                }
              }
            }
          }
        }
        
        // Calculate how close this placement would get to completing rows/columns
        let rowCompletionScore = 0;
        let colCompletionScore = 0;
        
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
              const gridY = y + row;
              const gridX = x + col;
              
              // Count filled cells in this row and column
              let rowFilled = 0;
              let colFilled = 0;
              
              for (let i = 0; i < GRID_SIZE; i++) {
                if (grid[gridY][i] !== 0 || (i >= x && i < x + shape[row].length && shape[row][i - x] === 1)) {
                  rowFilled++;
                }
                if (grid[i][gridX] !== 0 || (i >= y && i < y + shape.length && shape[i - y][col] === 1)) {
                  colFilled++;
                }
              }
              
              rowCompletionScore += rowFilled;
              colCompletionScore += colFilled;
            }
          }
        }
        
        // Calculate total position score
        const positionScore = adjacentFilled * 2 + rowCompletionScore + colCompletionScore;
        
        if (positionScore > bestPositionScore) {
          bestPositionScore = positionScore;
          bestX = x;
          bestY = y;
        }
      }
    }
  }
  
  // Move towards the best position
  if (currentBlock.x < bestX) return KEY_RIGHT;
  if (currentBlock.x > bestX) return KEY_LEFT;
  if (currentBlock.y < bestY) return KEY_DOWN;
  if (currentBlock.y > bestY) return KEY_UP;
  
  // If we're at the best position, place the block
  if (currentBlock.x === bestX && currentBlock.y === bestY) {
    if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], bestX, bestY)) {
      return KEY_SPACE;
    }
  }
  
  // If we can't find a good move, take a random one
  const actions = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_Z];
  return actions[Math.floor(Math.random() * actions.length)];
}

// Test the line clearing mechanism
function getTestLineClearingAction(gameState) {
  // Only take actions during PLAYING phase
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track position to detect if we're stuck
  gameState.actionHistory.push({
    x: gameState.currentBlock.x,
    y: gameState.currentBlock.y,
    blockIndex: gameState.selectedBlockIndex
  });
  
  // If we're stuck, take a random action
  if (isStuck(gameState.actionHistory, gameState.currentBlock)) {
    const randomAction = Math.floor(Math.random() * 5);
    switch (randomAction) {
      case 0: return KEY_LEFT;
      case 1: return KEY_RIGHT;
      case 2: return KEY_UP;
      case 3: return KEY_DOWN;
      case 4: return KEY_Z;
    }
  }
  
  const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
  
  // Analyze the grid to find rows and columns that are almost complete
  const rowFillCounts = Array(GRID_SIZE).fill(0);
  const colFillCounts = Array(GRID_SIZE).fill(0);
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] !== 0) {
        rowFillCounts[y]++;
        colFillCounts[x]++;
      }
    }
  }
  
  // Find best position to place the block to complete lines
  let bestX = currentBlock.x;
  let bestY = currentBlock.y;
  let bestLineScore = -1;
  
  // Scan the grid for potential placements
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], x, y)) {
        let lineScore = 0;
        const shape = availableBlocks[selectedBlockIndex].shape;
        
        // Calculate how many lines this placement would complete
        const affectedRows = new Set();
        const affectedCols = new Set();
        
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
              const gridY = y + row;
              const gridX = x + col;
              
              affectedRows.add(gridY);
              affectedCols.add(gridX);
            }
          }
        }
        
        // Calculate how close to completion each affected row/column would be
        for (const rowIndex of affectedRows) {
          const newRowFill = rowFillCounts[rowIndex] + shape[0].filter(cell => cell === 1).length;
          if (newRowFill === GRID_SIZE) {
            lineScore += 100; // Heavily prioritize completing a line
          } else {
            lineScore += newRowFill; // Otherwise prioritize filling rows that are closer to completion
          }
        }
        
        for (const colIndex of affectedCols) {
          const newColFill = colFillCounts[colIndex] + shape.filter(row => row[colIndex - x] === 1).length;
          if (newColFill === GRID_SIZE) {
            lineScore += 100; // Heavily prioritize completing a line
          } else {
            lineScore += newColFill; // Otherwise prioritize filling columns that are closer to completion
          }
        }
        
        if (lineScore > bestLineScore) {
          bestLineScore = lineScore;
          bestX = x;
          bestY = y;
        }
      }
    }
  }
  
  // Move towards the best position
  if (currentBlock.x < bestX) return KEY_RIGHT;
  if (currentBlock.x > bestX) return KEY_LEFT;
  if (currentBlock.y < bestY) return KEY_DOWN;
  if (currentBlock.y > bestY) return KEY_UP;
  
  // If we're at the best position, place the block
  if (currentBlock.x === bestX && currentBlock.y === bestY) {
    if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], bestX, bestY)) {
      return KEY_SPACE;
    }
  }
  
  // If we can't find a good move, cycle through blocks
  return KEY_Z;
}

// Test to fill the grid until game over
function getTestGameOverAction(gameState) {
  // Only take actions during PLAYING phase
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track position to detect if we're stuck
  gameState.actionHistory.push({
    x: gameState.currentBlock.x,
    y: gameState.currentBlock.y,
    blockIndex: gameState.selectedBlockIndex
  });
  
  // If we're stuck, take a random action
  if (isStuck(gameState.actionHistory, gameState.currentBlock)) {
    const randomAction = Math.floor(Math.random() * 5);
    switch (randomAction) {
      case 0: return KEY_LEFT;
      case 1: return KEY_RIGHT;
      case 2: return KEY_UP;
      case 3: return KEY_DOWN;
      case 4: return KEY_Z;
    }
  }
  
  const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
  
  // Try to place blocks in a way that makes it difficult to continue playing
  // (avoiding completing lines and focusing on creating isolated empty cells)
  let bestX = currentBlock.x;
  let bestY = currentBlock.y;
  let bestScore = -1;
  
  // Scan the grid for potential placements
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], x, y)) {
        let score = 0;
        const shape = availableBlocks[selectedBlockIndex].shape;
        
        // Calculate how many isolated empty cells this placement would create
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
              const gridY = y + row;
              const gridX = x + col;
              
              // Check adjacent cells
              const positions = [
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 }
              ];
              
              for (const pos of positions) {
                const adjX = gridX + pos.dx;
                const adjY = gridY + pos.dy;
                
                // Check if the adjacent cell is within bounds and empty
                if (
                  adjX >= 0 && adjX < GRID_SIZE && 
                  adjY >= 0 && adjY < GRID_SIZE && 
                  grid[adjY][adjX] === 0
                ) {
                  // Check if this empty cell would be isolated (surrounded by filled cells on 3 sides)
                  let surroundedCount = 0;
                  
                  for (const innerPos of positions) {
                    const innerX = adjX + innerPos.dx;
                    const innerY = adjY + innerPos.dy;
                    
                    // Count surrounding filled cells or out-of-bounds (which count as "filled")
                    if (
                      innerX < 0 || innerX >= GRID_SIZE || 
                      innerY < 0 || innerY >= GRID_SIZE || 
                      grid[innerY][innerX] !== 0 ||
                      (innerX >= x && innerX < x + shape[0].length && 
                       innerY >= y && innerY < y + shape.length && 
                       shape[innerY - y][innerX - x] === 1)
                    ) {
                      surroundedCount++;
                    }
                  }
                  
                  if (surroundedCount >= 3) {
                    score += 10; // Heavily prioritize creating isolated cells
                  }
                }
              }
            }
          }
        }
        
        // Avoid completing lines
        const affectedRows = new Set();
        const affectedCols = new Set();
        
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
              affectedRows.add(y + row);
              affectedCols.add(x + col);
            }
          }
        }
        
        // Calculate how close to completion each affected row/column would be
        for (const rowIndex of affectedRows) {
          let rowFilled = 0;
          for (let i = 0; i < GRID_SIZE; i++) {
            if (grid[rowIndex][i] !== 0 || (i >= x && i < x + shape[0].length && shape[rowIndex - y][i - x] === 1)) {
              rowFilled++;
            }
          }
          
          // Penalize placements that would complete or nearly complete a row
          if (rowFilled >= GRID_SIZE - 1) {
            score -= 50;
          }
        }
        
        for (const colIndex of affectedCols) {
          let colFilled = 0;
          for (let i = 0; i < GRID_SIZE; i++) {
            if (grid[i][colIndex] !== 0 || (i >= y && i < y + shape.length && shape[i - y][colIndex - x] === 1)) {
              colFilled++;
            }
          }
          
          // Penalize placements that would complete or nearly complete a column
          if (colFilled >= GRID_SIZE - 1) {
            score -= 50;
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestX = x;
          bestY = y;
        }
      }
    }
  }
  
  // Move towards the best position
  if (currentBlock.x < bestX) return KEY_RIGHT;
  if (currentBlock.x > bestX) return KEY_LEFT;
  if (currentBlock.y < bestY) return KEY_DOWN;
  if (currentBlock.y > bestY) return KEY_UP;
  
  // If we're at the best position, place the block
  if (currentBlock.x === bestX && currentBlock.y === bestY) {
    if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], bestX, bestY)) {
      return KEY_SPACE;
    }
  }
  
  // If we can't find a good move, cycle through blocks
  return KEY_Z;
}

// Test block selection mechanism
function getTestBlockSelectionAction(gameState) {
  // Only take actions during PLAYING phase
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track position to detect if we're stuck
  gameState.actionHistory.push({
    x: gameState.currentBlock.x,
    y: gameState.currentBlock.y,
    blockIndex: gameState.selectedBlockIndex
  });
  
  // If we're stuck, take a random action
  if (isStuck(gameState.actionHistory, gameState.currentBlock)) {
    const randomAction = Math.floor(Math.random() * 5);
    switch (randomAction) {
      case 0: return KEY_LEFT;
      case 1: return KEY_RIGHT;
      case 2: return KEY_UP;
      case 3: return KEY_DOWN;
      case 4: return KEY_Z;
    }
  }
  
  const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
  
  // Cycle through blocks frequently to test the selection mechanism
  gameState.framesSinceLastAction++;
  
  // Every 10 frames, cycle to the next block
  if (gameState.framesSinceLastAction % 10 === 0) {
    return KEY_Z;
  }
  
  // Every 30 frames, try to place the current block
  if (gameState.framesSinceLastAction % 30 === 0) {
    // Move to a random position
    const randomDir = Math.floor(Math.random() * 4);
    switch (randomDir) {
      case 0: return KEY_LEFT;
      case 1: return KEY_RIGHT;
      case 2: return KEY_UP;
      case 3: return KEY_DOWN;
    }
  }
  
  // Every 50 frames, try to place the block
  if (gameState.framesSinceLastAction % 50 === 0) {
    if (canPlaceBlock(grid, availableBlocks[selectedBlockIndex], currentBlock.x, currentBlock.y)) {
      return KEY_SPACE;
    }
  }
  
  return null;
}

// Main testing controller function
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLineClearingAction(gameState);
    case "TEST_4":
      return getTestGameOverAction(gameState);
    case "TEST_5":
      return getTestBlockSelectionAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;