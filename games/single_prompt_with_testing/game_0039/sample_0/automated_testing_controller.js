// automated_testing_controller.js - Automated testing strategies
import { 
  KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_UP, KEY_Z,
  PHASE_PLAYING, PHASE_START, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';

// Helper to calculate distance to nearest fragment
function findNearestFragment(gameState) {
  if (!gameState.player || !gameState.currentMemory) return null;
  
  const playerX = gameState.player.x + gameState.player.width / 2;
  const playerY = gameState.player.y + gameState.player.height / 2;
  
  let nearest = null;
  let minDist = Infinity;
  
  gameState.currentMemory.fragments.forEach(fragment => {
    if (!fragment.collected) {
      const dist = Math.sqrt(
        Math.pow(fragment.x - playerX, 2) + 
        Math.pow(fragment.y - playerY, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = fragment;
      }
    }
  });
  
  return { fragment: nearest, distance: minDist };
}

// TEST_1: Basic testing - Move around and collect fragments
function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return [];
  
  const actions = [];
  const nearestInfo = findNearestFragment(gameState);
  
  if (!nearestInfo.fragment) {
    // No fragments left, try to progress
    if (gameState.blinkCooldown === 0) {
      actions.push(KEY_SPACE);
    }
    return actions;
  }
  
  const player = gameState.player;
  const target = nearestInfo.fragment;
  
  // Move towards fragment
  if (target.x < player.x - 5) {
    actions.push(KEY_LEFT);
  } else if (target.x > player.x + player.width + 5) {
    actions.push(KEY_RIGHT);
  }
  
  // Collect if close enough
  if (nearestInfo.distance < 30) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

// TEST_2: Optimal win strategy
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return [];
  
  const actions = [];
  const nearestInfo = findNearestFragment(gameState);
  
  // Use reflection mode when time is running out
  if (gameState.timeRemaining < 60 && gameState.timeRemaining > 30) {
    actions.push(KEY_Z);
  }
  
  if (!nearestInfo.fragment) {
    // All fragments collected in current memory, advance
    if (gameState.blinkCooldown === 0) {
      actions.push(KEY_SPACE);
    }
    return actions;
  }
  
  const player = gameState.player;
  const target = nearestInfo.fragment;
  const dx = target.x - (player.x + player.width / 2);
  
  // Efficient movement towards nearest fragment
  if (Math.abs(dx) > 10) {
    if (dx < 0) {
      actions.push(KEY_LEFT);
    } else {
      actions.push(KEY_RIGHT);
    }
  }
  
  // Collect fragment when in range
  if (nearestInfo.distance < 40 && gameState.blinkCooldown === 0) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

// TEST_3: Time management failure test
function getTimeLoseAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return [];
  
  const actions = [];
  
  // Move slowly and inefficiently
  if (Math.random() > 0.7) {
    if (Math.random() > 0.5) {
      actions.push(KEY_LEFT);
    } else {
      actions.push(KEY_RIGHT);
    }
  }
  
  // Rarely collect fragments
  if (Math.random() > 0.95) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

// TEST_4: Interaction testing
function getInteractionTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return [];
  
  const actions = [];
  
  // Systematically move across the screen
  const player = gameState.player;
  const phase = Math.floor(gameState.score / 3) % 2;
  
  if (phase === 0) {
    actions.push(KEY_RIGHT);
  } else {
    actions.push(KEY_LEFT);
  }
  
  // Try to interact frequently
  if (gameState.blinkCooldown === 0 && Math.random() > 0.7) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

// Random action for fallback
function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return [];
  
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.3) {
    actions.push(KEY_LEFT);
  } else if (rand < 0.6) {
    actions.push(KEY_RIGHT);
  } else if (rand < 0.8) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTimeLoseAction(gameState);
    case "TEST_4":
      return getInteractionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally for testing
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;