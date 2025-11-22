// automated_testing_controller.js - Automated testing strategies

import { GAME_PHASES } from './globals.js';

let testState = {
  initialized: false,
  waitFrames: 0,
  targetAngle: -45,
  targetPower: 70,
  shotsFired: 0,
  lastActionFrame: 0
};

function getTestWinAction(gameState) {
  const currentFrame = gameState.frameCount;
  
  // Wait for game to be in playing state
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { aimLeft: false, aimRight: false, powerUp: false, powerDown: false, launch: false, ability: false };
  }
  
  // Initialize test state
  if (!testState.initialized) {
    testState.initialized = true;
    testState.waitFrames = 0;
    testState.shotsFired = 0;
  }
  
  // If aiming, set up optimal shot
  if (gameState.isAiming && !gameState.birdLaunched && gameState.currentBird) {
    testState.waitFrames++;
    
    // Determine optimal angle and power based on remaining pigs
    if (testState.shotsFired === 0) {
      testState.targetAngle = -50;
      testState.targetPower = 75;
    } else if (testState.shotsFired === 1) {
      testState.targetAngle = -40;
      testState.targetPower = 70;
    } else {
      testState.targetAngle = -45;
      testState.targetPower = 65;
    }
    
    // Adjust angle
    const angleDiff = testState.targetAngle - gameState.slingshotAngle;
    const aimLeft = angleDiff < -1;
    const aimRight = angleDiff > 1;
    
    // Adjust power
    const powerDiff = testState.targetPower - gameState.slingshotPower;
    const powerUp = powerDiff > 1;
    const powerDown = powerDiff < -1;
    
    // Launch when ready
    const angleReady = Math.abs(angleDiff) < 2;
    const powerReady = Math.abs(powerDiff) < 2;
    const launch = angleReady && powerReady && testState.waitFrames > 20;
    
    if (launch) {
      testState.shotsFired++;
      testState.waitFrames = 0;
    }
    
    return { aimLeft, aimRight, powerUp, powerDown, launch, ability: false };
  }
  
  // If bird is in flight, activate ability at optimal time
  if (gameState.currentBird && gameState.currentBird.launched && !gameState.currentBird.abilityUsed) {
    const distanceTraveled = Math.abs(gameState.currentBird.x - 100);
    
    // Activate ability when bird is near structures
    if (distanceTraveled > 200 && gameState.currentBird.x < 500) {
      return { aimLeft: false, aimRight: false, powerUp: false, powerDown: false, launch: false, ability: true };
    }
  }
  
  // Wait for bird to settle
  return { aimLeft: false, aimRight: false, powerUp: false, powerDown: false, launch: false, ability: false };
}

function getBasicTestAction(gameState) {
  const currentFrame = gameState.frameCount;
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { aimLeft: false, aimRight: false, powerUp: false, powerDown: false, launch: false, ability: false };
  }
  
  // Simple test: adjust angle and power, then launch
  if (gameState.isAiming && !gameState.birdLaunched && gameState.currentBird) {
    testState.waitFrames++;
    
    const aimRight = gameState.slingshotAngle < -50;
    const powerUp = gameState.slingshotPower < 60;
    const launch = testState.waitFrames > 40 && !aimRight && !powerUp;
    
    if (launch) {
      testState.waitFrames = 0;
    }
    
    return { aimLeft: false, aimRight, powerUp, powerDown: false, launch, ability: false };
  }
  
  return { aimLeft: false, aimRight: false, powerUp: false, powerDown: false, launch: false, ability: false };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return { aimLeft: false, aimRight: false, powerUp: false, powerDown: false, launch: false, ability: false };
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;