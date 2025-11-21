// automated_testing_controller.js
import { GAME_PHASES } from './globals.js';

function getTestBasicAction(gameState) {
  // TEST_1: Basic tool testing - navigate and apply all tools once
  const frame = gameState.lastInputFrame || 0;
  const cycle = Math.floor(frame / 20) % 10;
  
  if (cycle < gameState.tools.length * 2) {
    if (cycle % 2 === 0) {
      return { right: true };
    } else {
      return { space: true };
    }
  } else if (cycle === gameState.tools.length * 2) {
    return { z: true }; // Reset
  }
  
  return { right: true };
}

function getTestWinAction(gameState) {
  // TEST_2: Solve levels optimally
  if (!gameState.currentBall || !gameState.targetBall) {
    return null;
  }
  
  // Strategy: Apply each tool in sequence and check if we match
  const appliedCount = gameState.appliedOperations.length;
  const targetLayers = gameState.targetBall.layers.length;
  
  // If we haven't applied enough operations yet
  if (appliedCount < targetLayers) {
    // Apply the next tool in sequence
    return { space: true };
  }
  
  // Check if we match, if not try next tool
  if (!gameState.currentBall.matches(gameState.targetBall)) {
    // Move to next tool and try
    if (Math.random() < 0.3) {
      return { right: true };
    } else if (Math.random() < 0.5) {
      return { space: true };
    } else if (Math.random() < 0.7) {
      return { z: true }; // Reset and try different approach
    }
  } else {
    // We match! Submit
    return { enter: true };
  }
  
  return { space: true };
}

function getTestResetAction(gameState) {
  // TEST_3: Test reset functionality
  const frame = gameState.lastInputFrame || 0;
  const cycle = Math.floor(frame / 15) % 8;
  
  if (cycle < 3) {
    return { space: true }; // Apply tools
  } else if (cycle === 3) {
    return { z: true }; // Reset
  } else if (cycle < 7) {
    return { space: true }; // Apply again
  } else {
    return { z: true }; // Reset again
  }
}

function getTestEdgeCasesAction(gameState) {
  // TEST_4: Test edge cases - same tool multiple times, all tools
  const frame = gameState.lastInputFrame || 0;
  const cycle = Math.floor(frame / 10) % 15;
  
  if (cycle < 5) {
    // Apply same tool multiple times
    return { space: true };
  } else if (cycle < 10) {
    // Navigate through tools
    return { right: true };
  } else if (cycle < 13) {
    // Apply different tool
    return { space: true };
  } else {
    return { z: true }; // Reset
  }
}

function getTestProgressionAction(gameState) {
  // TEST_5: Test level progression - complete multiple levels
  if (!gameState.currentBall || !gameState.targetBall) {
    return null;
  }
  
  const targetLayers = gameState.targetBall.layers.length;
  const appliedCount = gameState.appliedOperations.length;
  
  // Simple strategy: apply all tools in order
  if (appliedCount < gameState.tools.length) {
    if (Math.random() < 0.7) {
      return { space: true };
    } else {
      return { right: true };
    }
  }
  
  // Try to submit
  if (gameState.currentBall.matches(gameState.targetBall)) {
    return { enter: true };
  }
  
  // If not matching, try different combinations
  if (Math.random() < 0.4) {
    return { z: true }; // Reset and try again
  } else if (Math.random() < 0.7) {
    return { right: true };
  } else {
    return { space: true };
  }
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'space', 'z'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { [randomAction]: true };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestResetAction(gameState);
    case "TEST_4":
      return getTestEdgeCasesAction(gameState);
    case "TEST_5":
      return getTestProgressionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;