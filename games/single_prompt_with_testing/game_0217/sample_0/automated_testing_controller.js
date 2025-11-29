// automated_testing_controller.js - AI controllers for automated testing

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Find nearest uncollected food orb
  let nearestFood = null;
  let nearestDist = Infinity;
  
  for (const food of gameState.foodOrbs) {
    if (!food.collected) {
      const dx = food.x - gameState.player.x;
      const dy = food.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestFood = food;
      }
    }
  }
  
  if (!nearestFood) return null;
  
  // If very close, try to interact
  if (nearestDist < 40) {
    return { keyCode: KEY_SPACE };
  }
  
  const dx = nearestFood.x - gameState.player.x;
  const dy = nearestFood.y - gameState.player.y;
  
  // Move horizontally toward food
  if (Math.abs(dx) > 10) {
    if (dx > 0) {
      return { keyCode: KEY_RIGHT };
    } else {
      return { keyCode: KEY_LEFT };
    }
  }
  
  // Jump if food is above and we're on ground
  if (dy < -20 && gameState.player.onGround) {
    return { keyCode: KEY_UP };
  }
  
  // Move toward food horizontally
  if (Math.abs(dx) > 5) {
    return { keyCode: dx > 0 ? KEY_RIGHT : KEY_LEFT };
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  const frame = gameState.frameCount;
  
  // Alternate movement patterns
  if (frame % 180 < 60) {
    return { keyCode: KEY_RIGHT };
  } else if (frame % 180 < 120) {
    return { keyCode: KEY_LEFT };
  } else if (frame % 180 < 150) {
    return { keyCode: KEY_UP };
  }
  
  return null;
}

function getRandomAction(gameState) {
  if (Math.random() < 0.95) return null; // Only act 5% of the time
  
  const actions = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

function getCreatureTestAction(gameState) {
  if (!gameState.player || gameState.creatures.length === 0) {
    return getRandomAction(gameState);
  }
  
  // Move toward nearest creature
  const creature = gameState.creatures[0];
  const dx = creature.x - gameState.player.x;
  
  if (Math.abs(dx) > 20) {
    return { keyCode: dx > 0 ? KEY_RIGHT : KEY_LEFT };
  }
  
  return null;
}

function getEdgeTestAction(gameState) {
  if (!gameState.player) return null;
  
  const frame = gameState.frameCount;
  const pattern = Math.floor(frame / 120) % 4;
  
  switch (pattern) {
    case 0: // Move to left edge
      if (gameState.player.x > 50) {
        return { keyCode: KEY_LEFT };
      }
      break;
    case 1: // Move to right edge
      if (gameState.player.x < CANVAS_WIDTH - 50) {
        return { keyCode: KEY_RIGHT };
      }
      break;
    case 2: // Jump repeatedly
      if (frame % 15 === 0) {
        return { keyCode: KEY_UP };
      }
      break;
    case 3: // Rapid direction changes
      if (frame % 10 < 5) {
        return { keyCode: KEY_LEFT };
      } else {
        return { keyCode: KEY_RIGHT };
      }
  }
  
  return null;
}

function getPauseTestAction(gameState) {
  // This test is handled by external testing framework
  return getBasicTestAction(gameState);
}

function getRestartTestAction(gameState) {
  // Collect a few orbs then testing framework will restart
  if (gameState.foodCollected < 5) {
    return getTestWinAction(gameState);
  }
  return null;
}

export function get_automated_testing_action(gameState) {
  if (!gameState) return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCreatureTestAction(gameState);
    case "TEST_4":
      return getRandomAction(gameState);
    case "TEST_5":
      return getEdgeTestAction(gameState);
    case "TEST_6":
      return getPauseTestAction(gameState);
    case "TEST_7":
      return getRestartTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}