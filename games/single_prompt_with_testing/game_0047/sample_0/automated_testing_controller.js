// automated_testing_controller.js - Automated testing logic

import { gameState, TOTAL_CLUES } from './globals.js';

let testState = {
  initialized: false,
  targetClueIndex: 0,
  hasAllClues: false,
  movingToPortal: false,
  stuckCounter: 0,
  lastX: 0,
  lastZ: 0,
  avoidanceTimer: 0,
  randomMoveTimer: 0,
  visitedClues: new Set()
};

function resetTestState() {
  testState = {
    initialized: false,
    targetClueIndex: 0,
    hasAllClues: false,
    movingToPortal: false,
    stuckCounter: 0,
    lastX: 0,
    lastZ: 0,
    avoidanceTimer: 0,
    randomMoveTimer: 0,
    visitedClues: new Set()
  };
}

function getTestWinAction(gameState) {
  if (!testState.initialized) {
    resetTestState();
    testState.initialized = true;
  }
  
  const player = gameState.player;
  if (!player) return { forward: 0, strafe: 0, turn: 0, interact: false, sprint: false };
  
  // Check if we have all clues
  if (gameState.cluesFound >= TOTAL_CLUES) {
    testState.hasAllClues = true;
    testState.movingToPortal = true;
  }
  
  // Detect if stuck
  const dx = player.x - testState.lastX;
  const dz = player.z - testState.lastZ;
  const distMoved = Math.sqrt(dx * dx + dz * dz);
  
  if (distMoved < 0.01) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  
  testState.lastX = player.x;
  testState.lastZ = player.z;
  
  // If stuck, try random movement
  if (testState.stuckCounter > 30) {
    testState.randomMoveTimer = 60;
    testState.stuckCounter = 0;
  }
  
  if (testState.randomMoveTimer > 0) {
    testState.randomMoveTimer--;
    return {
      forward: Math.sin(testState.randomMoveTimer * 0.1) > 0 ? 1 : -1,
      strafe: 0,
      turn: Math.cos(testState.randomMoveTimer * 0.15),
      interact: false,
      sprint: false
    };
  }
  
  // Check for nearby spirits and avoid them
  let nearestSpiritDist = Infinity;
  let nearestSpirit = null;
  
  for (const spirit of gameState.spirits) {
    const dist = Math.sqrt((spirit.x - player.x) ** 2 + (spirit.z - player.z) ** 2);
    if (dist < nearestSpiritDist) {
      nearestSpiritDist = dist;
      nearestSpirit = spirit;
    }
  }
  
  // If spirit is close or chasing, evade
  const dangerDistance = 6.0;
  if (nearestSpirit && (nearestSpiritDist < dangerDistance || nearestSpirit.isChasing)) {
    const evadeAngle = Math.atan2(player.x - nearestSpirit.x, player.z - nearestSpirit.z);
    const angleDiff = normalizeAngle(evadeAngle - player.angle);
    
    return {
      forward: 1,
      strafe: 0,
      turn: Math.sign(angleDiff) * Math.min(Math.abs(angleDiff) * 2, 1),
      interact: false,
      sprint: true
    };
  }
  
  // Move to exit portal if we have all clues
  if (testState.movingToPortal && gameState.exitPortal && gameState.exitPortal.active) {
    const portal = gameState.exitPortal;
    const dist = Math.sqrt((portal.x - player.x) ** 2 + (portal.z - player.z) ** 2);
    
    if (dist < 2.0) {
      return { forward: 0, strafe: 0, turn: 0, interact: true, sprint: false };
    }
    
    const targetAngle = Math.atan2(portal.x - player.x, portal.z - player.z);
    const angleDiff = normalizeAngle(targetAngle - player.angle);
    
    return {
      forward: 1,
      strafe: 0,
      turn: Math.sign(angleDiff) * Math.min(Math.abs(angleDiff) * 2, 1),
      interact: false,
      sprint: true
    };
  }
  
  // Find nearest undiscovered clue
  let nearestClue = null;
  let nearestDist = Infinity;
  
  for (let i = 0; i < gameState.clues.length; i++) {
    const clue = gameState.clues[i];
    if (!clue.discovered) {
      const dist = Math.sqrt((clue.x - player.x) ** 2 + (clue.z - player.z) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestClue = clue;
      }
    }
  }
  
  if (!nearestClue) {
    return { forward: 0, strafe: 0, turn: 0, interact: false, sprint: false };
  }
  
  // Navigate to clue
  const dist = Math.sqrt((nearestClue.x - player.x) ** 2 + (nearestClue.z - player.z) ** 2);
  
  if (dist < 2.0) {
    return { forward: 0, strafe: 0, turn: 0, interact: true, sprint: false };
  }
  
  const targetAngle = Math.atan2(nearestClue.x - player.x, nearestClue.z - player.z);
  const angleDiff = normalizeAngle(targetAngle - player.angle);
  
  const shouldSprint = nearestSpiritDist > 10;
  
  return {
    forward: 1,
    strafe: 0,
    turn: Math.sign(angleDiff) * Math.min(Math.abs(angleDiff) * 2, 1),
    interact: false,
    sprint: shouldSprint
  };
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { forward: 0, strafe: 0, turn: 0, interact: false, sprint: false };
  
  // Simple movement test - move forward and turn
  const time = gameState.framesSinceStart;
  
  if (time < 60) {
    return { forward: 1, strafe: 0, turn: 0, interact: false, sprint: false };
  } else if (time < 120) {
    return { forward: 0, strafe: 0, turn: 1, interact: false, sprint: false };
  } else if (time < 180) {
    return { forward: 1, strafe: 0, turn: 0, interact: false, sprint: true };
  } else if (time < 240) {
    // Try to interact with anything nearby
    return { forward: 0, strafe: 0, turn: 0, interact: true, sprint: false };
  } else {
    return { forward: 1, strafe: 0, turn: 0.5, interact: false, sprint: false };
  }
}

function getSpiritTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { forward: 0, strafe: 0, turn: 0, interact: false, sprint: false };
  
  // Move toward nearest spirit to test detection
  if (gameState.spirits.length > 0) {
    const spirit = gameState.spirits[0];
    const targetAngle = Math.atan2(spirit.x - player.x, spirit.z - player.z);
    const angleDiff = normalizeAngle(targetAngle - player.angle);
    
    return {
      forward: 1,
      strafe: 0,
      turn: Math.sign(angleDiff) * Math.min(Math.abs(angleDiff) * 2, 1),
      interact: false,
      sprint: false
    };
  }
  
  return { forward: 1, strafe: 0, turn: 0, interact: false, sprint: false };
}

function getRandomAction(gameState) {
  const actions = [
    { forward: 1, strafe: 0, turn: 0, interact: false, sprint: false },
    { forward: -1, strafe: 0, turn: 0, interact: false, sprint: false },
    { forward: 0, strafe: 0, turn: 1, interact: false, sprint: false },
    { forward: 0, strafe: 0, turn: -1, interact: false, sprint: false },
    { forward: 1, strafe: 0, turn: 0.5, interact: false, sprint: true }
  ];
  
  const index = Math.floor(Math.random() * actions.length);
  return actions[index];
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSpiritTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;