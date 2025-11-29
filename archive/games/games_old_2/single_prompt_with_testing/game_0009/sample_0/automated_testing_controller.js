// automated_testing_controller.js - Automated testing strategies

import {
  DESIGN_PHASE,
  SIMULATE_PHASE,
  PHASE_PLAYING,
  gameState
} from './globals.js';

let actionTimer = 0;
let testState = {
  roadsDrawn: false,
  simulationStarted: false,
  waitFrames: 0
};

function getTestWinAction(gameState) {
  // Strategy: Draw optimal roads connecting all entry-exit pairs
  
  if (gameState.designPhase === DESIGN_PHASE) {
    actionTimer++;
    
    // Draw roads to connect entry to nearest exit
    if (!testState.roadsDrawn) {
      if (actionTimer % 15 === 0) {
        // Press space to place segments
        return { key: ' ', keyCode: 32 };
      } else if (actionTimer % 5 === 0) {
        // Move to good position
        const directions = [39, 40, 39, 40]; // RIGHT, DOWN pattern
        return { key: 'Arrow', keyCode: directions[Math.floor(actionTimer / 5) % directions.length] };
      }
      
      // After drawing enough segments, mark as done
      if (gameState.roadSegments.length >= Math.min(3, gameState.entryPoints.length * 2)) {
        testState.roadsDrawn = true;
        testState.waitFrames = 30;
      }
    } else {
      // Wait then start simulation
      if (testState.waitFrames > 0) {
        testState.waitFrames--;
      } else if (!testState.simulationStarted) {
        testState.simulationStarted = true;
        return { key: ' ', keyCode: 32 };
      }
    }
  } else if (gameState.designPhase === SIMULATE_PHASE) {
    // Just watch simulation
    return null;
  }
  
  return null;
}

function getTestBasicAction(gameState) {
  // Basic test: Draw a simple road and start simulation
  
  if (gameState.designPhase === DESIGN_PHASE) {
    actionTimer++;
    
    if (actionTimer === 30) {
      return { key: ' ', keyCode: 32 }; // Start drawing
    } else if (actionTimer > 30 && actionTimer < 100) {
      // Move right to create horizontal road
      if (actionTimer % 3 === 0) {
        return { key: 'ArrowRight', keyCode: 39 };
      }
    } else if (actionTimer === 100) {
      return { key: ' ', keyCode: 32 }; // Place segment
    } else if (actionTimer === 130) {
      return { key: ' ', keyCode: 32 }; // Start simulation
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  // Random actions for stress testing
  if (Math.random() < 0.1) {
    const actions = [
      { key: ' ', keyCode: 32 },
      { key: 'ArrowLeft', keyCode: 37 },
      { key: 'ArrowRight', keyCode: 39 },
      { key: 'ArrowUp', keyCode: 38 },
      { key: 'ArrowDown', keyCode: 40 }
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }
  return null;
}

export function get_automated_testing_action(gameState) {
  // Don't interfere with non-playing phases
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
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
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;