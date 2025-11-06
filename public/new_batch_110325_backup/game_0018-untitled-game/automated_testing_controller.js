// automated_testing_controller.js - Automated testing
import { gameState } from './globals.js';

let testState = {
  moveHistory: [],
  stuckCounter: 0,
  targetX: 0,
  targetY: 0,
  actionQueue: [],
  puzzleAttempts: 0
};

function getTestWinAction(gameState) {
  // Strategy: Navigate through levels, solve puzzles correctly, collect all stones
  
  if (gameState.puzzleActive && gameState.mathPuzzle) {
    return solvePuzzleOptimally(gameState);
  }
  
  const player = gameState.player;
  if (!player) return null;
  
  // Find nearest chest
  const nearestChest = findNearestChest(gameState);
  
  if (nearestChest && !nearestChest.opened) {
    return navigateToTarget(player, nearestChest.x + nearestChest.width / 2, nearestChest.y, gameState);
  }
  
  // Find nearest collectible
  const nearestCollectible = findNearestCollectible(gameState);
  if (nearestCollectible) {
    return navigateToTarget(player, nearestCollectible.x, nearestCollectible.y, gameState);
  }
  
  // Default: move right and jump
  return { keys: [39, 38], action: 'explore' };
}

function solvePuzzleOptimally(gameState) {
  const puzzle = gameState.mathPuzzle;
  
  if (!puzzle.answered) {
    // Find correct answer index
    const correctIndex = puzzle.options.findIndex(opt => String(opt) === String(puzzle.correctAnswer));
    
    if (correctIndex !== -1 && puzzle.selectedOption !== correctIndex) {
      // Navigate to correct answer
      return correctIndex > puzzle.selectedOption ? { keys: [39], action: 'select_right' } : { keys: [37], action: 'select_left' };
    }
    
    // Submit answer
    return { keys: [32], action: 'submit_answer' };
  } else if (puzzle.answered && puzzle.correct) {
    // Continue after correct answer
    return { keys: [90], action: 'continue' };
  } else {
    // Retry after incorrect answer
    return { keys: [90], action: 'retry' };
  }
}

function findNearestChest(gameState) {
  if (!gameState.player) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  gameState.chests.forEach(chest => {
    if (!chest.opened) {
      const dist = Math.abs(chest.x - gameState.player.x);
      if (dist < minDist) {
        minDist = dist;
        nearest = chest;
      }
    }
  });
  
  return nearest;
}

function findNearestCollectible(gameState) {
  if (!gameState.player) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  gameState.collectibles.forEach(collectible => {
    if (!collectible.collected) {
      const dist = Math.abs(collectible.x - gameState.player.x);
      if (dist < minDist) {
        minDist = dist;
        nearest = collectible;
      }
    }
  });
  
  return nearest;
}

function navigateToTarget(player, targetX, targetY, gameState) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  const keys = [];
  
  // Horizontal movement
  if (Math.abs(dx) > 30) {
    keys.push(dx > 0 ? 39 : 37); // Right or Left
  } else if (Math.abs(dx) < 40) {
    // Close enough, try to interact
    keys.push(90); // Z key
  }
  
  // Jump if target is above or if stuck
  if (dy < -20 || player.onGround && Math.abs(player.vx) < 0.5) {
    keys.push(38); // Up/Jump
  }
  
  return { keys, action: 'navigate' };
}

function getBasicTestAction(gameState) {
  // Basic movement testing
  const frameCount = gameState.player ? Math.floor(Date.now() / 1000) : 0;
  
  if (gameState.puzzleActive && gameState.mathPuzzle) {
    if (!gameState.mathPuzzle.answered) {
      return { keys: [32], action: 'test_submit' };
    }
    return { keys: [90], action: 'test_continue' };
  }
  
  const pattern = frameCount % 4;
  
  if (pattern === 0) return { keys: [39], action: 'test_right' };
  if (pattern === 1) return { keys: [38], action: 'test_jump' };
  if (pattern === 2) return { keys: [37], action: 'test_left' };
  return { keys: [90], action: 'test_interact' };
}

function getHazardTestAction(gameState) {
  // Intentionally interact with hazards
  const player = gameState.player;
  if (!player) return null;
  
  // Find nearest hazard
  let nearestHazard = null;
  let minDist = Infinity;
  
  gameState.hazards.forEach(hazard => {
    const dist = Math.abs(hazard.x - player.x);
    if (dist < minDist) {
      minDist = dist;
      nearestHazard = hazard;
    }
  });
  
  if (nearestHazard) {
    return navigateToTarget(player, nearestHazard.x + nearestHazard.width / 2, nearestHazard.y, gameState);
  }
  
  return { keys: [39], action: 'explore' };
}

function getPuzzleTestAction(gameState) {
  // Test puzzle solving with various answers
  if (gameState.puzzleActive && gameState.mathPuzzle) {
    const puzzle = gameState.mathPuzzle;
    
    if (!puzzle.answered) {
      // Cycle through options
      if (testState.puzzleAttempts % 2 === 0) {
        return { keys: [39], action: 'cycle_options' };
      }
      return { keys: [32], action: 'submit_test' };
    }
    
    testState.puzzleAttempts++;
    return { keys: [90], action: 'continue_test' };
  }
  
  // Navigate to chest to trigger puzzle
  const nearestChest = findNearestChest(gameState);
  if (nearestChest && gameState.player) {
    return navigateToTarget(gameState.player, nearestChest.x, nearestChest.y, gameState);
  }
  
  return { keys: [39], action: 'explore' };
}

function getProgressionTestAction(gameState) {
  // Test level progression by collecting stones sequentially
  return getTestWinAction(gameState);
}

function getRandomAction(gameState) {
  const actions = [
    { keys: [37], action: 'random_left' },
    { keys: [39], action: 'random_right' },
    { keys: [38], action: 'random_jump' },
    { keys: [90], action: 'random_interact' }
  ];
  
  if (gameState.puzzleActive) {
    return { keys: [32], action: 'random_submit' };
  }
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getPuzzleTestAction(gameState);
    case "TEST_4":
      return getHazardTestAction(gameState);
    case "TEST_5":
      return getProgressionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;