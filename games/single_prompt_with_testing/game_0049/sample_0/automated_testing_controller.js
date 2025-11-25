// automated_testing_controller.js - Automated testing strategies
import { gameState } from './globals.js';

let testState = {
  lastAction: null,
  actionCounter: 0,
  stuck: false,
  stuckCounter: 0,
  lastScore: 0,
  strategy: 'explore'
};

function getTestWinAction(gameState) {
  // Strategy to win: systematically zoom all panels, find and collect orbs
  const currentPanel = gameState.panels[gameState.selectedPanel];
  
  // If level is complete, wait for transition
  if (gameState.levelComplete) {
    return { keyCode: null };
  }
  
  // Check if current panel has revealed orb
  if (currentPanel && currentPanel.orbRevealed) {
    // Move to next panel
    return { keyCode: 39 }; // RIGHT
  }
  
  // If current panel can zoom in, do it
  if (currentPanel && currentPanel.canZoomIn()) {
    testState.actionCounter++;
    return { keyCode: 32 }; // SPACE to zoom
  }
  
  // If panel is at max zoom but no orb, zoom out and try next
  if (currentPanel && currentPanel.zoomLevel === currentPanel.maxZoom && !currentPanel.orbRevealed) {
    if (currentPanel.zoomLevel > 0) {
      return { keyCode: 32 }; // SPACE to zoom out
    }
  }
  
  // Move to next panel
  testState.actionCounter++;
  if (testState.actionCounter % 10 === 0) {
    return { keyCode: 40 }; // DOWN
  } else {
    return { keyCode: 39 }; // RIGHT
  }
}

function getBasicTestAction(gameState) {
  // Test basic mechanics: navigation, zoom, swap
  testState.actionCounter++;
  
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }, // DOWN
    { keyCode: 32 }, // SPACE
  ];
  
  // Occasionally test swap
  if (testState.actionCounter % 20 === 0) {
    return { keyCode: 16 }; // SHIFT
  }
  
  return actions[testState.actionCounter % actions.length];
}

function getUndoTestAction(gameState) {
  // Test undo functionality
  testState.actionCounter++;
  
  if (testState.actionCounter % 5 === 0 && gameState.undosRemaining > 0) {
    return { keyCode: 90 }; // Z for undo
  }
  
  // Make moves to undo
  const actions = [
    { keyCode: 32 }, // SPACE
    { keyCode: 39 }, // RIGHT
    { keyCode: 32 }, // SPACE
    { keyCode: 40 }, // DOWN
  ];
  
  return actions[testState.actionCounter % actions.length];
}

function getRandomAction(gameState) {
  // Random valid actions
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }, // DOWN
    { keyCode: 32 }, // SPACE
  ];
  
  testState.actionCounter++;
  
  // Random with some preference for space (interaction)
  if (testState.actionCounter % 3 === 0) {
    return { keyCode: 32 };
  }
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getUndoTestAction(gameState);
    case "TEST_4":
      return getRandomAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;