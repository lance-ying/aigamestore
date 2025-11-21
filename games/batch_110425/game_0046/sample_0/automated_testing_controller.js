import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Monitor cameras periodically, close doors when threats nearby
  
  // Check for immediate threats at doors
  const leftThreat = gameState.animatronics.some(a => a.atLeftDoor);
  const rightThreat = gameState.animatronics.some(a => a.atRightDoor);
  
  // Close doors if threats present
  if (leftThreat && !gameState.leftDoorClosed) {
    return { keyCode: 90 }; // Z - close left door
  }
  if (rightThreat && !gameState.rightDoorClosed) {
    return { keyCode: 16 }; // SHIFT - close right door
  }
  
  // Open doors if no threats to conserve power
  if (!leftThreat && gameState.leftDoorClosed && gameState.power < 70) {
    return { keyCode: 90 }; // Open left door
  }
  if (!rightThreat && gameState.rightDoorClosed && gameState.power < 70) {
    return { keyCode: 16 }; // Open right door
  }
  
  // Periodically check cameras if power allows
  if (gameState.power > 30 && gameState.testActionDelay % 180 === 0) {
    if (!gameState.cameraOpen) {
      return { keyCode: 32 }; // SPACE - open camera
    }
  }
  
  // Switch cameras to scout
  if (gameState.cameraOpen && gameState.testActionDelay % 30 === 0) {
    return { keyCode: 39 }; // RIGHT - next camera
  }
  
  // Close camera to save power
  if (gameState.cameraOpen && gameState.testActionDelay % 180 === 90) {
    return { keyCode: 32 }; // SPACE - close camera
  }
  
  // Check lights periodically when power allows
  if (!gameState.cameraOpen && gameState.power > 40 && gameState.testActionDelay % 120 === 0) {
    return { keyCode: 37 }; // LEFT - check left light
  }
  if (!gameState.cameraOpen && gameState.power > 40 && gameState.testActionDelay % 120 === 60) {
    return { keyCode: 39 }; // RIGHT - check right light
  }
  
  return null;
}

function getTestBasicAction(gameState) {
  // Test all controls in sequence
  const actionSequence = [
    { keyCode: 32 },  // Toggle camera
    { keyCode: 39 },  // Switch camera right
    { keyCode: 37 },  // Switch camera left
    { keyCode: 32 },  // Close camera
    { keyCode: 90 },  // Toggle left door
    { keyCode: 16 },  // Toggle right door
    { keyCode: 37 },  // Left light
    { keyCode: 39 },  // Right light
    { keyCode: 90 },  // Toggle left door off
    { keyCode: 16 },  // Toggle right door off
  ];
  
  const actionIndex = Math.floor(gameState.testActionDelay / 30) % actionSequence.length;
  return actionSequence[actionIndex];
}

function getTestDoorDefenseAction(gameState) {
  // Keep doors closed when animatronics nearby
  const leftNearby = gameState.animatronics.some(a => a.location === 2 || a.location === 4 || a.atLeftDoor);
  const rightNearby = gameState.animatronics.some(a => a.location === 3 || a.location === 5 || a.atRightDoor);
  
  if (leftNearby && !gameState.leftDoorClosed) {
    return { keyCode: 90 };
  }
  if (rightNearby && !gameState.rightDoorClosed) {
    return { keyCode: 16 };
  }
  
  // Periodically check cameras
  if (gameState.testActionDelay % 90 === 0) {
    return { keyCode: 32 };
  }
  
  return null;
}

function getTestPowerDepletionAction(gameState) {
  // Waste power intentionally
  if (!gameState.leftDoorClosed) {
    return { keyCode: 90 };
  }
  if (!gameState.rightDoorClosed) {
    return { keyCode: 16 };
  }
  if (!gameState.cameraOpen && gameState.testActionDelay % 60 === 0) {
    return { keyCode: 32 };
  }
  if (gameState.testActionDelay % 30 === 0) {
    return { keyCode: 37 };
  }
  return null;
}

function getTestMultiNightAction(gameState) {
  // Use win strategy to progress through nights
  return getTestWinAction(gameState);
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 32 },  // Camera
    { keyCode: 37 },  // Left arrow
    { keyCode: 39 },  // Right arrow
    { keyCode: 90 },  // Left door
    { keyCode: 16 },  // Right door
    null, null, null  // No action (more common)
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  gameState.testActionDelay++;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDoorDefenseAction(gameState);
    case "TEST_4":
      return getTestPowerDepletionAction(gameState);
    case "TEST_5":
      return getTestMultiNightAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;