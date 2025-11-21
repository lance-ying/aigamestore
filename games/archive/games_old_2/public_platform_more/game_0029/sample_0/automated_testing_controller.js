// automated_testing_controller.js - Automated testing logic

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, KEY_ENTER, KEY_SPACE, KEY_SHIFT, KEY_LEFT, KEY_RIGHT } from './globals.js';

let testState = {
  framesSinceAction: 0,
  totalActions: 0,
  lastPhase: null,
  roundsCompleted: 0
};

function getTestBasicAction(gameState) {
  testState.framesSinceAction++;
  
  // Phase transitions
  if (gameState.gamePhase === PHASE_START) {
    if (testState.framesSinceAction > 60) {
      testState.framesSinceAction = 0;
      return { keyCode: KEY_ENTER, key: 'Enter' };
    }
    // Navigate menu
    if (testState.framesSinceAction === 30) {
      return { keyCode: KEY_RIGHT, key: 'ArrowRight' };
    }
    return null;
  }
  
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Mark cards with varied actions
    if (testState.framesSinceAction > 45) {
      testState.framesSinceAction = 0;
      testState.totalActions++;
      
      // Mix of correct, skip, and incorrect
      if (testState.totalActions % 5 === 0) {
        return { keyCode: KEY_SHIFT, key: 'Shift' }; // Incorrect
      } else {
        return { keyCode: KEY_SPACE, key: ' ' }; // Correct
      }
    }
    return null;
  }
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    if (testState.framesSinceAction > 120) {
      testState.framesSinceAction = 0;
      return { keyCode: 82, key: 'r' }; // R key
    }
    return null;
  }
  
  return null;
}

function getTestWinAction(gameState) {
  testState.framesSinceAction++;
  
  // Track phase changes
  if (gameState.gamePhase !== testState.lastPhase) {
    testState.lastPhase = gameState.gamePhase;
    if (gameState.gamePhase === PHASE_PLAYING) {
      testState.roundsCompleted = gameState.currentRound;
    }
  }
  
  // Phase transitions
  if (gameState.gamePhase === PHASE_START) {
    if (testState.framesSinceAction === 20) {
      // Select max rounds
      return { keyCode: KEY_RIGHT, key: 'ArrowRight' };
    }
    if (testState.framesSinceAction === 25) {
      return { keyCode: KEY_RIGHT, key: 'ArrowRight' };
    }
    if (testState.framesSinceAction > 30) {
      testState.framesSinceAction = 0;
      return { keyCode: KEY_ENTER, key: 'Enter' };
    }
    return null;
  }
  
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Rapidly mark cards as correct for maximum score
    if (testState.framesSinceAction > 25) {
      testState.framesSinceAction = 0;
      testState.totalActions++;
      
      // Always mark correct - optimal strategy
      return { keyCode: KEY_SPACE, key: ' ' };
    }
    return null;
  }
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    // Test completed successfully
    return null;
  }
  
  return null;
}

function getRandomAction(gameState) {
  testState.framesSinceAction++;
  
  if (gameState.gamePhase === PHASE_START) {
    if (testState.framesSinceAction > 90) {
      testState.framesSinceAction = 0;
      return { keyCode: KEY_ENTER, key: 'Enter' };
    }
    return null;
  }
  
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (testState.framesSinceAction > 60) {
      testState.framesSinceAction = 0;
      const rand = Math.random();
      if (rand < 0.6) {
        return { keyCode: KEY_SPACE, key: ' ' };
      } else if (rand < 0.9) {
        return { keyCode: KEY_SPACE, key: ' ' };
      } else {
        return { keyCode: KEY_SHIFT, key: 'Shift' };
      }
    }
    return null;
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;