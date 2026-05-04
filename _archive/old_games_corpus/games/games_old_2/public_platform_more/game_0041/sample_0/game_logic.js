// game_logic.js - Core game logic and state management

import { gameState, DEDUCTION_PUZZLES } from './globals.js';

export function checkDeductions() {
  // Check if player can make any new deductions
  for (let puzzle of DEDUCTION_PUZZLES) {
    // Skip if already completed
    if (gameState.deductions.find(d => d.id === puzzle.id)) {
      continue;
    }
    
    // Check if in correct chapter
    if (puzzle.chapter !== gameState.currentChapter) {
      continue;
    }
    
    // Check if player has all required clues
    const hasAllClues = puzzle.requiredClues.every(clueId =>
      gameState.inventory.find(c => c.id === clueId)
    );
    
    if (hasAllClues) {
      return puzzle;
    }
  }
  
  return null;
}

export function makeDeduction(puzzle) {
  if (!puzzle) return false;
  
  // Add to completed deductions
  gameState.deductions.push({
    id: puzzle.id,
    name: puzzle.name,
    chapter: puzzle.chapter
  });
  
  // Handle unlocks
  if (puzzle.unlocks === "WIN") {
    gameState.finalDeductionMade = true;
    gameState.killerIdentified = true;
    return true;
  } else if (puzzle.unlocks && !gameState.unlockedLocations.includes(puzzle.unlocks)) {
    gameState.unlockedLocations.push(puzzle.unlocks);
  }
  
  // Check if chapter objectives are complete
  checkChapterComplete();
  
  return true;
}

export function checkChapterComplete() {
  const currentObjective = gameState.chapterObjectives[gameState.currentChapter];
  
  if (currentObjective && !currentObjective.completed) {
    // Check if all required clues are collected
    const hasAllClues = currentObjective.required.every(clueId =>
      gameState.inventory.find(c => c.id === clueId)
    );
    
    if (hasAllClues) {
      currentObjective.completed = true;
      
      // Advance to next chapter if not final
      if (gameState.currentChapter < 3) {
        gameState.currentChapter++;
      }
    }
  }
}

export function checkWinCondition() {
  return gameState.finalDeductionMade && gameState.killerIdentified;
}

export function getAvailableLocations() {
  return gameState.unlockedLocations;
}

export function canInteractWithObject(obj) {
  // Can always interact with unexamined objects
  if (!obj.examined) return true;
  
  // Can re-examine if has new context (more clues)
  return false;
}