// automated_testing_controller.js - Automated testing

import { GRID_SIZE } from './globals.js';

function getTestBasicAction(gameState) {
  // Basic random testing
  if (gameState.currentPlayerIndex !== 0) return null;
  
  const validPlacements = gameState.board.getValidPlacements(gameState.players[0]);
  if (validPlacements.length === 0) return null;
  
  // Randomly rotate sometimes
  if (Math.random() < 0.3) {
    return { keyCode: 32 }; // SPACE
  }
  
  // Place tile
  return { keyCode: 90 }; // Z
}

function getTestWinAction(gameState) {
  // Strategic AI to win the game
  if (gameState.currentPlayerIndex !== 0) return null;
  
  const player = gameState.players[0];
  const validPlacements = gameState.board.getValidPlacements(player);
  
  if (validPlacements.length === 0) return null;
  
  // Strategy: Choose placement that maximizes distance from edges
  let bestPlacement = null;
  let bestScore = -1000;
  
  for (let placement of validPlacements) {
    const distFromEdge = Math.min(
      placement.x,
      GRID_SIZE - 1 - placement.x,
      placement.y,
      GRID_SIZE - 1 - placement.y
    );
    
    // Also consider if placement would lead us toward center
    const centerDist = Math.abs(placement.x - GRID_SIZE/2) + Math.abs(placement.y - GRID_SIZE/2);
    const score = distFromEdge * 2 - centerDist * 0.5;
    
    if (score > bestScore) {
      bestScore = score;
      bestPlacement = placement;
    }
  }
  
  // Try different rotations to find safest path
  if (Math.random() < 0.4) {
    return { keyCode: 32 }; // SPACE to rotate
  }
  
  // Place tile
  return { keyCode: 90 }; // Z
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
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