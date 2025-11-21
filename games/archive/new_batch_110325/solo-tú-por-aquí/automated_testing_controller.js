// automated_testing_controller.js - Automated testing strategies

import { gameState, KEY_CODES } from './globals.js';

// Track exploration state
const explorationState = {
  visitedPositions: [],
  targetIndex: 0,
  stuckCounter: 0,
  lastX: 0,
  lastY: 0
};

// Key target locations for TEST_2 (win strategy)
const winTargets = [
  { x: -150, y: 0, type: 'redKey', priority: 1 },
  { x: 900, y: 200, type: 'blueKey', priority: 2 },
  { x: 300, y: 600, type: 'machinery', priority: 3 },
  { x: 300, y: -200, type: 'finalDoor', priority: 4 }
];

// Exploration targets for TEST_3
const explorationTargets = [
  { x: 300, y: 200 },   // Hub
  { x: -150, y: 0 },    // Red Zone
  { x: 900, y: 200 },   // Blue Zone
  { x: 300, y: 600 },   // Machinery Zone
  { x: 300, y: -200 },  // Final Zone
  { x: 100, y: 100 },   // Secret locations
  { x: 500, y: 300 },
  { x: -200, y: 100 },
  { x: 800, y: 100 }
];

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  // Determine current objective
  let targetObj = null;
  
  if (!gameState.keysCollected.includes('red')) {
    targetObj = winTargets[0]; // Get red key first
  } else if (!gameState.keysCollected.includes('blue')) {
    targetObj = winTargets[1]; // Get blue key second
  } else if (!gameState.machineryActive) {
    targetObj = winTargets[2]; // Activate machinery third
  } else if (!gameState.finalDoorOpen) {
    targetObj = winTargets[3]; // Open final door
  } else {
    return []; // Game won
  }
  
  return navigateToTarget(player, targetObj.x, targetObj.y, true);
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  // Random exploration with occasional interactions
  const actions = [];
  
  // Check if stuck
  if (Math.abs(player.worldX - explorationState.lastX) < 1 &&
      Math.abs(player.worldY - explorationState.lastY) < 1) {
    explorationState.stuckCounter++;
  } else {
    explorationState.stuckCounter = 0;
  }
  
  explorationState.lastX = player.worldX;
  explorationState.lastY = player.worldY;
  
  // If stuck, turn randomly
  if (explorationState.stuckCounter > 20) {
    actions.push(Math.random() < 0.5 ? KEY_CODES.LEFT_ARROW : KEY_CODES.RIGHT_ARROW);
    explorationState.stuckCounter = 0;
  } else {
    // Move forward most of the time
    if (Math.random() < 0.7) {
      actions.push(KEY_CODES.UP_ARROW);
    }
    
    // Random turning
    if (Math.random() < 0.2) {
      actions.push(Math.random() < 0.5 ? KEY_CODES.LEFT_ARROW : KEY_CODES.RIGHT_ARROW);
    }
    
    // Occasional interaction attempts
    if (Math.random() < 0.1 && gameState.interactionCooldown === 0) {
      actions.push(KEY_CODES.SPACE);
    }
    
    // Toggle running occasionally
    if (Math.random() < 0.02) {
      actions.push(KEY_CODES.Z);
    }
  }
  
  return actions;
}

function getExplorationTestAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  // Cycle through exploration targets
  if (explorationState.targetIndex >= explorationTargets.length) {
    explorationState.targetIndex = 0;
  }
  
  const target = explorationTargets[explorationState.targetIndex];
  const dx = target.x - player.worldX;
  const dy = target.y - player.worldY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If close to target, move to next
  if (distance < 50) {
    explorationState.targetIndex++;
    
    // Try to interact when reaching a target
    if (gameState.interactionCooldown === 0) {
      return [KEY_CODES.SPACE];
    }
  }
  
  return navigateToTarget(player, target.x, target.y, false);
}

function navigateToTarget(player, targetX, targetY, shouldInteract) {
  const actions = [];
  
  // Calculate direction to target
  const dx = targetX - player.worldX;
  const dy = targetY - player.worldY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angleToTarget = Math.atan2(dy, dx);
  
  // Calculate angle difference
  let angleDiff = angleToTarget - player.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // If close to target and aligned, try to interact
  if (shouldInteract && distance < 100 && Math.abs(angleDiff) < 0.3) {
    if (gameState.interactionCooldown === 0) {
      actions.push(KEY_CODES.SPACE);
    }
    return actions;
  }
  
  // Turn towards target if needed
  if (Math.abs(angleDiff) > 0.1) {
    if (angleDiff > 0) {
      actions.push(KEY_CODES.RIGHT_ARROW);
    } else {
      actions.push(KEY_CODES.LEFT_ARROW);
    }
  }
  
  // Move forward if roughly aligned
  if (Math.abs(angleDiff) < 0.5) {
    actions.push(KEY_CODES.UP_ARROW);
  }
  
  // Use running if far from target
  if (distance > 200 && !player.isRunning) {
    actions.push(KEY_CODES.Z);
  } else if (distance < 100 && player.isRunning) {
    actions.push(KEY_CODES.Z);
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  if (!gameState || !gameState.player) return [];
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    
    case "TEST_2":
      return getTestWinAction(gameState);
    
    case "TEST_3":
      return getExplorationTestAction(gameState);
    
    default:
      return [];
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;