// automated_testing_controller.js - Automated testing AI
import { gameState } from './globals.js';

let testState = {
  targetX: 0,
  targetY: 0,
  targetRoom: 0,
  phase: "COLLECT_RED",
  positionHistory: [],
  stuckCounter: 0,
  lastInteractionFrame: 0
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  const currentRoom = gameState.currentRoom;
  
  // Update phase based on progress
  if (!gameState.hasRedKeycard && testState.phase === "COLLECT_RED") {
    testState.targetRoom = 3; // Go to research lab
    testState.targetX = 175;
    testState.targetY = 130;
  } else if (gameState.hasRedKeycard && !gameState.redDoorUnlocked && testState.phase === "COLLECT_RED") {
    testState.phase = "UNLOCK_RED";
    testState.targetRoom = 1;
    testState.targetX = 390;
    testState.targetY = 145;
  } else if (gameState.redDoorUnlocked && !gameState.hasBlueKeycard && testState.phase === "UNLOCK_RED") {
    testState.phase = "COLLECT_BLUE";
    testState.targetRoom = 2;
    testState.targetX = 140;
    testState.targetY = 110;
  } else if (gameState.hasBlueKeycard && !gameState.blueDoorUnlocked && testState.phase === "COLLECT_BLUE") {
    testState.phase = "UNLOCK_BLUE";
    testState.targetRoom = 2;
    testState.targetX = 135;
    testState.targetY = 210;
  } else if (gameState.blueDoorUnlocked && !gameState.hasGreenKeycard && testState.phase === "UNLOCK_BLUE") {
    testState.phase = "COLLECT_GREEN";
    testState.targetRoom = 4;
    testState.targetX = 160;
    testState.targetY = 120;
  } else if (gameState.hasGreenKeycard && !gameState.greenDoorUnlocked && testState.phase === "COLLECT_GREEN") {
    testState.phase = "UNLOCK_GREEN";
    testState.targetRoom = 4;
    testState.targetX = 310;
    testState.targetY = 115;
  } else if (gameState.greenDoorUnlocked && testState.phase === "UNLOCK_GREEN") {
    testState.phase = "ESCAPE";
    testState.targetRoom = 5;
    testState.targetX = 140;
    testState.targetY = 100;
  }
  
  // Navigate to target
  if (currentRoom !== testState.targetRoom) {
    return navigateToRoom(player, currentRoom, testState.targetRoom, gameState);
  } else {
    return navigateToPoint(player, testState.targetX, testState.targetY, gameState);
  }
}

function navigateToRoom(player, fromRoom, toRoom, gameState) {
  // Simple pathfinding between rooms
  const room = gameState.rooms[fromRoom];
  
  // Find door to next room in path
  const pathMap = {
    0: { 1: { x: 145, y: 240 } },
    1: { 0: { x: 195, y: 0 }, 2: { x: 390, y: 145 }, 3: { x: 195, y: 290 } },
    2: { 1: { x: 0, y: 105 }, 4: { x: 135, y: 210 } },
    3: { 1: { x: 170, y: 0 } },
    4: { 2: { x: 155, y: 0 }, 5: { x: 310, y: 115 } },
    5: { 4: { x: 0, y: 95 } }
  };
  
  // BFS to find path
  const queue = [[fromRoom]];
  const visited = new Set([fromRoom]);
  let path = null;
  
  while (queue.length > 0) {
    const currentPath = queue.shift();
    const current = currentPath[currentPath.length - 1];
    
    if (current === toRoom) {
      path = currentPath;
      break;
    }
    
    const neighbors = pathMap[current] || {};
    for (let next in neighbors) {
      next = parseInt(next);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...currentPath, next]);
      }
    }
  }
  
  if (path && path.length > 1) {
    const nextRoom = path[1];
    const doorPos = pathMap[fromRoom][nextRoom];
    return navigateToPoint(player, doorPos.x, doorPos.y, gameState);
  }
  
  return { forward: false, backward: false, turnLeft: false, turnRight: false };
}

function navigateToPoint(player, targetX, targetY, gameState) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Check if we're at target
  if (dist < 20) {
    // Try to interact or use keycard
    if (gameState.nearestInteractable) {
      const currentFrame = window.gameInstance.frameCount;
      if (currentFrame - testState.lastInteractionFrame > 60) {
        testState.lastInteractionFrame = currentFrame;
        return { interact: true };
      }
    }
    
    // Check if near door that needs keycard
    const room = gameState.rooms[gameState.currentRoom];
    for (let conn of room.connections) {
      const doorDist = Math.sqrt((conn.x - player.x) ** 2 + (conn.y - player.y) ** 2);
      if (doorDist < 40 && conn.locked) {
        return { useKeycard: true };
      }
    }
    
    return { forward: false, backward: false, turnLeft: false, turnRight: false };
  }
  
  // Calculate desired angle
  const targetAngle = Math.atan2(dy, dx);
  let angleDiff = targetAngle - player.angle;
  
  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  
  // Turn towards target
  if (Math.abs(angleDiff) > 0.1) {
    return {
      turnLeft: angleDiff < 0,
      turnRight: angleDiff > 0
    };
  }
  
  // Move forward
  return { forward: true, sprint: dist > 50 };
}

function getBasicTestAction(gameState) {
  // Random exploration
  const actions = [
    { forward: true },
    { backward: true },
    { turnLeft: true },
    { turnRight: true },
    { forward: true, sprint: true }
  ];
  
  if (gameState.nearestInteractable) {
    return { interact: true };
  }
  
  const idx = Math.floor(Math.random() * actions.length);
  return actions[idx];
}

function getMovementTestAction(gameState) {
  // Test all movement directions systematically
  const frame = window.gameInstance.frameCount;
  const cycle = Math.floor(frame / 60) % 5;
  
  switch (cycle) {
    case 0: return { forward: true };
    case 1: return { backward: true };
    case 2: return { turnLeft: true };
    case 3: return { turnRight: true };
    case 4: return { forward: true, sprint: true };
  }
  
  return {};
}

function getInteractionTestAction(gameState) {
  const player = gameState.player;
  
  // Find nearest interactable and move towards it
  let nearestDist = Infinity;
  let nearestInteractable = null;
  
  for (let interactable of gameState.interactables) {
    if (interactable.roomId === gameState.currentRoom && !interactable.interacted) {
      const dist = Math.sqrt(
        (interactable.x - player.x) ** 2 + 
        (interactable.y - player.y) ** 2
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestInteractable = interactable;
      }
    }
  }
  
  if (nearestInteractable) {
    return navigateToPoint(player, nearestInteractable.x, nearestInteractable.y, gameState);
  }
  
  return { forward: true };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getMovementTestAction(gameState);
    case "TEST_4":
      return getInteractionTestAction(gameState);
    default:
      return {};
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;