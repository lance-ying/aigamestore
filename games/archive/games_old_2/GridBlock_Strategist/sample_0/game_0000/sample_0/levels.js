// levels.js - Level management
import { gameState } from './globals.js';
import { initializeGrid, addPrefilledCells } from './grid.js';
import { generateInitialBlocks } from './block.js';

export function initializeLevel(level, p) {
  // Reset grid
  gameState.grid = initializeGrid();
  
  // Add prefilled cells based on level
  let prefilledCount = 0;
  if (level === 3) {
    prefilledCount = 4;
  } else if (level === 4) {
    prefilledCount = 7;
  } else if (level === 5) {
    prefilledCount = 11;
  }
  
  if (prefilledCount > 0) {
    gameState.prefilledCells = addPrefilledCells(gameState.grid, prefilledCount, p);
  } else {
    gameState.prefilledCells = [];
  }
  
  // Generate initial blocks
  gameState.availableBlocks = generateInitialBlocks(level, p);
  gameState.selectedBlockIndex = 0;
  
  // Reset cursor
  gameState.cursorX = 4;
  gameState.cursorY = 4;
  
  // Reset streak
  gameState.streak = 0;
  gameState.gameOverChecked = false;
}