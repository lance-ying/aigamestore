// puzzle_system.js - Puzzle mechanics
import { gameState, PUZZLES, CLUE_DATA } from './globals.js';

export class PuzzleSystem {
  constructor(locationManager) {
    this.locationManager = locationManager;
  }
  
  checkPuzzleSolution(puzzleId, attempt) {
    const puzzle = PUZZLES[puzzleId];
    if (!puzzle) return false;
    
    // Check if player has required items
    const hasItems = puzzle.requiredItems.every(item => 
      gameState.inventory.includes(item)
    );
    
    if (!hasItems) return false;
    
    // Check solution
    if (puzzle.solution === "combined" && attempt === "combine") {
      return true;
    } else if (attempt === puzzle.solution) {
      return true;
    }
    
    return false;
  }
  
  solvePuzzle(puzzleId) {
    const puzzle = PUZZLES[puzzleId];
    if (!puzzle) return;
    
    if (!gameState.solvedPuzzles.includes(puzzleId)) {
      gameState.solvedPuzzles.push(puzzleId);
      gameState.score += 100;
      gameState.storyProgress++;
      
      // Unlock locations or trigger events
      if (puzzle.unlocks === "warehouse") {
        this.locationManager.unlockLocation("warehouse");
      } else if (puzzle.unlocks === "pier") {
        this.locationManager.unlockLocation("pier");
      } else if (puzzle.unlocks === "win") {
        // Check if we have enough evidence
        this.checkWinCondition();
      }
    }
  }
  
  checkWinCondition() {
    if (gameState.mysteryCluesFound >= gameState.requiredCluesForWin) {
      return true;
    }
    return false;
  }
  
  attemptCombineItems(item1, item2) {
    // Check for valid combinations
    const combinations = [
      { items: ["coded_message"], result: "decode_message" },
      { items: ["paint_sample", "receipt"], result: "match_paint" },
      { items: ["graffiti_photo", "witness_testimony", "schedule"], result: "identify_culprit" }
    ];
    
    for (const combo of combinations) {
      // Check if attempting to combine items for a puzzle
      if (combo.items.includes(item1) || combo.items.includes(item2)) {
        const puzzle = PUZZLES[combo.result];
        if (puzzle && !gameState.solvedPuzzles.includes(combo.result)) {
          // Check if all required items are in inventory
          const hasAll = puzzle.requiredItems.every(item => 
            gameState.inventory.includes(item)
          );
          
          if (hasAll) {
            this.solvePuzzle(combo.result);
            return { success: true, puzzle: combo.result };
          } else {
            return { success: false, message: "Need more items for this puzzle" };
          }
        }
      }
    }
    
    return { success: false, message: "These items don't combine" };
  }
}