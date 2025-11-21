// automated_testing_controller.js - Automated testing

import { GAME_PHASES } from './globals.js';
import { LEVEL_DATA } from './levels.js';

let testState = {
  stepIndex: 0,
  lastAction: null,
  waitFrames: 0,
  levelSolutions: {}
};

function getTestWinAction(gameState) {
  // Strategy: Solve each level optimally by following the solution sequence
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Wait a few frames between actions for stability
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  const levelData = LEVEL_DATA[gameState.currentLevel];
  if (!levelData) return null;
  
  // Get current progress for this level
  const progress = gameState.puzzleProgress[gameState.currentLevel] || [];
  const solution = levelData.solution;
  
  // Check if level is complete
  if (progress.length >= solution.length) {
    // Wait for level transition
    testState.waitFrames = 30;
    return null;
  }
  
  // Get next required hotspot
  const targetHotspotId = solution[progress.length];
  const targetIndex = gameState.currentHotspots.findIndex(h => h.id === targetHotspotId);
  
  if (targetIndex === -1) {
    return null;
  }
  
  // Navigate to target hotspot
  if (gameState.selectedHotspotIndex !== targetIndex) {
    const diff = targetIndex - gameState.selectedHotspotIndex;
    
    if (diff > 0) {
      testState.waitFrames = 3;
      return { keyCode: 39, key: 'ArrowRight' }; // RIGHT
    } else {
      testState.waitFrames = 3;
      return { keyCode: 37, key: 'ArrowLeft' }; // LEFT
    }
  }
  
  // Interact with selected hotspot
  testState.waitFrames = 10;
  return { keyCode: 32, key: ' ' }; // SPACE
}

function getTestBasicAction(gameState) {
  // Strategy: Test basic navigation and interaction
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  const actions = [
    { keyCode: 39, key: 'ArrowRight' },
    { keyCode: 37, key: 'ArrowLeft' },
    { keyCode: 32, key: ' ' },
    { keyCode: 90, key: 'z' }
  ];
  
  testState.stepIndex++;
  testState.waitFrames = 15;
  
  return actions[testState.stepIndex % actions.length];
}

function getTestEdgeCasesAction(gameState) {
  // Strategy: Test edge cases like wrong interactions
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Cycle through all hotspots and try interacting
  const actions = [
    { keyCode: 39, key: 'ArrowRight' },
    { keyCode: 32, key: ' ' },
    { keyCode: 90, key: 'z' },
    { keyCode: 32, key: ' ' }
  ];
  
  testState.stepIndex++;
  testState.waitFrames = 10;
  
  return actions[testState.stepIndex % actions.length];
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [
    { keyCode: 37, key: 'ArrowLeft' },
    { keyCode: 39, key: 'ArrowRight' },
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 32, key: ' ' },
    { keyCode: 90, key: 'z' }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestEdgeCasesAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;