// ai.js - Automated testing controllers
import { gameState, GRID_SIZE } from './globals.js';
import { canPlaceBlock } from './grid.js';

export function getAIAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Simple test: try to place blocks randomly
  if (p.frameCount % 30 === 0) {
    // Try to place current block
    const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
    if (selectedBlock) {
      // Find a valid placement
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceBlock(gameState.grid, selectedBlock, x, y)) {
            gameState.cursorX = x;
            gameState.cursorY = y;
            return { keyCode: 32 }; // SPACE to place
          }
        }
      }
    }
    
    // Switch to next block if current can't be placed
    return { keyCode: 39 }; // RIGHT
  }
  
  return null;
}

function getWinTestAction(p) {
  // More strategic: try to complete lines
  if (p.frameCount % 15 === 0) {
    const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
    if (selectedBlock) {
      // Find best placement (prioritize completing lines)
      let bestScore = -1;
      let bestX = -1;
      let bestY = -1;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (canPlaceBlock(gameState.grid, selectedBlock, x, y)) {
            const score = evaluatePlacement(x, y, selectedBlock);
            if (score > bestScore) {
              bestScore = score;
              bestX = x;
              bestY = y;
            }
          }
        }
      }
      
      if (bestX !== -1) {
        gameState.cursorX = bestX;
        gameState.cursorY = bestY;
        return { keyCode: 32 }; // SPACE
      }
    }
    
    // Try next block
    return { keyCode: 39 }; // RIGHT
  }
  
  return null;
}

function evaluatePlacement(x, y, block) {
  let score = 0;
  
  // Prefer placements that complete rows/columns
  const rowCounts = new Array(GRID_SIZE).fill(0);
  const colCounts = new Array(GRID_SIZE).fill(0);
  
  // Count existing filled cells
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      if (gameState.grid[gy][gx].filled) {
        rowCounts[gy]++;
        colCounts[gx]++;
      }
    }
  }
  
  // Simulate placement
  for (const [dx, dy] of block.shape) {
    const px = x + dx;
    const py = y + dy;
    if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
      rowCounts[py]++;
      colCounts[px]++;
    }
  }
  
  // Score based on near-completion
  for (let i = 0; i < GRID_SIZE; i++) {
    if (rowCounts[i] === GRID_SIZE) score += 100;
    else if (rowCounts[i] >= 7) score += 10;
    
    if (colCounts[i] === GRID_SIZE) score += 100;
    else if (colCounts[i] >= 7) score += 10;
  }
  
  return score;
}