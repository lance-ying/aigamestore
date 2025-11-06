// automated_testing_controller.js - Automated testing logic

import { GRID_SIZE } from './globals.js';
import { canSwap, findAllMatches } from './grid.js';

function findBestMove(gameState) {
  let bestMove = null;
  let bestScore = -1;
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Try swapping right
      if (x < GRID_SIZE - 1) {
        if (canSwap(gameState.grid, x, y, x + 1, y)) {
          const score = evaluateSwap(gameState.grid, x, y, x + 1, y);
          if (score > bestScore) {
            bestScore = score;
            bestMove = {
              from: { x, y },
              to: { x: x + 1, y }
            };
          }
        }
      }
      
      // Try swapping down
      if (y < GRID_SIZE - 1) {
        if (canSwap(gameState.grid, x, y, x, y + 1)) {
          const score = evaluateSwap(gameState.grid, x, y, x, y + 1);
          if (score > bestScore) {
            bestScore = score;
            bestMove = {
              from: { x, y },
              to: { x, y: y + 1 }
            };
          }
        }
      }
    }
  }
  
  return bestMove;
}

function evaluateSwap(grid, x1, y1, x2, y2) {
  // Temporarily swap
  const temp = grid[y1][x1];
  grid[y1][x1] = grid[y2][x2];
  grid[y2][x2] = temp;
  
  const matches = findAllMatches(grid);
  let score = matches.length;
  
  // Bonus for 4+ matches
  const colorCounts = {};
  matches.forEach(m => {
    colorCounts[m.color] = (colorCounts[m.color] || 0) + 1;
  });
  
  for (const color in colorCounts) {
    if (colorCounts[color] >= 4) score += 10;
    if (colorCounts[color] >= 5) score += 20;
  }
  
  // Swap back
  const temp2 = grid[y1][x1];
  grid[y1][x1] = grid[y2][x2];
  grid[y2][x2] = temp2;
  
  return score;
}

function getTestWinAction(gameState) {
  // Priority 1: Cast spell if available
  for (let i = 0; i < 5; i++) {
    if (gameState.elementalMeters[i] >= gameState.meterMax) {
      return { type: 'spell', color: i };
    }
  }
  
  // Priority 2: Find best move
  const bestMove = findBestMove(gameState);
  
  if (bestMove) {
    // Move cursor to from position
    if (gameState.cursor.x !== bestMove.from.x || gameState.cursor.y !== bestMove.from.y) {
      return { type: 'move', x: bestMove.from.x, y: bestMove.from.y };
    }
    
    // Select if not selected
    if (!gameState.selectedCell) {
      return { type: 'select' };
    }
    
    // Move to target
    if (gameState.cursor.x !== bestMove.to.x || gameState.cursor.y !== bestMove.to.y) {
      return { type: 'move', x: bestMove.to.x, y: bestMove.to.y };
    }
    
    // Swap
    return { type: 'swap' };
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = ['move', 'select', 'swap', 'spell'];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  if (action === 'move') {
    return {
      type: 'move',
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } else if (action === 'spell') {
    for (let i = 0; i < 5; i++) {
      if (gameState.elementalMeters[i] >= gameState.meterMax) {
        return { type: 'spell', color: i };
      }
    }
  }
  
  return { type: action };
}

export function get_automated_testing_action(gameState) {
  if (!gameState.isPlayerTurn || gameState.animating) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;