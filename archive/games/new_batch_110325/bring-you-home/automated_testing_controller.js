// automated_testing_controller.js - Automated testing

import { gameState, POLO_IDLE, POLO_WALKING, POLO_DEAD, PHASE_PLAYING } from './globals.js';

let testState = {
  framesSinceAction: 0,
  currentStrategy: null,
  swapsPending: [],
  levelSolutions: null,
  testStartFrame: 0,
  actionQueue: []
};

// Define optimal solutions for each level (create safe path TO exit)
function getLevelSolutions() {
  return {
    // World 0 - Tutorial: Swap hazards with safe panels to create path to EXIT
    "0-0": [
      { action: 'moveCursor', target: 1 },  // Move to SPIKE (position 1)
      { action: 'select' },
      { action: 'moveCursor', target: 3 },  // Move to SAFE (position 3)
      { action: 'select' },  // Swap SPIKE with SAFE to clear path to EXIT at position 2
    ],
    "0-1": [
      { action: 'moveCursor', target: 2 },  // Move to SPIKE (position 2)
      { action: 'select' },
      { action: 'moveCursor', target: 4 },  // Move to SAFE (position 4)
      { action: 'select' },  // Swap SPIKE with SAFE to clear path to EXIT at position 3
    ],
    "0-2": [
      { action: 'moveCursor', target: 2 },  // Move to ENEMY (position 2)
      { action: 'select' },
      { action: 'moveCursor', target: 4 },  // Move to SAFE (position 4)
      { action: 'select' },  // Swap ENEMY with SAFE to clear path to EXIT at position 3
    ],
    // World 1
    "1-0": [
      { action: 'moveCursor', target: 2 },  // Move to SPIKE (position 2)
      { action: 'select' },
      { action: 'moveCursor', target: 4 },  // Move to SAFE (position 4)
      { action: 'select' },  // Swap to create safe path to EXIT at position 3
    ],
    "1-1": [
      { action: 'moveCursor', target: 1 },  // Move to SPIKE (position 1)
      { action: 'select' },
      { action: 'moveCursor', target: 2 },  // Move to SAFE (position 2)
      { action: 'select' },  // First swap
      { action: 'moveCursor', target: 3 },  // Move to GAP (now at position 3)
      { action: 'select' },
      { action: 'moveCursor', target: 5 },  // Move to SAFE (position 5)
      { action: 'select' },  // Second swap to create path to EXIT at position 4
    ],
    "1-2": [
      { action: 'moveCursor', target: 2 },  // Move to SPIKE (position 2)
      { action: 'select' },
      { action: 'moveCursor', target: 4 },  // Move to SAFE (position 4)
      { action: 'select' },  // Swap to create safe path to EXIT at position 3
    ],
    // World 2
    "2-0": [
      { action: 'moveCursor', target: 1 },  // Move to SPIKE (position 1)
      { action: 'select' },
      { action: 'moveCursor', target: 2 },  // Move to SAFE (position 2)
      { action: 'select' },  // First swap
      { action: 'moveCursor', target: 3 },  // Move to ENEMY (position 3)
      { action: 'select' },
      { action: 'moveCursor', target: 5 },  // Move to SAFE (position 5)
      { action: 'select' },  // Second swap to clear path to EXIT at position 4
    ],
    "2-1": [
      { action: 'moveCursor', target: 2 },  // Move to SPIKE (position 2)
      { action: 'select' },
      { action: 'moveCursor', target: 3 },  // Move to SAFE (position 3)
      { action: 'select' },  // First swap
      { action: 'moveCursor', target: 4 },  // Move to GAP (position 4)
      { action: 'select' },
      { action: 'moveCursor', target: 6 },  // Move to SAFE (position 6)
      { action: 'select' },  // Second swap to clear path to EXIT at position 5
    ],
    "2-2": [
      { action: 'moveCursor', target: 1 },  // Move to SPIKE (position 1)
      { action: 'select' },
      { action: 'moveCursor', target: 2 },  // Move to SAFE (position 2)
      { action: 'select' },  // First swap
      { action: 'moveCursor', target: 3 },  // Move to ENEMY (position 3)
      { action: 'select' },
      { action: 'moveCursor', target: 4 },  // Move to SAFE (position 4)
      { action: 'select' },  // Second swap to clear path to EXIT at position 5
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
  
  // Handle Polo states
  if (gameState.poloState === POLO_DEAD) {
    if (testState.framesSinceAction > 30) {
      testState.framesSinceAction = 0;
      return { keyCode: 16 }; // SHIFT (rewind)
    }
    return null;
  }
  
  if (gameState.poloState === POLO_WALKING) {
    return null;
  }
  
  // IDLE state - execute action queue
  if (gameState.poloState === POLO_IDLE) {
    if (testState.actionQueue.length === 0) {
      // Load action queue for this level
      const levelKey = `${gameState.currentWorld}-${gameState.currentLevel}`;
      const solution = testState.levelSolutions[levelKey] || [];
      testState.actionQueue = [...solution];
    }
    
    if (testState.actionQueue.length > 0) {
      if (testState.framesSinceAction > 20) {
        const action = testState.actionQueue.shift();
        testState.framesSinceAction = 0;
        
        if (action.action === 'moveCursor') {
          // Move cursor to target
          if (gameState.cursorIndex < action.target) {
            return { keyCode: 39 }; // RIGHT
          } else if (gameState.cursorIndex > action.target) {
            return { keyCode: 37 }; // LEFT
          } else {
            // Already at target, continue to next action
            return null;
          }
        } else if (action.action === 'select') {
          return { keyCode: 32 }; // SPACE
        }
      }
    } else {
      // All actions done, start walking
      if (testState.framesSinceAction > 40) {
        testState.framesSinceAction = 0;
        testState.actionQueue = []; // Reset for next level
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
  
  if (gameState.poloState === POLO_IDLE) {
    if (testState.framesSinceAction > 60) {
      testState.framesSinceAction = 0;
      
      const rand = Math.random();
      if (rand < 0.3) {
        return { keyCode: 37 }; // LEFT
      } else if (rand < 0.6) {
        return { keyCode: 39 }; // RIGHT
      } else if (rand < 0.8) {
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
  
  if (gameState.poloState === POLO_IDLE) {
    if (testState.framesSinceAction > 30) {
      testState.framesSinceAction = 0;
      return { keyCode: 90 }; // Z
    }
  } else if (gameState.poloState === POLO_WALKING) {
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

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestRewindAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;