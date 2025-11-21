// automated_testing_controller.js - Automated testing
import { gameState } from './globals.js';

let testState = {
  strategy: 'init',
  targetLane: 2,
  aimDirection: 0,
  framesSinceLastChampion: 0,
  framesSinceDirectionChange: 0,
  consecutiveFramesStuck: 0,
  lastUnitCount: 0,
  framesSinceLastAction: 0
};

function getTestWinAction(gameState) {
  testState.framesSinceLastChampion++;
  testState.framesSinceDirectionChange++;
  testState.framesSinceLastAction++;
  
  const action = {
    left: false,
    right: false,
    space: false,
    z: false,
    shift: false
  };
  
  // Always fire
  action.space = true;
  
  // Deploy champion when available and enough time has passed
  if (gameState.unitCount >= 100 && testState.framesSinceLastChampion > 120) {
    action.z = true;
    testState.framesSinceLastChampion = 0;
  }
  
  // Use speed boost when available and units are built up
  if (gameState.unitCount >= 150 && gameState.unitCount < 200) {
    action.shift = true;
  }
  
  // Smart aiming strategy
  // Find best gate to aim at
  let bestGate = null;
  let bestValue = 0;
  
  for (let gate of gameState.gates) {
    if (gate.used) continue;
    
    const value = gate.type === 'multiply' ? gate.value * 10 : gate.value;
    const distance = Math.abs(gate.x - 300); // Distance from center
    const score = value - distance * 0.1;
    
    if (score > bestValue) {
      bestValue = score;
      bestGate = gate;
    }
  }
  
  // Aim towards best gate or sweep
  if (bestGate && testState.framesSinceDirectionChange > 60) {
    if (bestGate.x < 250) {
      testState.aimDirection = -1;
    } else if (bestGate.x > 350) {
      testState.aimDirection = 1;
    } else {
      testState.aimDirection = 0;
    }
    testState.framesSinceDirectionChange = 0;
  } else if (testState.framesSinceDirectionChange > 180) {
    // Change direction periodically
    testState.aimDirection = Math.random() > 0.5 ? 1 : -1;
    testState.framesSinceDirectionChange = 0;
  }
  
  if (testState.aimDirection < 0) {
    action.left = true;
  } else if (testState.aimDirection > 0) {
    action.right = true;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  testState.framesSinceDirectionChange++;
  
  const action = {
    left: false,
    right: false,
    space: true, // Always fire
    z: false,
    shift: false
  };
  
  // Sweep left and right
  if (testState.framesSinceDirectionChange > 120) {
    testState.aimDirection *= -1;
    testState.framesSinceDirectionChange = 0;
  }
  
  if (testState.aimDirection < 0) {
    action.left = true;
  } else {
    action.right = true;
  }
  
  // Occasional champion
  if (gameState.unitCount >= 150 && Math.random() > 0.95) {
    action.z = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  const action = {
    left: Math.random() > 0.6,
    right: Math.random() > 0.6,
    space: Math.random() > 0.3,
    z: gameState.unitCount >= 100 && Math.random() > 0.98,
    shift: gameState.unitCount >= 50 && Math.random() > 0.99
  };
  
  return action;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;