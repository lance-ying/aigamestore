// automated_testing.js - Automated testing controller

import { gameState, KEYS, CONTROL_MODES } from './globals.js';
import { getHighestPoint } from './physics.js';

// Get action for TEST_1: Basic climbing test
function getTest1Action() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Strategy: Methodical climbing with alternating grabs
  
  // If not grabbing, try to grab
  if (!gameState.isGrabbing) {
    // Find if there's something above to grab
    const targets = [...gameState.climbers, gameState.goat].filter(c => c && c !== player);
    let hasTargetAbove = false;
    
    for (const target of targets) {
      if (target.y < player.y - 20) {
        hasTargetAbove = true;
        break;
      }
    }
    
    if (hasTargetAbove) {
      // Alternate between left and right grabs
      if (gameState.frameCount % 60 < 30) {
        return { keyCode: KEYS.LEFT };
      } else {
        return { keyCode: KEYS.RIGHT };
      }
    } else {
      // Jump to reach higher
      return { keyCode: KEYS.SPACE };
    }
  } else {
    // If grabbing, pull up
    return { keyCode: KEYS.UP };
  }
}

// Get action for TEST_2: Win strategy
function getTest2Action() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const targetY = gameState.targetHeight - 30;
  
  // Aggressive climbing strategy
  
  // If we're above target, we've won
  if (player.y < targetY) {
    return null;
  }
  
  // If grabbing, pull hard
  if (gameState.isGrabbing) {
    // Hold to charge fling
    if (player.flingChargeFrames < 20) {
      return { keyCode: KEYS.UP };
    } else {
      // Release for powerful fling
      return { keyCode: KEYS.DOWN };
    }
  } else {
    // Not grabbing - need to grab something
    
    // Find nearest body part above us
    const targets = [...gameState.climbers, gameState.goat].filter(c => c && c !== player);
    let nearestAbove = null;
    let minDist = 1000;
    
    for (const target of targets) {
      for (const limb of target.bodyParts) {
        if (limb.y < player.y) {
          const dist = Math.abs(limb.x - player.x) + Math.abs(limb.y - player.y);
          if (dist < minDist) {
            minDist = dist;
            nearestAbove = limb;
          }
        }
      }
    }
    
    if (nearestAbove) {
      // Move towards it
      if (nearestAbove.x < player.x - 10) {
        return { keyCode: KEYS.LEFT };
      } else if (nearestAbove.x > player.x + 10) {
        return { keyCode: KEYS.RIGHT };
      } else {
        // Close enough, try quick grab
        return { keyCode: KEYS.Z };
      }
    } else {
      // Jump to reach higher
      return { keyCode: KEYS.SPACE };
    }
  }
}

// Get action for TEST_3: Physics stress test
function getTest3Action() {
  if (!gameState.player) return null;
  
  // Rapid random movements to stress test physics
  const actions = [KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.DOWN, KEYS.SPACE, KEYS.Z];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

// Get action for TEST_4: Elimination test
function getTest4Action() {
  if (!gameState.player) return null;
  
  // Intentionally move slowly/wrong direction to test elimination
  if (gameState.frameCount % 120 < 60) {
    return { keyCode: KEYS.DOWN };
  } else {
    return { keyCode: KEYS.LEFT };
  }
}

// Get action for TEST_5: Grab release test
function getTest5Action() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Climb partway, release, try to re-grab
  if (player.y < 300 && gameState.isGrabbing) {
    // Release
    return { keyCode: KEYS.DOWN };
  } else if (player.y > 250 && !gameState.isGrabbing) {
    // Try to grab during fall
    return { keyCode: KEYS.Z };
  } else if (!gameState.isGrabbing) {
    // Climb up
    return { keyCode: KEYS.UP };
  } else {
    return { keyCode: KEYS.UP };
  }
}

// Get action for TEST_6: Tower instability test
function getTest6Action() {
  if (!gameState.player) return null;
  
  // Try to build tall tower and climb it
  return getTest2Action(); // Use win strategy to build tall tower
}

// Get action for TEST_7: Rapid input test
function getTest7Action() {
  if (!gameState.player) return null;
  
  // Rapid sequence of inputs
  const cycle = gameState.frameCount % 30;
  
  if (cycle < 5) return { keyCode: KEYS.LEFT };
  if (cycle < 10) return { keyCode: KEYS.RIGHT };
  if (cycle < 15) return { keyCode: KEYS.SPACE };
  if (cycle < 20) return { keyCode: KEYS.Z };
  if (cycle < 25) return { keyCode: KEYS.UP };
  return { keyCode: KEYS.DOWN };
}

// Main automated testing function
export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      return getTest1Action();
    case CONTROL_MODES.TEST_2:
      return getTest2Action();
    case CONTROL_MODES.TEST_3:
      return getTest3Action();
    case CONTROL_MODES.TEST_4:
      return getTest4Action();
    case CONTROL_MODES.TEST_5:
      return getTest5Action();
    case CONTROL_MODES.TEST_6:
      return getTest6Action();
    case CONTROL_MODES.TEST_7:
      return getTest7Action();
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;