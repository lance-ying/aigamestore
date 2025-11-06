// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

let actionHistory = [];
let stateHistory = [];
let stuckCounter = 0;

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  // 1. Visit all locations in order
  // 2. Collect all clues
  // 3. Solve all puzzles
  // 4. Interrogate all suspects
  
  const currentLoc = gameState.locations[gameState.currentLocation];
  
  // If puzzle is active, solve it
  if (gameState.puzzleActive !== null) {
    return solvePuzzle(gameState);
  }
  
  // If dialogue is active, continue it
  if (gameState.dialogueState) {
    return 32; // SPACE
  }
  
  // If case file is open, close it
  if (gameState.showCaseFile) {
    return 90; // Z
  }
  
  // Find next objective
  const unsolvedPuzzles = currentLoc.hotspots.filter(h => 
    h.type === 'puzzle' && !gameState.puzzles[h.clueId].solved
  );
  
  const uncollectedClues = currentLoc.hotspots.filter(h => 
    h.type === 'clue' && !h.isInteracted
  );
  
  const uninterrogatedSuspects = currentLoc.hotspots.filter(h => 
    h.type === 'suspect' && !gameState.suspects[h.clueId].interrogated
  );
  
  // Priority: puzzles > clues > suspects
  let targetHotspot = null;
  
  if (unsolvedPuzzles.length > 0) {
    targetHotspot = unsolvedPuzzles[0];
  } else if (uncollectedClues.length > 0) {
    targetHotspot = uncollectedClues[0];
  } else if (uninterrogatedSuspects.length > 0) {
    targetHotspot = uninterrogatedSuspects[0];
  } else {
    // Move to next location with objectives
    const nextLoc = findNextLocationWithObjectives(gameState);
    if (nextLoc !== -1) {
      return navigateToLocation(gameState, nextLoc);
    }
  }
  
  if (targetHotspot) {
    if (gameState.selectedHotspot === targetHotspot) {
      return 32; // SPACE - interact
    } else {
      return selectHotspot(gameState, targetHotspot);
    }
  }
  
  // Default: cycle through hotspots
  return 39; // RIGHT
}

function solvePuzzle(gameState) {
  const puzzle = gameState.puzzles[gameState.puzzleActive.puzzleId];
  const currentInput = gameState.puzzleActive.currentInput;
  const cursorPos = gameState.puzzleActive.cursorPos;
  
  // Set correct value at current position
  if (currentInput[cursorPos] !== puzzle.solution[cursorPos]) {
    return 38; // UP to increment
  }
  
  // Move to next position
  if (cursorPos < puzzle.solution.length - 1) {
    return 39; // RIGHT
  }
  
  // Submit solution
  return 32; // SPACE
}

function findNextLocationWithObjectives(gameState) {
  for (let i = 0; i < gameState.locations.length; i++) {
    if (i === gameState.currentLocation) continue;
    
    const loc = gameState.locations[i];
    const hasObjectives = loc.hotspots.some(h => {
      if (h.type === 'clue' && !h.isInteracted) return true;
      if (h.type === 'puzzle' && !gameState.puzzles[h.clueId].solved) return true;
      if (h.type === 'suspect' && !gameState.suspects[h.clueId].interrogated) return true;
      return false;
    });
    
    if (hasObjectives) return i;
  }
  return -1;
}

function navigateToLocation(gameState, targetLocationId) {
  const currentLoc = gameState.locations[gameState.currentLocation];
  const exits = currentLoc.hotspots.filter(h => h.type === 'exit');
  
  // Find exit that leads to target or closer to target
  for (let exit of exits) {
    if (exit.clueId === targetLocationId) {
      if (gameState.selectedHotspot === exit) {
        return 32; // SPACE - use exit
      } else {
        return selectHotspot(gameState, exit);
      }
    }
  }
  
  // Use any exit to explore
  if (exits.length > 0) {
    const exit = exits[0];
    if (gameState.selectedHotspot === exit) {
      return 32; // SPACE
    } else {
      return selectHotspot(gameState, exit);
    }
  }
  
  return 39; // RIGHT
}

function selectHotspot(gameState, targetHotspot) {
  // Cycle through hotspots to find target
  return 39; // RIGHT
}

function getBasicTestAction(gameState) {
  // Basic testing: explore and interact randomly
  const actions = [37, 39, 32]; // LEFT, RIGHT, SPACE
  
  if (gameState.dialogueState) {
    return 32; // Continue dialogue
  }
  
  if (gameState.puzzleActive !== null) {
    const puzzleActions = [37, 39, 38, 40, 32];
    return puzzleActions[Math.floor(Math.random() * puzzleActions.length)];
  }
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 90]; // Arrow keys, SPACE, Z
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  // Track state for stuck detection
  const stateKey = `${gameState.currentLocation}_${gameState.collectedClues.length}_${gameState.puzzleActive !== null}`;
  stateHistory.push(stateKey);
  if (stateHistory.length > 100) stateHistory.shift();
  
  // Check if stuck
  const recentStates = stateHistory.slice(-50);
  const uniqueStates = new Set(recentStates);
  if (uniqueStates.size < 3 && recentStates.length > 40) {
    stuckCounter++;
    if (stuckCounter > 20) {
      stuckCounter = 0;
      return getRandomAction(gameState);
    }
  } else {
    stuckCounter = 0;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;