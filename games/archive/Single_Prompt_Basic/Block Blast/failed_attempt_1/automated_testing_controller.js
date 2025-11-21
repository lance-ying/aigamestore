import { gameState, GRID_SIZE } from './globals.js';
import { canPlaceBlock } from './blocks.js';

// Track position history to detect stalling
const positionHistory = [];
const MAX_HISTORY_LENGTH = 20;
let stallCounter = 0;
const MAX_STALL_COUNT = 30;

// Basic testing with sticky keys
function getStickyKeysAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track current position to detect stalling
  const currentPosition = {
    x: gameState.currentBlockX,
    y: gameState.currentBlockY,
    blockIndex: gameState.selectedBlockIndex
  };
  
  positionHistory.push(currentPosition);
  if (positionHistory.length > MAX_HISTORY_LENGTH) {
    positionHistory.shift();
  }
  
  // Check if we're stalled (same position for too long)
  let stalled = false;
  if (positionHistory.length === MAX_HISTORY_LENGTH) {
    const allSame = positionHistory.every(pos => 
      pos.x === positionHistory[0].x && 
      pos.y === positionHistory[0].y && 
      pos.blockIndex === positionHistory[0].blockIndex
    );
    
    if (allSame) {
      stallCounter++;
      if (stallCounter > MAX_STALL_COUNT) {
        stalled = true;
        stallCounter = 0;
        positionHistory.length = 0; // Clear history
      }
    } else {
      stallCounter = 0;
    }
  }
  
  // If stalled, perform a random action
  if (stalled) {
    const randomAction = Math.floor(Math.random() * 6);
    switch (randomAction) {
      case 0: return 37; // Left
      case 1: return 39; // Right
      case 2: return 38; // Up
      case 3: return 40; // Down
      case 4: return 90; // Z (cycle blocks)
      case 5: return 32; // Space (place block)
    }
  }
  
  // Get current block
  const block = gameState.availableBlocks[gameState.selectedBlockIndex];
  
  // Random actions with bias towards placement when valid
  if (canPlaceBlock(block, gameState.currentBlockX, gameState.currentBlockY)) {
    // Higher chance to place if we can
    if (Math.random() < 0.3) {
      return 32; // Space (place block)
    }
  }
  
  // Otherwise move or switch blocks
  const action = Math.floor(Math.random() * 10);
  switch (action) {
    case 0:
    case 1: return 37; // Left
    case 2:
    case 3: return 39; // Right
    case 4:
    case 5: return 38; // Up
    case 6:
    case 7: return 40; // Down
    case 8:
    case 9: return 90; // Z (cycle blocks)
  }
  
  return null;
}

// Test winning strategy
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  const block = gameState.availableBlocks[gameState.selectedBlockIndex];
  
  // Strategy: Find the best position to place the block to complete lines
  let bestScore = -1;
  let bestX = -1;
  let bestY = -1;
  let bestBlockIndex = gameState.selectedBlockIndex;
  
  // Check each available block
  for (let blockIndex = 0; blockIndex < gameState.availableBlocks.length; blockIndex++) {
    const testBlock = gameState.availableBlocks[blockIndex];
    
    // Try every possible position
    for (let y = 0; y <= GRID_SIZE - testBlock.height; y++) {
      for (let x = 0; x <= GRID_SIZE - testBlock.width; x++) {
        if (canPlaceBlock(testBlock, x, y)) {
          // Calculate potential score by simulating placement
          const score = calculatePlacementScore(testBlock, x, y);
          
          if (score > bestScore) {
            bestScore = score;
            bestX = x;
            bestY = y;
            bestBlockIndex = blockIndex;
          }
        }
      }
    }
  }
  
  // If we found a good placement
  if (bestScore >= 0) {
    // First, select the right block if needed
    if (bestBlockIndex !== gameState.selectedBlockIndex) {
      return 90; // Z (cycle blocks)
    }
    
    // Then move to the best position
    if (gameState.currentBlockX < bestX) {
      return 39; // Right
    }
    if (gameState.currentBlockX > bestX) {
      return 37; // Left
    }
    if (gameState.currentBlockY < bestY) {
      return 40; // Down
    }
    if (gameState.currentBlockY > bestY) {
      return 38; // Up
    }
    
    // If we're at the best position, place the block
    return 32; // Space (place block)
  }
  
  // If no good placement found, just move randomly
  return getStickyKeysAction(gameState);
}

