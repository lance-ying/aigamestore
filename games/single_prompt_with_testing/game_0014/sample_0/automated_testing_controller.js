// automated_testing_controller.js
import { 
  KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z 
} from './globals.js';

let positionHistory = [];
let stuckCounter = 0;
let lastX = 0;
let lastY = 0;

function getTestWinAction(gameState) {
  const player = gameState.player;
  
  if (!player) return [];

  const actions = [];

  // Find nearest uncollected memory fragment
  let nearestFragment = null;
  let minDist = Infinity;
  
  for (const fragment of gameState.memoryFragments) {
    if (!fragment.collected) {
      const dist = Math.sqrt(
        Math.pow(fragment.x - player.x, 2) + 
        Math.pow(fragment.y - player.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestFragment = fragment;
      }
    }
  }

  // Check if we should go to portal
  if (gameState.portal.active && gameState.memoriesCollected >= 10) {
    nearestFragment = gameState.portal;
  }

  // Navigate to target
  if (nearestFragment) {
    const dx = nearestFragment.x - player.x;
    const dy = nearestFragment.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Use sprint if far away and stamina available
    if (dist > 100 && player.stamina > 30) {
      actions.push(KEY_SHIFT);
    }

    // Check for nearby hostiles and use shield
    let nearestHostile = null;
    let minHostileDist = Infinity;
    for (const hostile of gameState.hostiles) {
      const hDist = Math.sqrt(
        Math.pow(hostile.x - player.x, 2) + 
        Math.pow(hostile.y - player.y, 2)
      );
      if (hDist < minHostileDist) {
        minHostileDist = hDist;
        nearestHostile = hostile;
      }
    }

    if (minHostileDist < 80 && player.energy > 20) {
      actions.push(KEY_Z);
    }

    // Movement
    if (Math.abs(dx) > 5) {
      actions.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
    }
    if (Math.abs(dy) > 5) {
      actions.push(dy > 0 ? KEY_DOWN : KEY_UP);
    }

    // Interact when close
    if (dist < 30) {
      actions.push(KEY_SPACE);
    }

    // Anti-stuck mechanism
    if (Math.abs(player.x - lastX) < 1 && Math.abs(player.y - lastY) < 1) {
      stuckCounter++;
      if (stuckCounter > 30) {
        // Add random movement to unstuck
        const randomDir = Math.floor(Math.random() * 4);
        actions.push([KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN][randomDir]);
        stuckCounter = 0;
      }
    } else {
      stuckCounter = 0;
    }

    lastX = player.x;
    lastY = player.y;
  }

  return actions;
}

function getRandomAction(gameState) {
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.25) actions.push(KEY_LEFT);
  else if (rand < 0.5) actions.push(KEY_RIGHT);
  else if (rand < 0.75) actions.push(KEY_UP);
  else actions.push(KEY_DOWN);

  if (Math.random() < 0.1) actions.push(KEY_SPACE);
  if (Math.random() < 0.05) actions.push(KEY_SHIFT);

  return actions;
}

function getMovementTestAction(gameState) {
  const player = gameState.player;
  const actions = [];
  const time = gameState.elapsedTime;

  // Test all directions in sequence
  const phase = Math.floor(time / 60) % 4;
  switch (phase) {
    case 0: actions.push(KEY_RIGHT); break;
    case 1: actions.push(KEY_DOWN); break;
    case 2: actions.push(KEY_LEFT); break;
    case 3: actions.push(KEY_UP); break;
  }

  // Test sprint every 120 frames
  if (time % 120 < 60 && player.stamina > 10) {
    actions.push(KEY_SHIFT);
  }

  return actions;
}

function getCombatTestAction(gameState) {
  const player = gameState.player;
  const actions = [];

  // Find nearest hostile and approach it
  let nearestHostile = null;
  let minDist = Infinity;
  
  for (const hostile of gameState.hostiles) {
    const dist = Math.sqrt(
      Math.pow(hostile.x - player.x, 2) + 
      Math.pow(hostile.y - player.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearestHostile = hostile;
    }
  }

  if (nearestHostile) {
    const dx = nearestHostile.x - player.x;
    const dy = nearestHostile.y - player.y;

    // Move toward hostile
    if (Math.abs(dx) > 10) {
      actions.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
    }
    if (Math.abs(dy) > 10) {
      actions.push(dy > 0 ? KEY_DOWN : KEY_UP);
    }

    // Use shield when close
    if (minDist < 100 && player.energy > 20) {
      actions.push(KEY_Z);
    }
  }

  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getMovementTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCombatTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;