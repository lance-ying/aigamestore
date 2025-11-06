// automated_testing_controller.js - Automated testing
import { gameState, PHASE_PLAYING } from './globals.js';

// Helper to find angle to target
function getAngleToElement(player, element) {
  const dx = element.x - player.x;
  const dy = element.y - player.y;
  const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
  let diff = targetAngle - player.viewAngle;
  
  // Normalize to -180 to 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  return diff;
}

// TEST_1: Basic movement and interaction
function getTest1Action(gameState) {
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, interact: false, toggleOculus: false };
  
  if (!player) return action;
  
  // Simple exploration: rotate slowly and try to interact
  if (gameState.frameCount % 30 === 0) {
    action.right = true;
  }
  
  if (gameState.frameCount % 60 === 0 && gameState.targetElement) {
    action.interact = true;
  }
  
  return action;
}

// TEST_2: Win strategy
function getTest2Action(gameState) {
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, interact: false, toggleOculus: false };
  
  if (!player) return action;
  
  // Find next unsolved accessible puzzle
  let targetElement = null;
  for (let elem of gameState.puzzleElements) {
    if (!elem.solved && elem.isAccessible()) {
      // Check if requires oculus
      if (elem.requiresOculus && !gameState.oculusActive && gameState.oculusEnergy > 10) {
        action.toggleOculus = true;
        return action;
      }
      targetElement = elem;
      break;
    }
  }
  
  if (!targetElement) {
    // All accessible puzzles solved, just wait or explore
    return action;
  }
  
  // Calculate angle to target
  const angleDiff = getAngleToElement(player, targetElement);
  
  // Rotate towards target
  if (Math.abs(angleDiff) > 15) {
    if (angleDiff > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  } else {
    // Close enough, try to interact
    if (gameState.targetElement === targetElement) {
      action.interact = true;
    } else {
      // Keep adjusting angle
      if (angleDiff > 0) {
        action.right = true;
      } else {
        action.left = true;
      }
    }
  }
  
  return action;
}

// TEST_3: Oculus testing
function getTest3Action(gameState) {
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, interact: false, toggleOculus: false };
  
  if (!player) return action;
  
  // Toggle oculus periodically
  if (gameState.frameCount % 120 === 0 && gameState.oculusEnergy > 20) {
    action.toggleOculus = true;
  }
  
  // Look for hidden elements
  const hasHidden = gameState.puzzleElements.some(e => e.requiresOculus && !e.solved);
  if (hasHidden && !gameState.oculusActive && gameState.oculusEnergy > 30) {
    action.toggleOculus = true;
  }
  
  // Continue with win strategy
  return { ...getTest2Action(gameState), toggleOculus: action.toggleOculus };
}

// TEST_4: Edge case testing
function getTest4Action(gameState) {
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, interact: false, toggleOculus: false };
  
  if (!player) return action;
  
  // Spam interactions and rapid movements
  if (gameState.frameCount % 5 === 0) {
    action.interact = true;
  }
  
  if (gameState.frameCount % 10 < 5) {
    action.right = true;
  } else {
    action.left = true;
  }
  
  if (gameState.frameCount % 30 === 0) {
    action.toggleOculus = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'up', 'down', 'interact', 'toggleOculus'];
  const action = { left: false, right: false, up: false, down: false, interact: false, toggleOculus: false };
  
  if (Math.random() < 0.3) {
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    action[randomAction] = true;
  }
  
  return action;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, interact: false, toggleOculus: false };
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    case "TEST_3":
      return getTest3Action(gameState);
    case "TEST_4":
      return getTest4Action(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;