// Calculate score for a potential placement
function calculatePlacementScore(block, x, y) {
  // Simulate placing the block
  const tempGrid = JSON.parse(JSON.stringify(gameState.grid));
  
  // Place the block on the temporary grid
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      if (block.shape[i][j] === 1) {
        tempGrid[y + i][x + j] = 1; // Mark as filled
      }
    }
  }
  
  // Count potential completed rows and columns
  let completedLines = 0;
  
  // Check rows
  for (let i = 0; i < GRID_SIZE; i++) {
    let rowComplete = true;
    for (let j = 0; j < GRID_SIZE; j++) {
      if (tempGrid[i][j] === 0) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) completedLines++;
  }
  
  // Check columns
  for (let j = 0; j < GRID_SIZE; j++) {
    let colComplete = true;
    for (let i = 0; i < GRID_SIZE; i++) {
      if (tempGrid[i][j] === 0) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) completedLines++;
  }
  
  // Base score on completed lines
  let score = completedLines * 100;
  
  // Add bonus for filling near-complete lines
  for (let i = 0; i < GRID_SIZE; i++) {
    let rowCount = 0;
    for (let j = 0; j < GRID_SIZE; j++) {
      if (tempGrid[i][j] !== 0) rowCount++;
    }
    if (rowCount >= GRID_SIZE - 2) score += rowCount * 5;
  }
  
  for (let j = 0; j < GRID_SIZE; j++) {
    let colCount = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
      if (tempGrid[i][j] !== 0) colCount++;
    }
    if (colCount >= GRID_SIZE - 2) score += colCount * 5;
  }
  
  return score;
}

// Test line clearing mechanics
function getTestLineClearingAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Similar to win strategy but prioritizes completing lines even more
  const block = gameState.availableBlocks[gameState.selectedBlockIndex];
  
  // Find positions that would complete a line
  let bestX = -1;
  let bestY = -1;
  let bestBlockIndex = gameState.selectedBlockIndex;
  let lineCompletionFound = false;
  
  // Check each available block
  for (let blockIndex = 0; blockIndex < gameState.availableBlocks.length; blockIndex++) {
    const testBlock = gameState.availableBlocks[blockIndex];
    
    // Try every possible position
    for (let y = 0; y <= GRID_SIZE - testBlock.height; y++) {
      for (let x = 0; x <= GRID_SIZE - testBlock.width; x++) {
        if (canPlaceBlock(testBlock, x, y)) {
          // Check if this placement completes a line
          const completesLine = wouldCompleteLine(testBlock, x, y);
          
          if (completesLine) {
            bestX = x;
            bestY = y;
            bestBlockIndex = blockIndex;
            lineCompletionFound = true;
            break;
          }
          
          // If we haven't found a line completion yet, store this as a fallback
          if (!lineCompletionFound && bestX === -1) {
            bestX = x;
            bestY = y;
            bestBlockIndex = blockIndex;
          }
        }
      }
      if (lineCompletionFound) break;
    }
    if (lineCompletionFound) break;
  }
  
  // If we found a placement
  if (bestX !== -1) {
    // First, select the right block if needed
    if (bestBlockIndex !== gameState.selectedBlockIndex) {
      return 90; // Z (cycle blocks)
    }
    
    // Then move to the best position
    if (gameState.currentBlockX < bestX) {
      return 39; // Right
    }
    if (gameState.currentBlockX > bestX) {
      return 37; // Left
    }
    if (gameState.currentBlockY < bestY) {
      return 40; // Down
    }
    if (gameState.currentBlockY > bestY) {
      return 38; // Up
    }
    
    // If we're at the best position, place the block
    return 32; // Space (place block)
  }
  
  // If no placement found, just move randomly
  return getStickyKeysAction(gameState);
}

// Check if placing a block would complete a line
function wouldCompleteLine(block, x, y) {
  // Simulate placing the block
  const tempGrid = JSON.parse(JSON.stringify(gameState.grid));
  
  // Place the block on the temporary grid
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      if (block.shape[i][j] === 1) {
        tempGrid[y + i][x + j] = 1; // Mark as filled
      }
    }
  }
  
  // Check rows
  for (let i = 0; i < GRID_SIZE; i++) {
    let rowComplete = true;
    for (let j = 0; j < GRID_SIZE; j++) {
      if (tempGrid[i][j] === 0) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) return true;
  }
  
  // Check columns
  for (let j = 0; j < GRID_SIZE; j++) {
    let colComplete = true;
    for (let i = 0; i < GRID_SIZE; i++) {
      if (tempGrid[i][j] === 0) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) return true;
  }
  
  return false;
}

