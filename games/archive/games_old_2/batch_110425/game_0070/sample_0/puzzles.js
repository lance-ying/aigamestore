// puzzles.js - Puzzle logic

import { gameState } from './globals.js';
import { getRoomData } from './rooms.js';

export function solvePuzzle(puzzleId, itemsUsed = []) {
  const currentRoom = getRoomData(gameState.currentRoom);
  const puzzle = currentRoom.puzzles?.find(p => p.id === puzzleId);
  
  if (!puzzle || puzzle.solved) {
    return false;
  }
  
  // Check if puzzle requirements are met
  if (puzzle.requires) {
    const hasAllItems = puzzle.requires.every(item => itemsUsed.includes(item));
    if (!hasAllItems) {
      return false;
    }
  }
  
  // Mark puzzle as solved
  puzzle.solved = true;
  gameState.solvedPuzzles.add(puzzleId);
  gameState.puzzlesSolved++;
  gameState.score += 100;
  
  // Handle puzzle rewards
  if (puzzle.rewards) {
    // Reveal hidden item
    const hotspot = currentRoom.hotspots.find(h => h.item === puzzle.rewards);
    if (hotspot) {
      hotspot.hidden = false;
      hotspot.collected = false;
    }
  }
  
  // Handle win condition
  if (puzzle.isWinCondition) {
    gameState.gamePhase = "GAME_OVER_WIN";
  }
  
  return true;
}

export function revealHiddenItem(roomId, revealPuzzleId) {
  const room = getRoomData(roomId);
  const hotspots = room.hotspots.filter(h => h.revealPuzzle === revealPuzzleId);
  
  hotspots.forEach(h => {
    if (h.hidden) {
      h.hidden = false;
      h.collected = false;
    }
  });
}

export function getCurrentHint() {
  const room = getRoomData(gameState.currentRoom);
  
  // Room-specific hints
  const hints = {
    entrance: "Look around for items that might be useful. Try the torch on the wall.",
    courtyard: "Examine the fountain carefully. There might be something hidden nearby.",
    hall: "You'll need keys to progress. Check the library first.",
    library: "Look for a small key that might unlock containers elsewhere.",
    armory: "Some mechanisms require specific parts to function. Explore the tower.",
    tower: "Collect the gear pieces. They might be useful in the armory.",
    throne: "Use the items you've collected to unlock the throne's secret."
  };
  
  return hints[gameState.currentRoom] || "Explore and interact with objects.";
}