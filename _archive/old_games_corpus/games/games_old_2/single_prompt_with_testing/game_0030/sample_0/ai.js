// ai.js - AI logic for enemy targeting

import { GRID_SIZE, gameState } from './globals.js';

export function getAITarget() {
  // If we have a queue of targets (from previous hit), use those
  if (gameState.aiTargetQueue.length > 0) {
    return gameState.aiTargetQueue.shift();
  }
  
  // If we had a recent hit, target adjacent cells
  if (gameState.aiLastHit) {
    const { x, y } = gameState.aiLastHit;
    const adjacent = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];
    
    for (let target of adjacent) {
      if (target.x >= 0 && target.x < GRID_SIZE && 
          target.y >= 0 && target.y < GRID_SIZE &&
          !gameState.playerGrid.isTargeted(target.x, target.y)) {
        return target;
      }
    }
    
    gameState.aiLastHit = null; // Clear if no valid adjacent targets
  }
  
  // Random targeting
  let attempts = 0;
  while (attempts < 100) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    if (!gameState.playerGrid.isTargeted(x, y)) {
      return { x, y };
    }
    attempts++;
  }
  
  // Fallback: find first untargeted cell
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!gameState.playerGrid.isTargeted(x, y)) {
        return { x, y };
      }
    }
  }
  
  return null;
}

export function handleAIHit(x, y, wasHit) {
  if (wasHit) {
    gameState.aiLastHit = { x, y };
    
    // Add perpendicular targets to queue for hunting mode
    const targets = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];
    
    for (let target of targets) {
      if (target.x >= 0 && target.x < GRID_SIZE && 
          target.y >= 0 && target.y < GRID_SIZE &&
          !gameState.playerGrid.isTargeted(target.x, target.y)) {
        gameState.aiTargetQueue.push(target);
      }
    }
  }
}