// Test block selection and cycling
function getTestBlockSelectionAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Cycle through all blocks and try to place each one
  const currentBlockIndex = gameState.selectedBlockIndex;
  const totalBlocks = gameState.availableBlocks.length;
  
  // Every 30 frames, cycle to the next block
  if (gameState.frameCount % 30 === 0) {
    return 90; // Z (cycle blocks)
  }
  
  // Try to find a valid placement for the current block
  const block = gameState.availableBlocks[gameState.selectedBlockIndex];
  
  // Move to a random valid position
  let validPositions = [];
  for (let y = 0; y <= GRID_SIZE - block.height; y++) {
    for (let x = 0; x <= GRID_SIZE - block.width; x++) {
      if (canPlaceBlock(block, x, y)) {
        validPositions.push({x, y});
      }
    }
  }
  
  if (validPositions.length > 0) {
    // Choose a random valid position
    const targetPos = validPositions[Math.floor(Math.random() * validPositions.length)];
    
    // Move towards that position
    if (gameState.currentBlockX < targetPos.x) {
      return 39; // Right
    }
    if (gameState.currentBlockX > targetPos.x) {
      return 37; // Left
    }
    if (gameState.currentBlockY < targetPos.y) {
      return 40; // Down
    }
    if (gameState.currentBlockY > targetPos.y) {
      return 38; // Up
    }
    
    // If we're at the target position, place the block
    return 32; // Space (place block)
  }
  
  // If no valid placement, just move randomly
  return getStickyKeysAction(gameState);
}

// Test game over detection
function getTestGameOverAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Strategy: Fill the grid in a way that leads to no valid placements
  // We'll place blocks in a checkerboard pattern to make it harder to place new blocks
  
  const block = gameState.availableBlocks[gameState.selectedBlockIndex];
  
  // Prefer to place single blocks in a checkerboard pattern
  if (block.width === 1 && block.height === 1) {
    // Find a position that follows the checkerboard pattern
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if ((x + y) % 2 === 0 && canPlaceBlock(block, x, y)) {
          // Move to this position
          if (gameState.currentBlockX < x) {
            return 39; // Right
          }
          if (gameState.currentBlockX > x) {
            return 37; // Left
          }
          if (gameState.currentBlockY < y) {
            return 40; // Down
          }
          if (gameState.currentBlockY > y) {
            return 38; // Up
          }
          
          // If we're at the position, place the block
          return 32; // Space (place block)
        }
      }
    }
  }
  
  // For other blocks, place them where they fit but avoid completing lines
  let bestScore = Infinity; // Lower is better here (we want to avoid completing lines)
  let bestX = -1;
  let bestY = -1;
  let bestBlockIndex = gameState.selectedBlockIndex;
  
  // Check each available block
  for (let blockIndex = 0; blockIndex < gameState.availableBlocks.length; blockIndex++) {
    const testBlock = gameState.availableBlocks[blockIndex];
    
    // Try every possible position
    for (let y = 0; y <= GRID_SIZE - testBlock.height; y++) {
      for (let x = 0; x <= GRID_SIZE - testBlock.width; x++) {
        if (canPlaceBlock(testBlock, x, y)) {
          // Calculate how many cells this would fill
          const fillCount = countFillCells(testBlock);
          
          // Avoid positions that would complete lines
          const completesLine = wouldCompleteLine(testBlock, x, y);
          const score = completesLine ? 1000 : fillCount;
          
          if (score < bestScore) {
            bestScore = score;
            bestX = x;
            bestY = y;
            bestBlockIndex = blockIndex;
          }
        }
      }
    }
  }
  
  // If we found a placement
  if (bestX !== -1) {
    // First, select the right block if needed
    if (bestBlockIndex !== gameState.selectedBlockIndex) {
      return 90; // Z (cycle blocks)
    }
    
    // Then move to the best position
    if (gameState.currentBlockX < bestX) {
      return 39; // Right
    }
    if (gameState.currentBlockX > bestX) {
      return 37; // Left
    }
    if (gameState.currentBlockY < bestY) {
      return 40; // Down
    }
    if (gameState.currentBlockY > bestY) {
      return 38; // Up
    }
    
    // If we're at the best position, place the block
    return 32; // Space (place block)
  }
  
  // If no placement found, just move randomly
  return getStickyKeysAction(gameState);
}

// Count how many cells a block would fill
function countFillCells(block) {
  let count = 0;
  for (let i = 0; i < block.height; i++) {
    for (let j = 0; j < block.width; j++) {
      if (block.shape[i][j] === 1) {
        count++;
      }
    }
  }
  return count;
}

// Main testing controller
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLineClearingAction(gameState);
    case "TEST_4":
      return getTestBlockSelectionAction(gameState);
    case "TEST_5":
      return getTestGameOverAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;