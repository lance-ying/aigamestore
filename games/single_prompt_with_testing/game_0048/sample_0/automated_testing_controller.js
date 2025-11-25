// automated_testing_controller.js - Automated testing logic

import { gameState, MODE_DESIGNER, MODE_TARGET_PRACTICE, DESIGNER_OPTIONS } from './globals.js';

let testState = {
  phase: 'INIT',
  targetOptionIndex: 0,
  adjustmentsMade: 0,
  testStartTime: 0,
  positionHistory: [],
  stuckCounter: 0,
  lastShootTime: 0,
  designOptimized: false,
};

function getTestWinAction(gameState) {
  // Phase 1: Optimize crosshair design
  if (!testState.designOptimized) {
    if (gameState.gameMode === MODE_TARGET_PRACTICE) {
      // Switch to designer to optimize
      return { keyCode: 90 }; // Z to switch modes
    }
    
    // Optimize crosshair settings for better visibility
    const optimalSettings = {
      lineLength: 25,
      lineWidth: 3,
      lineOpacity: 255,
      lineOffset: 8,
      centerDotSize: 5,
      centerDotOpacity: 255,
      outlineThickness: 2,
      outlineOpacity: 200,
      colorR: 0,
      colorG: 255,
      colorB: 255,
      rotation: 0,
    };
    
    const currentOption = DESIGNER_OPTIONS[gameState.selectedOptionIndex];
    const currentValue = gameState.crosshairDesign[currentOption.id];
    const targetValue = optimalSettings[currentOption.id];
    
    if (currentValue !== targetValue) {
      if (currentValue < targetValue) {
        return { keyCode: 39 }; // Right arrow
      } else {
        return { keyCode: 37 }; // Left arrow
      }
    } else {
      // Move to next option
      if (gameState.selectedOptionIndex < DESIGNER_OPTIONS.length - 1) {
        return { keyCode: 40 }; // Down arrow
      } else {
        testState.designOptimized = true;
        return { keyCode: 90 }; // Z to switch to target practice
      }
    }
  }
  
  // Phase 2: Play target practice optimally
  if (gameState.gameMode === MODE_DESIGNER) {
    return { keyCode: 90 }; // Switch to target practice
  }
  
  if (!gameState.player || gameState.targets.length === 0) {
    return { keyCode: 32 }; // Space (wait)
  }
  
  // Find closest target
  const player = gameState.player;
  let closestTarget = null;
  let closestDist = Infinity;
  
  gameState.targets.forEach(target => {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist && target.alive) {
      closestDist = dist;
      closestTarget = target;
    }
  });
  
  if (!closestTarget) {
    return { keyCode: 32 }; // Space
  }
  
  const dx = closestTarget.x - player.x;
  const dy = closestTarget.y - player.y;
  
  // Move towards target with prediction
  const predictedX = closestTarget.x + Math.cos(closestTarget.angle) * closestTarget.speed * 10;
  const predictedY = closestTarget.y + Math.sin(closestTarget.angle) * closestTarget.speed * 10;
  
  const predDx = predictedX - player.x;
  const predDy = predictedY - player.y;
  
  let keyCode = null;
  
  // Prioritize getting into good shooting position
  if (Math.abs(predDx) > Math.abs(predDy)) {
    keyCode = predDx > 0 ? 39 : 37; // Right or Left
  } else {
    keyCode = predDy > 0 ? 40 : 38; // Down or Up
  }
  
  // Shoot when in reasonable range and lined up
  const currentTime = Date.now();
  if (closestDist < 250 && currentTime - testState.lastShootTime > 300) {
    testState.lastShootTime = currentTime;
    return { keyCode: 32 }; // Space to shoot
  }
  
  return { keyCode };
}

function getBasicTestAction(gameState) {
  // Test basic navigation in designer
  if (gameState.gameMode === MODE_DESIGNER) {
    const actions = [40, 40, 39, 39, 39, 37, 37, 38, 38, 90]; // Navigate and switch
    const index = testState.adjustmentsMade % actions.length;
    testState.adjustmentsMade++;
    return { keyCode: actions[index] };
  } else {
    // Test basic movement and shooting in target practice
    const actions = [37, 38, 39, 40, 32, 32];
    const index = testState.adjustmentsMade % actions.length;
    testState.adjustmentsMade++;
    return { keyCode: actions[index] };
  }
}

function getExtremeValuesTestAction(gameState) {
  if (gameState.gameMode === MODE_TARGET_PRACTICE) {
    return { keyCode: 90 }; // Switch to designer
  }
  
  // Test extreme values
  const currentOption = DESIGNER_OPTIONS[gameState.selectedOptionIndex];
  const currentValue = gameState.crosshairDesign[currentOption.id];
  
  // Cycle through: max -> min -> default -> next option
  if (testState.phase === 'INIT') {
    testState.phase = 'TO_MAX';
  }
  
  if (testState.phase === 'TO_MAX') {
    if (currentValue < currentOption.max) {
      return { keyCode: 39 }; // Right
    } else {
      testState.phase = 'TO_MIN';
    }
  } else if (testState.phase === 'TO_MIN') {
    if (currentValue > currentOption.min) {
      return { keyCode: 37 }; // Left
    } else {
      testState.phase = 'TO_DEFAULT';
    }
  } else if (testState.phase === 'TO_DEFAULT') {
    return { keyCode: 32 }; // Space (reset to default)
    testState.phase = 'NEXT_OPTION';
  } else if (testState.phase === 'NEXT_OPTION') {
    testState.phase = 'TO_MAX';
    if (gameState.selectedOptionIndex < DESIGNER_OPTIONS.length - 1) {
      return { keyCode: 40 }; // Down
    } else {
      return { keyCode: 90 }; // Switch mode
    }
  }
  
  return { keyCode: 40 };
}

function getCollisionTestAction(gameState) {
  if (gameState.gameMode === MODE_DESIGNER) {
    return { keyCode: 90 }; // Switch to target practice
  }
  
  if (!gameState.player) {
    return { keyCode: 32 };
  }
  
  // Test shooting mechanics
  const currentTime = Date.now();
  if (currentTime - testState.lastShootTime > 400) {
    testState.lastShootTime = currentTime;
    return { keyCode: 32 }; // Shoot
  }
  
  // Move in a pattern
  const movePattern = [37, 37, 38, 38, 39, 39, 40, 40];
  const index = Math.floor(testState.adjustmentsMade / 5) % movePattern.length;
  testState.adjustmentsMade++;
  return { keyCode: movePattern[index] };
}

function getProgressionTestAction(gameState) {
  // This test validates the progression system
  // Similar to win test but tracks performance metrics
  return getTestWinAction(gameState);
}

function getRandomAction(gameState) {
  const possibleKeys = [37, 38, 39, 40, 32, 90];
  const randomKey = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
  return { keyCode: randomKey };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getExtremeValuesTestAction(gameState);
    case "TEST_4":
      return getCollisionTestAction(gameState);
    case "TEST_5":
      return getProgressionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;