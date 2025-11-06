// automated_testing_controller.js - Automated testing

import { GAME_PHASES } from './globals.js';

let testState = {
  pathIndex: 0,
  targetIndex: 0,
  lastAction: null,
  actionCounter: 0,
  stuckCounter: 0,
  lastX: 0,
  lastY: 0,
  explorationPhase: 0,
  collectionOrder: []
};

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Define optimal collection order
  const optimalPath = [
    { room: 0, target: { x: 500, y: 200 }, action: "collect_fragment" },
    { room: 0, target: { x: 580, y: 200 }, action: "use_door" },
    { room: 1, target: { x: 300, y: 150 }, action: "collect_fragment" },
    { room: 1, target: { x: 200, y: 300 }, action: "activate_mechanism" },
    { room: 1, target: { x: 580, y: 200 }, action: "use_door" },
    { room: 2, target: { x: 250, y: 100 }, action: "collect_key" },
    { room: 2, target: { x: 450, y: 300 }, action: "collect_fragment" },
    { room: 2, target: { x: 580, y: 200 }, action: "use_door" },
    { room: 3, target: { x: 300, y: 100 }, action: "collect_fragment" },
    { room: 3, target: { x: 580, y: 200 }, action: "use_door_with_key" },
    { room: 4, target: { x: 300, y: 200 }, action: "collect_fragment" },
    { room: 4, target: { x: 580, y: 200 }, action: "use_final_door" }
  ];
  
  // Check if we've moved (prevent stalling)
  if (Math.abs(player.x - testState.lastX) < 1 && Math.abs(player.y - testState.lastY) < 1) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastX = player.x;
  testState.lastY = player.y;
  
  // If stuck, try random movement
  if (testState.stuckCounter > 30) {
    testState.stuckCounter = 0;
    return Math.random() < 0.5 ? 37 : 39; // Turn left or right
  }
  
  // Get current objective
  if (testState.pathIndex >= optimalPath.length) {
    return null; // Completed
  }
  
  const currentObjective = optimalPath[testState.pathIndex];
  
  // Check if we're in the right room
  if (gameState.currentRoom !== currentObjective.room) {
    // Navigate to door in current room
    const doorInRoom = gameState.interactables.find(
      i => i.type === "door" && i.active && 
      Math.abs(i.x - 580) < 10 && Math.abs(i.y - 200) < 50
    );
    if (doorInRoom) {
      return navigateToTarget(player, doorInRoom.x, doorInRoom.y);
    }
  }
  
  // Navigate to target
  const target = currentObjective.target;
  const dist = Math.sqrt(Math.pow(player.x - target.x, 2) + Math.pow(player.y - target.y, 2));
  
  if (dist < 60) {
    // Close enough to interact
    if (currentObjective.action === "use_door_with_key") {
      testState.pathIndex++;
      return 90; // Z key to use item
    } else {
      testState.pathIndex++;
      return 32; // SPACE to interact
    }
  }
  
  return navigateToTarget(player, target.x, target.y);
}

function navigateToTarget(player, targetX, targetY) {
  // Calculate angle to target
  const targetAngle = Math.atan2(targetY - player.y, targetX - player.x);
  let angleDiff = targetAngle - player.angle;
  
  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Turn towards target
  if (Math.abs(angleDiff) > 0.1) {
    return angleDiff > 0 ? 39 : 37; // RIGHT or LEFT arrow
  }
  
  // Move forward
  return 38; // UP arrow
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  testState.actionCounter++;
  
  // Systematic exploration pattern
  const pattern = [38, 38, 38, 38, 39, 38, 38, 38, 38, 39, 38, 38, 32];
  const action = pattern[testState.actionCounter % pattern.length];
  
  return action;
}

function getInteractionTestAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Find nearest interactable
  let nearest = null;
  let minDist = Infinity;
  
  for (const interactable of gameState.interactables) {
    if (!interactable.active) continue;
    const dist = Math.sqrt(Math.pow(player.x - interactable.x, 2) + Math.pow(player.y - interactable.y, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = interactable;
    }
  }
  
  if (nearest && minDist < 60) {
    return 32; // SPACE to interact
  }
  
  if (nearest) {
    return navigateToTarget(player, nearest.x, nearest.y);
  }
  
  return 38; // Move forward
}

function getEvasionTestAction(gameState) {
  if (!gameState.player || !gameState.shadowEntity) return null;
  
  const player = gameState.player;
  const shadow = gameState.shadowEntity;
  
  if (!shadow.active || gameState.currentRoom !== shadow.room) {
    return 38; // Just move forward
  }
  
  // Calculate distance to shadow
  const distToShadow = Math.sqrt(
    Math.pow(player.x - shadow.x, 2) + Math.pow(player.y - shadow.y, 2)
  );
  
  if (distToShadow < 100) {
    // Run away from shadow
    const escapeAngle = Math.atan2(player.y - shadow.y, player.x - shadow.x);
    let angleDiff = escapeAngle - player.angle;
    
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > 0.2) {
      return angleDiff > 0 ? 39 : 37; // Turn towards escape direction
    }
    
    return 38; // Sprint forward (with shift held in main loop)
  }
  
  return 38; // Move forward normally
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getInteractionTestAction(gameState);
    case "TEST_4":
      return getEvasionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;