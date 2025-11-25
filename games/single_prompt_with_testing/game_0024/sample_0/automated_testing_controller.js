// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

// Pathfinding helper
function getPathToTarget(startX, startY, targetX, targetY) {
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  
  if (dist < 5) return { left: false, right: false, up: false, down: false };
  
  const dirX = dx / dist;
  const dirY = dy / dist;
  
  return {
    left: dirX < -0.3,
    right: dirX > 0.3,
    up: dirY < -0.3,
    down: dirY > 0.3
  };
}

function isNearTarget(x, y, targetX, targetY, threshold = 50) {
  return Math.hypot(x - targetX, y - targetY) < threshold;
}

// TEST_1: Basic movement and collision testing
function getBasicTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, up: false, down: false };
  
  const player = gameState.player;
  const time = Math.floor(gameState.frameCount / 60);
  
  // Test different movement patterns
  const pattern = time % 8;
  
  switch (pattern) {
    case 0: return { left: false, right: true, up: false, down: false };
    case 1: return { left: false, right: false, up: false, down: true };
    case 2: return { left: true, right: false, up: false, down: false };
    case 3: return { left: false, right: false, up: true, down: false };
    case 4: return { left: false, right: true, up: false, down: true };
    case 5: return { left: true, right: false, up: false, down: true };
    case 6: return { left: true, right: false, up: true, down: false };
    case 7: return { left: false, right: true, up: true, down: false };
    default: return { left: false, right: false, up: false, down: false };
  }
}

// TEST_2: Optimal win strategy
function getTestWinAction(gameState) {
  if (!gameState.player) return { left: false, right: false, up: false, down: false, interact: false, pickup: false, sprint: false };
  
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, interact: false, pickup: false, sprint: true };
  
  // State machine for optimal win
  const switches = gameState.switches;
  const lightbulb = gameState.lightbulb;
  const sunChamber = gameState.sunChamber;
  
  // Priority 1: Activate switch 1 (room 1)
  if (switches[0] && !switches[0].activated) {
    if (isNearTarget(player.x, player.y, switches[0].x, switches[0].y)) {
      action.interact = true;
    } else {
      const path = getPathToTarget(player.x, player.y, switches[0].x, switches[0].y);
      Object.assign(action, path);
    }
    return action;
  }
  
  // Priority 2: Activate switch 2 (room 2)
  if (switches[1] && !switches[1].activated) {
    if (isNearTarget(player.x, player.y, switches[1].x, switches[1].y)) {
      action.interact = true;
    } else {
      const path = getPathToTarget(player.x, player.y, switches[1].x, switches[1].y);
      Object.assign(action, path);
    }
    return action;
  }
  
  // Priority 3: Get lightbulb (room 3)
  if (!gameState.hasLightbulb && lightbulb && !lightbulb.pickedUp) {
    if (isNearTarget(player.x, player.y, lightbulb.x, lightbulb.y)) {
      action.pickup = true;
    } else {
      const path = getPathToTarget(player.x, player.y, lightbulb.x, lightbulb.y);
      Object.assign(action, path);
    }
    return action;
  }
  
  // Priority 4: Activate switch 3 (bottom left)
  if (switches[2] && !switches[2].activated) {
    if (isNearTarget(player.x, player.y, switches[2].x, switches[2].y)) {
      action.interact = true;
    } else {
      const path = getPathToTarget(player.x, player.y, switches[2].x, switches[2].y);
      Object.assign(action, path);
    }
    return action;
  }
  
  // Priority 5: Activate switch 4 (bottom right)
  if (switches[3] && !switches[3].activated) {
    if (isNearTarget(player.x, player.y, switches[3].x, switches[3].y)) {
      action.interact = true;
    } else {
      const path = getPathToTarget(player.x, player.y, switches[3].x, switches[3].y);
      Object.assign(action, path);
    }
    return action;
  }
  
  // Priority 6: Place lightbulb at sun chamber
  if (gameState.hasLightbulb && sunChamber) {
    if (isNearTarget(player.x, player.y, sunChamber.x, sunChamber.y, 60)) {
      action.pickup = true;
    } else {
      const path = getPathToTarget(player.x, player.y, sunChamber.x, sunChamber.y);
      Object.assign(action, path);
    }
    return action;
  }
  
  return action;
}

// TEST_3: Sprint mechanics testing
function getSprintTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, up: false, down: false, sprint: false };
  
  const player = gameState.player;
  const time = Math.floor(gameState.frameCount / 120);
  const shouldSprint = (time % 2) === 0;
  
  // Move in circles while toggling sprint
  const angle = (gameState.frameCount * 0.02) % (Math.PI * 2);
  
  return {
    left: Math.cos(angle) < 0,
    right: Math.cos(angle) > 0,
    up: Math.sin(angle) < 0,
    down: Math.sin(angle) > 0,
    sprint: shouldSprint
  };
}

// TEST_4: Interaction testing
function getInteractionTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, up: false, down: false, interact: false };
  
  const player = gameState.player;
  const switches = gameState.switches;
  const action = { left: false, right: false, up: false, down: false, interact: false };
  
  // Go to each switch and test interaction
  for (let i = 0; i < switches.length; i++) {
    const sw = switches[i];
    if (!sw.activated) {
      if (isNearTarget(player.x, player.y, sw.x, sw.y)) {
        action.interact = true;
        return action;
      } else {
        const path = getPathToTarget(player.x, player.y, sw.x, sw.y);
        Object.assign(action, path);
        return action;
      }
    }
  }
  
  return action;
}

// TEST_5: Lightbulb mechanics testing
function getLightbulbTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, up: false, down: false, pickup: false, interact: false };
  
  const player = gameState.player;
  const lightbulb = gameState.lightbulb;
  const switches = gameState.switches;
  const action = { left: false, right: false, up: false, down: false, pickup: false, interact: false };
  
  // First activate switches to unlock lightbulb room
  if (!switches[0].activated || !switches[1].activated) {
    for (let i = 0; i < 2; i++) {
      if (!switches[i].activated) {
        if (isNearTarget(player.x, player.y, switches[i].x, switches[i].y)) {
          action.interact = true;
          return action;
        } else {
          const path = getPathToTarget(player.x, player.y, switches[i].x, switches[i].y);
          Object.assign(action, path);
          return action;
        }
      }
    }
  }
  
  // Then get lightbulb
  if (!gameState.hasLightbulb && lightbulb && !lightbulb.pickedUp) {
    if (isNearTarget(player.x, player.y, lightbulb.x, lightbulb.y)) {
      action.pickup = true;
    } else {
      const path = getPathToTarget(player.x, player.y, lightbulb.x, lightbulb.y);
      Object.assign(action, path);
    }
    return action;
  }
  
  // Test putting it down and picking it back up
  if (gameState.hasLightbulb) {
    const testX = 300;
    const testY = 100;
    if (isNearTarget(player.x, player.y, testX, testY, 30)) {
      // For now, just keep it - we'd need to implement drop functionality
      return action;
    } else {
      const path = getPathToTarget(player.x, player.y, testX, testY);
      Object.assign(action, path);
      return action;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  // Random walk with occasional interactions
  const rand = Math.random();
  return {
    left: rand < 0.2,
    right: rand >= 0.2 && rand < 0.4,
    up: rand >= 0.4 && rand < 0.6,
    down: rand >= 0.6 && rand < 0.8,
    interact: rand >= 0.8 && rand < 0.9,
    pickup: rand >= 0.9,
    sprint: Math.random() < 0.3
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSprintTestAction(gameState);
    case "TEST_4":
      return getInteractionTestAction(gameState);
    case "TEST_5":
      return getLightbulbTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;