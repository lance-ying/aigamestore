// validation.js - Validation functions

import { findAllWordPaths } from './wordPaths.js';

export function checkWordComplete(wordPath, grid) {
  for (const cell of wordPath.path) {
    const playerLetter = grid[cell.row][cell.col];
    if (playerLetter !== cell.letter) {
      return false;
    }
  }
  return true;
}

export function checkLevelComplete(level, grid, completedWords) {
  // Generate all word paths if not cached
  if (!level.wordPaths) {
    level.wordPaths = findAllWordPaths(level);
  }
  
  // Check if all words are completed
  for (const wordPath of level.wordPaths) {
    const wordKey = `${wordPath.clueRow},${wordPath.clueCol}`;
    if (!completedWords.has(wordKey)) {
      return false;
    }
  }
  
  return true;
}