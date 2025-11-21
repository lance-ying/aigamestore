// automated_testing_controller.js - Automated testing functions

import { gameState, GAME_PHASES, DEDUCTION_STAGES } from './globals.js';

let testState = {
  currentAction: null,
  actionTimer: 0,
  stageStartFrame: 0
};

function getTestBasicAction(gs) {
  // Basic test: Navigate through cards and make selections
  
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  testState.actionTimer++;
  
  // Wait a bit before each action
  if (testState.actionTimer < 30) {
    return null;
  }
  
  // Navigate right through cards
  if (testState.actionTimer < 60) {
    testState.actionTimer = 0;
    return { keyCode: 39 }; // RIGHT
  }
  
  // Make a selection
  if (testState.actionTimer >= 60) {
    testState.actionTimer = 0;
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getTestWinAction(gs) {
  // Optimal strategy: Always select the correct card based on vision matching
  
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    testState.actionTimer = 0;
    return null;
  }
  
  testState.actionTimer++;
  
  // Wait before making selection
  if (testState.actionTimer < 20) {
    return null;
  }
  
  let correctIndex = 0;
  
  // Determine correct answer based on current stage
  switch (gs.currentStage) {
    case DEDUCTION_STAGES.SUSPECT:
      correctIndex = gs.correctSuspect;
      break;
    case DEDUCTION_STAGES.LOCATION:
      correctIndex = gs.correctLocation;
      break;
    case DEDUCTION_STAGES.WEAPON:
      correctIndex = gs.correctWeapon;
      break;
    default:
      return null;
  }
  
  // Navigate to correct card
  if (gs.currentSelection < correctIndex) {
    testState.actionTimer = 0;
    return { keyCode: 39 }; // RIGHT
  } else if (gs.currentSelection > correctIndex) {
    testState.actionTimer = 0;
    return { keyCode: 37 }; // LEFT
  }
  
  // At correct position, wait then select
  if (testState.actionTimer >= 30) {
    testState.actionTimer = 0;
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getRandomAction(gs) {
  // Random actions for fallback testing
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 32 }, // SPACE
    null,
    null
  ];
  
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}

export function get_automated_testing_action(gs) {
  if (!gs || gs.controlMode === "HUMAN") {
    return null;
  }
  
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;