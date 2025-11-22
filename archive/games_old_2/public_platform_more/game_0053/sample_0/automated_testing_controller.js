// automated_testing_controller.js - Automated testing

import { gameState, POLO_IDLE, POLO_WALKING, POLO_DEAD, PHASE_PLAYING } from './globals.js';

let testState = {
  framesSinceAction: 0,
  currentStrategy: null,
  swapsPending: [],
  levelSolutions: null,
  testStartFrame: 0
};

// Define optimal solutions for each level
function getLevelSolutions() {
  return {
    // World 0
    "0-0": [
      { from: 2, to: 1 }, // Move SAFE before SPIKE
    ],
    "0-1": [
      { from: 2, to: 1 }, // Move first SAFE before first SPIKE
      { from: 4, to: 3 }, // Move second SAFE before second SPIKE
    ],
    "0-2": [
      { from: 2, to: 1 }, // Move SAFE before ENEMY
      { from: 4, to: 3 }, // Move SAFE before SPIKE
    ],
    // World 1
    "1-0": [
      { from: 3, to: 1 }, // Move SAFE before SPIKE
      { from: 4, to: 2 }, // Move SAFE before ENEMY
    ],
    "1-1": [
      { from: 2, to: 1 }, // Move SAFE before GAP
      { from: 4, to: 3 }, // Move SAFE before ENEMY
    ],
    "1-2": [
      { from: 4, to: 1 }, // Move first SAFE before ENEMY
      { from: 5, to: 2 }, // Move second SAFE before SPIKE
    ],
    // World 2
    "2-0": [
      { from: 3, to: 1 }, // Move SAFE before SPIKE
      { from: 6, to: 4 }, // Move SAFE before GAP
    ],
    "2-1": [
      { from: 4, to: 1 }, // Move SAFE before GAP
      { from: 6, to: 2 }, // Move second SAFE before ENEMY
    ],
    "2-2": [
      { from: 4, to: 1 }, // Move first SAFE before ENEMY
      { from: 7, to: 2 }, // Move second SAFE before GAP
    ],
  };
}

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  testState.framesSinceAction++;
  
  // Initialize solutions
  if (!testState.levelSolutions) {
    testState.levelSolutions = getLevelSolutions();
  }
  
  // Get solution for current level
  const levelKey = `${gameState.currentWorld}-${gameState.currentLevel}`;
  const solution = testState.levelSolutions[levelKey] || [];
  
  // Handle Polo states
  if (gameState.poloState === POLO_DEAD) {
    // Rewind
    if (testState.framesSinceAction > 30) {
      testState.framesSinceAction = 0;
      return { keyCode: 16 }; // SHIFT
    }
    return null;
  }
  
  if (gameState.poloState === POLO_WALKING) {
    // Just wait
    return null;
  }
  
  // IDLE state - arrange panels
  if (gameState.poloState === POLO_IDLE) {
    // If we have swaps to do
    if (testState.swapsPending.length === 0) {
      // Load swaps for this level
      testState.swapsPending = [...solution];
    }
    
    if (testState.swapsPending.length > 0) {
      const swap = testState.swapsPending[0];
      
      // Need to select panels
      if (gameState.selectedPanels.length === 0) {
        // Select first panel
        if (testState.framesSinceAction > 20) {
          testState.framesSinceAction = 0;
          // Navigate to target panel
          return { keyCode: 39 }; // RIGHT
        }
      } else if (gameState.selectedPanels.length === 1) {
        const selected = gameState.selectedPanels[0];
        
        if (selected === swap.from) {
          // Select second panel
          if (testState.framesSinceAction > 20) {
            testState.framesSinceAction = 0;
            return { keyCode: 39 }; // RIGHT to select next
          }
        } else if (selected < swap.from) {
          // Navigate right
          if (testState.framesSinceAction > 20) {
            testState.framesSinceAction = 0;
            return { keyCode: 39 };
          }
        } else {
          // Navigate left
          if (testState.framesSinceAction > 20) {
            testState.framesSinceAction = 0;
            return { keyCode: 37 };
          }
        }
      } else if (gameState.selectedPanels.length === 2) {
        // Swap them
        if (testState.framesSinceAction > 20) {
          testState.framesSinceAction = 0;
          testState.swapsPending.shift(); // Remove this swap
          return { keyCode: 32 }; // SPACE
        }
      }
    } else {
      // All swaps done, start walking
      if (testState.framesSinceAction > 30) {
        testState.framesSinceAction = 0;
        return { keyCode: 90 }; // Z
      }
    }
  }
  
  return null;
}

function getTestBasicAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  testState.framesSinceAction++;
  
  // Simple test: select panels and swap randomly
  if (gameState.poloState === POLO_IDLE) {
    if (testState.framesSinceAction > 60) {
      testState.framesSinceAction = 0;
      
      // Random action
      const rand = Math.random();
      if (rand < 0.3) {
        return { keyCode: 37 }; // LEFT
      } else if (rand < 0.6) {
        return { keyCode: 39 }; // RIGHT
      } else if (rand < 0.8 && gameState.selectedPanels.length === 2) {
        return { keyCode: 32 }; // SPACE
      } else {
        return { keyCode: 90 }; // Z
      }
    }
  } else if (gameState.poloState === POLO_DEAD) {
    if (testState.framesSinceAction > 60) {
      testState.framesSinceAction = 0;
      return { keyCode: 16 }; // SHIFT
    }
  }
  
  return null;
}

function getTestRewindAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  testState.framesSinceAction++;
  
  // Test rewind functionality
  if (gameState.poloState === POLO_IDLE) {
    // Start walking immediately
    if (testState.framesSinceAction > 30) {
      testState.framesSinceAction = 0;
      return { keyCode: 90 }; // Z
    }
  } else if (gameState.poloState === POLO_WALKING) {
    // Wait a bit then rewind
    if (testState.framesSinceAction > 60) {
      testState.framesSinceAction = 0;
      return { keyCode: 16 }; // SHIFT
    }
  } else if (gameState.poloState === POLO_DEAD) {
    if (testState.framesSinceAction > 30) {
      testState.framesSinceAction = 0;
      return { keyCode: 16 }; // SHIFT
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  testState.framesSinceAction++;
  
  if (testState.framesSinceAction > 30) {
    testState.framesSinceAction = 0;
    const actions = [37, 39, 32, 90, 16];
    const keyCode = actions[Math.floor(Math.random() * actions.length)];
    return { keyCode };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestRewindAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;