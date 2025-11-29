// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

let testState = {
  phase: "INIT",
  targetLocation: null,
  targetObjectIndex: 0,
  waitFrames: 0,
  cluesNeeded: [],
  deductionsMade: 0,
  stuck: false,
  lastPosition: null,
  stuckCounter: 0
};

function resetTestState() {
  testState = {
    phase: "INIT",
    targetLocation: null,
    targetObjectIndex: 0,
    waitFrames: 0,
    cluesNeeded: [],
    deductionsMade: 0,
    stuck: false,
    lastPosition: null,
    stuckCounter: 0
  };
}

// TEST_1: Basic navigation and interaction
function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Simple test: collect first 3 clues
  if (gameState.inventory.length < 3) {
    // Cycle through objects with space
    if (testState.waitFrames > 0) {
      testState.waitFrames--;
      return null;
    }
    
    if (Math.random() < 0.3) {
      testState.waitFrames = 20;
      return { keyCode: 32 }; // SPACE
    } else if (Math.random() < 0.5) {
      return { keyCode: 40 }; // DOWN
    } else {
      return { keyCode: 38 }; // UP
    }
  }
  
  return null;
}

// TEST_2: Win the game
function getTestWinAction(gameState) {
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    return null; // Success!
  }
  
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Strategy: Collect clues in order, make deductions, progress through chapters
  
  // Phase 1: Collect Chapter 1 clues (TOWN_SQUARE and MANOR)
  if (gameState.currentChapter === 1 && gameState.inventory.length < 3) {
    return collectCluesAction(gameState, ["CLUE_BODY", "CLUE_TIME", "CLUE_WEAPON"], ["TOWN_SQUARE", "MANOR"]);
  }
  
  // Phase 2: Make Chapter 1 deductions
  if (gameState.currentChapter === 1 && gameState.inventory.length >= 3 && gameState.deductions.length < 2) {
    return makeDeductionAction(gameState);
  }
  
  // Phase 3: Collect Chapter 2 clues (MARKET)
  if (gameState.currentChapter === 2 && gameState.inventory.length < 6) {
    return collectCluesAction(gameState, ["CLUE_MOTIVE", "CLUE_ALIBI", "CLUE_WITNESS"], ["MARKET", "CHURCH"]);
  }
  
  // Phase 4: Make Chapter 2 deduction
  if (gameState.currentChapter === 2 && gameState.inventory.length >= 6 && gameState.deductions.length < 3) {
    return makeDeductionAction(gameState);
  }
  
  // Phase 5: Collect Chapter 3 clues (DOCKS, MANOR)
  if (gameState.currentChapter === 3 && gameState.inventory.length < 8) {
    return collectCluesAction(gameState, ["CLUE_EVIDENCE", "CLUE_CONNECTION"], ["DOCKS", "MANOR"]);
  }
  
  // Phase 6: Make final deduction
  if (gameState.currentChapter === 3 && gameState.inventory.length >= 8) {
    return makeDeductionAction(gameState);
  }
  
  // Default: explore
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  testState.waitFrames = 15;
  return { keyCode: 32 }; // SPACE
}

function collectCluesAction(gameState, neededClues, targetLocations) {
  // Check which clues we still need
  const missingClues = neededClues.filter(clueId => 
    !gameState.inventory.find(c => c.id === clueId)
  );
  
  if (missingClues.length === 0) {
    return null;
  }
  
  // Go to location that has clues
  for (let location of targetLocations) {
    if (gameState.unlockedLocations.includes(location)) {
      if (gameState.currentLocation !== location) {
        // Navigate to location
        if (testState.waitFrames > 0) {
          testState.waitFrames--;
          return null;
        }
        
        testState.waitFrames = 10;
        return { keyCode: 37 }; // Open location menu
      } else {
        // In correct location, interact with objects
        if (testState.waitFrames > 0) {
          testState.waitFrames--;
          return null;
        }
        
        if (Math.random() < 0.4) {
          testState.waitFrames = 15;
          return { keyCode: 32 }; // SPACE to interact
        } else {
          return { keyCode: 40 }; // DOWN to next object
        }
      }
    }
  }
  
  return null;
}

function makeDeductionAction(gameState) {
  if (gameState.showInventory) {
    // Already in inventory, try to make deduction
    if (gameState.menuSelection === 0) {
      return { keyCode: 39 }; // RIGHT to deductions tab
    } else {
      testState.waitFrames = 30;
      return { keyCode: 32 }; // SPACE to make deduction
    }
  } else {
    // Open inventory
    return { keyCode: 90 }; // Z
  }
}

// TEST_3: Dialogue test
function getDialogueTestAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  if (gameState.showingDialogue) {
    testState.waitFrames = 20;
    return { keyCode: 32 }; // SPACE to advance dialogue
  }
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Look for suspects to talk to
  if (Math.random() < 0.3) {
    return { keyCode: 40 }; // DOWN
  } else if (Math.random() < 0.6) {
    testState.waitFrames = 15;
    return { keyCode: 32 }; // SPACE
  } else {
    return { keyCode: 37 }; // Change location
  }
}

// TEST_4: Deduction puzzle test
function getDeductionTestAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Collect clues then test deductions
  if (gameState.inventory.length < 2) {
    return getBasicTestAction(gameState);
  }
  
  if (gameState.showInventory) {
    if (testState.waitFrames > 0) {
      testState.waitFrames--;
      return null;
    }
    
    if (gameState.menuSelection === 0) {
      return { keyCode: 39 }; // Switch to deductions
    } else {
      testState.waitFrames = 30;
      return { keyCode: 32 }; // Try to make deduction
    }
  } else {
    return { keyCode: 90 }; // Open inventory
  }
}

// TEST_5: Chapter progression test
function getChapterProgressionAction(gameState) {
  return getTestWinAction(gameState); // Same as win test
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }, // DOWN
    { keyCode: 32 }  // SPACE
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getDialogueTestAction(gameState);
    case "TEST_4":
      return getDeductionTestAction(gameState);
    case "TEST_5":
      return getChapterProgressionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;