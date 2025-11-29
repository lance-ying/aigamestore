// automated_testing_controller.js - Automated testing
import { gameState } from './globals.js';

let testState = {
  positionHistory: [],
  stuckCounter: 0,
  lastAction: null,
  targetReached: false,
  phase: 'start'
};

function getTestWinAction(state) {
  const player = state.player;
  if (!player) return { left: false, right: false, up: false, space: false, z: false };

  // Track position to detect if stuck
  testState.positionHistory.push({ x: player.x, y: player.y });
  if (testState.positionHistory.length > 60) {
    testState.positionHistory.shift();
  }

  // Check if stuck
  if (testState.positionHistory.length === 60) {
    const recent = testState.positionHistory.slice(-30);
    const avgX = recent.reduce((sum, pos) => sum + pos.x, 0) / recent.length;
    const variance = recent.reduce((sum, pos) => sum + Math.abs(pos.x - avgX), 0) / recent.length;
    
    if (variance < 5) {
      testState.stuckCounter++;
    } else {
      testState.stuckCounter = 0;
    }
  }

  const action = { left: false, right: false, up: false, space: false, z: false };

  // Get nearest grabbable object
  let nearestObj = null;
  let nearestDist = 200;
  
  for (let obj of state.movableObjects) {
    const dist = Math.abs(obj.x - player.x) + Math.abs(obj.y - player.y);
    if (dist < nearestDist) {
      nearestObj = obj;
      nearestDist = dist;
    }
  }

  // Strategy: Move right, jump over obstacles, use gravity gun to move blocks
  
  // If we have a grabbed object, position it for stepping
  if (state.grabbedObject) {
    action.z = true; // Pull mode
    
    // Release if in good position
    if (Math.abs(state.grabbedObject.x - player.x) > 40 && player.grounded) {
      // Release by not holding space
      action.space = false;
    } else {
      action.space = true;
      action.right = true; // Keep moving while holding
    }
  } else {
    // Try to grab nearest object if it's useful
    if (nearestObj && nearestDist < 150) {
      // Check if there's a gap ahead
      let gapAhead = true;
      for (let platform of state.platforms) {
        if (platform.x > player.x && platform.x < player.x + 200 &&
            Math.abs(platform.y - player.y) < 100) {
          gapAhead = false;
          break;
        }
      }
      
      if (gapAhead || testState.stuckCounter > 60) {
        action.space = true; // Grab object
        
        // Move towards object
        if (nearestObj.x > player.x) {
          action.right = true;
        } else {
          action.left = true;
        }
      }
    }
    
    // Normal movement
    if (!action.space) {
      action.right = true; // Always move right towards goal
      
      // Jump if there's a platform ahead or obstacle
      let shouldJump = false;
      
      // Check for platforms above
      for (let platform of state.platforms) {
        if (platform.x > player.x - 50 && platform.x < player.x + 100 &&
            platform.y < player.y - 20 && platform.y > player.y - 100) {
          shouldJump = true;
          break;
        }
      }
      
      // Jump over enemies
      for (let enemy of state.enemies) {
        if (enemy.active && Math.abs(enemy.x - player.x) < 80 && 
            enemy.y > player.y - 50) {
          shouldJump = true;
          break;
        }
      }
      
      // Jump over hazards
      for (let hazard of state.hazards) {
        if (hazard.x > player.x - 50 && hazard.x < player.x + 100 &&
            Math.abs(hazard.y - player.y) < 50) {
          shouldJump = true;
          break;
        }
      }
      
      // Jump if stuck
      if (testState.stuckCounter > 30) {
        shouldJump = true;
        testState.stuckCounter = 0;
      }
      
      if (shouldJump && player.grounded) {
        action.up = true;
      }
    }
  }

  return action;
}

function getBasicTestAction(state) {
  const player = state.player;
  if (!player) return { left: false, right: false, up: false, space: false, z: false };

  const action = { left: false, right: false, up: false, space: false, z: false };

  // Simple test: move right and jump occasionally
  action.right = true;
  
  if (player.grounded && Math.random() < 0.05) {
    action.up = true;
  }
  
  // Try gravity gun occasionally
  if (Math.random() < 0.02) {
    action.space = true;
  }

  return action;
}

function getRandomAction(state) {
  return {
    left: Math.random() < 0.2,
    right: Math.random() < 0.3,
    up: Math.random() < 0.1,
    space: Math.random() < 0.1,
    z: Math.random() < 0.05
  };
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;