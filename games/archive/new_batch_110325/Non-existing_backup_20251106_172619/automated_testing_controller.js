// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';
import { getNodeData, isEnding, getAllEndingIds } from './story_data.js';

let testState = {
  actionQueue: [],
  waitFrames: 0,
  exploredPaths: new Map(),
  currentStrategy: 'explore',
  lastNodeVisit: {},
  stuckPrevention: 0
};

function getTestWinAction(gameState) {
  // Strategy: Systematically explore all paths to unlock all endings
  
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData) {
    return { keyCode: 32, key: ' ' }; // SPACE - try to advance
  }
  
  // Wait for text to display
  if (!gameState.textFullyDisplayed) {
    return { keyCode: 32, key: ' ' }; // SPACE - skip text
  }
  
  // If we've reached an ending, wait a bit then check if we need more
  if (isEnding(gameState.currentNode)) {
    if (gameState.player.getProgress() >= 8) {
      // We should have won
      return null;
    }
    // Need to restart and explore more paths
    testState.stuckPrevention++;
    if (testState.stuckPrevention > 100) {
      testState.stuckPrevention = 0;
      return null; // Let the game handle game over
    }
    return null;
  }
  
  // Handle choices - intelligently select unexplored paths
  if (currentNodeData.choices && currentNodeData.choices.length > 0) {
    const choices = currentNodeData.choices;
    
    // Track which choices we've made at this node
    if (!testState.exploredPaths.has(gameState.currentNode)) {
      testState.exploredPaths.set(gameState.currentNode, new Set());
    }
    
    const exploredChoices = testState.exploredPaths.get(gameState.currentNode);
    
    // Find an unexplored choice
    let choiceToMake = -1;
    for (let i = 0; i < choices.length; i++) {
      if (!exploredChoices.has(i)) {
        choiceToMake = i;
        break;
      }
    }
    
    // If all choices explored, pick a random one
    if (choiceToMake === -1) {
      choiceToMake = Math.floor(Math.random() * choices.length);
    }
    
    // Navigate to the choice and select it
    if (gameState.choiceIndex !== choiceToMake) {
      if (gameState.choiceIndex < choiceToMake) {
        return { keyCode: 40, key: 'ArrowDown' };
      } else {
        return { keyCode: 38, key: 'ArrowUp' };
      }
    } else {
      // Mark this choice as explored and select it
      exploredChoices.add(choiceToMake);
      return { keyCode: 32, key: ' ' }; // SPACE - confirm choice
    }
  }
  
  // No choices, advance dialogue
  return { keyCode: 32, key: ' ' };
}

function getBasicTestAction(gameState) {
  // Simple test: advance dialogue and make random choices
  
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData) {
    return { keyCode: 32, key: ' ' };
  }
  
  if (!gameState.textFullyDisplayed) {
    return { keyCode: 32, key: ' ' };
  }
  
  if (currentNodeData.choices && currentNodeData.choices.length > 0) {
    // Randomly navigate choices
    const rand = Math.random();
    if (rand < 0.3) {
      return { keyCode: 38, key: 'ArrowUp' };
    } else if (rand < 0.6) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else {
      return { keyCode: 32, key: ' ' };
    }
  }
  
  return { keyCode: 32, key: ' ' };
}

function getNavigationTestAction(gameState) {
  // Test: cycle through all choices before selecting
  
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData) {
    return { keyCode: 32, key: ' ' };
  }
  
  if (!gameState.textFullyDisplayed) {
    return { keyCode: 32, key: ' ' };
  }
  
  if (currentNodeData.choices && currentNodeData.choices.length > 0) {
    if (!testState.lastNodeVisit[gameState.currentNode]) {
      testState.lastNodeVisit[gameState.currentNode] = { cycled: false, cycles: 0 };
    }
    
    const visitData = testState.lastNodeVisit[gameState.currentNode];
    
    if (!visitData.cycled) {
      visitData.cycles++;
      
      if (visitData.cycles <= currentNodeData.choices.length * 2) {
        // Cycle through choices
        if (visitData.cycles % 2 === 0) {
          return { keyCode: 40, key: 'ArrowDown' };
        } else {
          return { keyCode: 38, key: 'ArrowUp' };
        }
      } else {
        visitData.cycled = true;
        return { keyCode: 32, key: ' ' }; // Select
      }
    }
  }
  
  return { keyCode: 32, key: ' ' };
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 32, key: ' ' },
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 40, key: 'ArrowDown' }
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
      return getNavigationTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;

export default get_automated_testing_action;