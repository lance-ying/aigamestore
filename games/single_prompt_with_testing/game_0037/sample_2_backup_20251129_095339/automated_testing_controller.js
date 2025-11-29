// automated_testing_controller.js - AI controller for automated testing

import { gameState, LEVEL_WIDTH, GOAL_POST_X } from './globals.js';

// TEST_1: Basic movement and collision testing
function getTest1Action(gs) {
  if (!gs.player) return null;
  
  // Move right continuously, jump periodically
  if (gs.frameCount % 30 === 0) {
    return { keyCode: 32 }; // Jump (Space)
  }
  
  return { keyCode: 39 }; // Move right
}

// TEST_2: Complete level with optimal pathfinding
function getTest2Action(gs) {
  if (!gs.player) return null;
  
  // Always try to move toward goal
  const distanceToGoal = LEVEL_WIDTH - 100 - gs.player.x;
  
  // If far from goal, prioritize moving right
  if (distanceToGoal > 50) {
    // Jump over obstacles and enemies
    const needsJump = checkObstacleAhead(gs);
    
    if (needsJump) {
      return { keyCode: 32 }; // Jump
    }
    
    // Use spin dash on flat ground for speed
    if (gs.player.onGround && Math.abs(gs.player.vx) < 5) {
      if (gs.frameCount % 60 < 20) {
        return { keyCode: 40 }; // Charge spin dash
      }
    }
    
    return { keyCode: 39 }; // Move right
  } else {
    // Close to goal, move carefully
    return { keyCode: 39 }; // Move right
  }
}

// Helper: Check if there's an obstacle ahead
function checkObstacleAhead(gs) {
  if (!gs.player) return false;
  
  const lookAheadDistance = 80;
  const playerAheadX = gs.player.x + lookAheadDistance;
  
  // Check for enemies
  for (const enemy of gs.enemies) {
    if (Math.abs(enemy.x - playerAheadX) < 50 && enemy.y > gs.player.y - 50) {
      return true;
    }
  }
  
  // Check for gaps (no platform beneath)
  const hasGroundAhead = gs.platforms.some(platform => {
    return (
      playerAheadX >= platform.x &&
      playerAheadX <= platform.x + platform.width &&
      platform.y > gs.player.y
    );
  });
  
  if (!hasGroundAhead) {
    return true;
  }
  
  return false;
}

// TEST_3: Ring collection and damage testing
function getTest3Action(gs) {
  if (!gs.player) return null;
  
  // Phase 1: Collect rings (first 200 frames)
  if (gs.frameCount < 200) {
    const nearestRing = findNearestRing(gs);
    if (nearestRing) {
      return moveToward(gs.player, nearestRing.x, nearestRing.y);
    }
    return { keyCode: 39 }; // Default: move right
  }
  
  // Phase 2: Test damage with rings (200-400 frames)
  if (gs.frameCount < 400) {
    const nearestEnemy = findNearestEnemy(gs);
    if (nearestEnemy) {
      return moveToward(gs.player, nearestEnemy.x, nearestEnemy.y);
    }
  }
  
  // Phase 3: Test damage without rings
  if (gs.ringCount === 0) {
    const nearestEnemy = findNearestEnemy(gs);
    if (nearestEnemy) {
      return moveToward(gs.player, nearestEnemy.x, nearestEnemy.y);
    }
  }
  
  return { keyCode: 39 }; // Move right
}

// TEST_4: Spin dash and speed mechanics
function getTest4Action(gs) {
  if (!gs.player) return null;
  
  // Alternate between charging spin dash and releasing
  if (gs.player.onGround) {
    if (gs.frameCount % 80 < 40) {
      return { keyCode: 40 }; // Charge spin dash
    } else {
      return { keyCode: 39 }; // Release and move right
    }
  }
  
  return { keyCode: 39 }; // Move right in air
}

// TEST_5: Special stage access
function getTest5Action(gs) {
  if (!gs.player) return null;
  
  // Focus on collecting rings until 50
  if (gs.ringCount < 50) {
    const nearestRing = findNearestRing(gs);
    if (nearestRing) {
      return moveToward(gs.player, nearestRing.x, nearestRing.y);
    }
    return { keyCode: 39 }; // Move right
  }
  
  // Look for giant ring
  if (gs.giantRings.length > 0) {
    const giantRing = gs.giantRings[0];
    return moveToward(gs.player, giantRing.x, giantRing.y);
  }
  
  // In special stage, move to collect rings
  if (gs.specialStageActive) {
    // Just move right to let rings come to us
    return { keyCode: 39 };
  }
  
  return { keyCode: 39 };
}

// TEST_6: Spring and loop testing
function getTest6Action(gs) {
  if (!gs.player) return null;
  
  // Move right to encounter springs and loops
  // Jump onto springs
  const nearestSpring = findNearestSpring(gs);
  if (nearestSpring && Math.abs(nearestSpring.x - gs.player.x) < 100) {
    if (gs.player.y > nearestSpring.y) {
      return { keyCode: 39 }; // Move toward spring
    }
  }
  
  return { keyCode: 39 }; // Keep moving right
}

// TEST_7: Performance test
function getTest7Action(gs) {
  if (!gs.player) return null;
  
  // Trigger many game events simultaneously
  const actions = [
    { keyCode: 39 }, // Move right
    { keyCode: 32 }, // Jump
    { keyCode: 40 }, // Spin dash
  ];
  
  // Cycle through actions rapidly
  const actionIndex = Math.floor(gs.frameCount / 5) % actions.length;
  return actions[actionIndex];
}

// Helper functions
function findNearestRing(gs) {
  if (!gs.player || gs.rings.length === 0) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  for (const ring of gs.rings) {
    const dx = ring.x - gs.player.x;
    const dy = ring.y - gs.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = ring;
    }
  }
  
  return nearest;
}

function findNearestEnemy(gs) {
  if (!gs.player || gs.enemies.length === 0) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  for (const enemy of gs.enemies) {
    const dx = enemy.x - gs.player.x;
    const dy = enemy.y - gs.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function findNearestSpring(gs) {
  if (!gs.player || gs.springs.length === 0) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  for (const spring of gs.springs) {
    const dx = spring.x - gs.player.x;
    const dy = spring.y - gs.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist && dx > 0) { // Only springs ahead
      minDist = dist;
      nearest = spring;
    }
  }
  
  return nearest;
}

function moveToward(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  // Jump if target is above
  if (dy < -30 && player.onGround) {
    return { keyCode: 32 }; // Jump
  }
  
  // Move left or right
  if (Math.abs(dx) > 10) {
    return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
  }
  
  return null;
}

// Main automated testing function
export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    case "TEST_3":
      return getTest3Action(gameState);
    case "TEST_4":
      return getTest4Action(gameState);
    case "TEST_5":
      return getTest5Action(gameState);
    case "TEST_6":
      return getTest6Action(gameState);
    case "TEST_7":
      return getTest7Action(gameState);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;