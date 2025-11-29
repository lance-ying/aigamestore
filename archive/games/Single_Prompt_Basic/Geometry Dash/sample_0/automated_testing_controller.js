import { PLAYER_MODES, GROUND_Y, BLOCK_SIZE } from './globals.js';

// Helper function to find the next obstacle or portal in the player's path
function findNextObstacle(gameState, lookAheadDistance = 300) {
  const playerX = gameState.player.x;
  const playerY = gameState.player.y;
  let closestObstacle = null;
  let minDistance = Infinity;
  
  // Check obstacles
  for (const obstacle of gameState.obstacles) {
    // Skip ground
    if (obstacle.type === 'block' && obstacle.y >= GROUND_Y) {
      continue;
    }
    
    // Only consider obstacles ahead of the player and within look-ahead distance
    if (obstacle.x > playerX && obstacle.x - playerX < lookAheadDistance) {
      const distance = obstacle.x - playerX;
      if (distance < minDistance) {
        minDistance = distance;
        closestObstacle = { type: 'obstacle', object: obstacle, distance };
      }
    }
  }
  
  // Check portals
  for (const portal of gameState.portals) {
    if (portal.x > playerX && portal.x - playerX < lookAheadDistance) {
      const distance = portal.x - playerX;
      if (distance < minDistance) {
        minDistance = distance;
        closestObstacle = { type: 'portal', object: portal, distance };
      }
    }
  }
  
  // Check finish line
  const finishDistance = gameState.level.endX - playerX;
  if (finishDistance > 0 && finishDistance < lookAheadDistance && finishDistance < minDistance) {
    closestObstacle = { type: 'finish', distance: finishDistance };
  }
  
  return closestObstacle;
}

// TEST_1: Basic sticky keys test
function getStickyKeysAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Change jump pattern every 60 frames (1 second)
  const jumpPattern = Math.floor(gameState.elapsedTime / 1000) % 3;
  
  // Different jump patterns
  switch (jumpPattern) {
    case 0: // Jump frequently
      return Math.random() < 0.3 ? 32 : null; // 30% chance to jump
    case 1: // Jump occasionally
      return Math.random() < 0.1 ? 32 : null; // 10% chance to jump
    case 2: // Hold jump (for ship mode)
      return Math.random() < 0.7 ? 32 : null; // 70% chance to jump
    default:
      return null;
  }
}

// TEST_2: Win strategy
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  const player = gameState.player;
  const nextObstacle = findNextObstacle(gameState);
  
  // No obstacle ahead, don't jump
  if (!nextObstacle) return null;
  
  // Handle different player modes
  if (player.mode === PLAYER_MODES.CUBE) {
    // For cube mode, jump over obstacles
    if (nextObstacle.type === 'obstacle') {
      const obstacle = nextObstacle.object;
      
      // Jump when close to an obstacle
      if (nextObstacle.distance < 100 && nextObstacle.distance > 20 && player.onGround) {
        return 32; // SPACE to jump
      }
    } 
    // For portals, make sure we're on the ground to enter properly
    else if (nextObstacle.type === 'portal' && nextObstacle.distance < 50) {
      return player.onGround ? null : 32;
    }
  } 
  // For ship mode, navigate through gaps
  else if (player.mode === PLAYER_MODES.SHIP) {
    if (nextObstacle.type === 'obstacle') {
      const obstacle = nextObstacle.object;
      
      // If ceiling obstacle, move down
      if (obstacle.y < GROUND_Y / 2) {
        return player.y > GROUND_Y - BLOCK_SIZE * 3 ? 32 : null;
      } 
      // If floor obstacle, move up
      else {
        return player.y < GROUND_Y - BLOCK_SIZE * 4 ? null : 32;
      }
    }
    // For portals, aim to be at mid-height
    else if (nextObstacle.type === 'portal') {
      const targetY = GROUND_Y - BLOCK_SIZE * 3;
      return player.y > targetY ? 32 : null;
    }
  }
  
  return null;
}

// TEST_3: Mode transition test
function getTestModeTransitionAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  const player = gameState.player;
  const nextObstacle = findNextObstacle(gameState);
  
  // Focus on getting to and through portals
  if (nextObstacle && nextObstacle.type === 'portal') {
    // Navigate to portal height
    const portalY = nextObstacle.object.y + nextObstacle.object.height / 2;
    const targetY = portalY - player.height / 2;
    
    if (player.mode === PLAYER_MODES.CUBE) {
      // Jump to reach portal height if needed
      if (nextObstacle.distance < 100 && player.y > targetY && player.onGround) {
        return 32; // Jump
      }
    } else if (player.mode === PLAYER_MODES.SHIP) {
      // Fly to portal height
      if (player.y > targetY) {
        return 32; // Fly up
      }
    }
  } else {
    // Use win strategy for normal navigation
    return getTestWinAction(gameState);
  }
  
  return null;
}

// TEST_4: Collision test
function getTestCollisionAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  const player = gameState.player;
  const nextObstacle = findNextObstacle(gameState);
  
  // No obstacle ahead, don't jump
  if (!nextObstacle) return null;
  
  // Alternate between avoiding and hitting obstacles
  const shouldCollide = Math.floor(gameState.elapsedTime / 5000) % 2 === 1;
  
  if (shouldCollide && nextObstacle.type === 'obstacle' && nextObstacle.distance < 50) {
    // Don't jump to test collision
    return null;
  } else {
    // Otherwise use winning strategy
    return getTestWinAction(gameState);
  }
}

// TEST_5: Restart test
function getTestRestartAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Play normally for a bit then deliberately crash
  if (gameState.elapsedTime < 3000) {
    return getTestWinAction(gameState);
  } else {
    // After 3 seconds, just drop to test death and restart
    return null;
  }
}

// Main testing controller
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestModeTransitionAction(gameState);
    case "TEST_4":
      return getTestCollisionAction(gameState);
    case "TEST_5":
      return getTestRestartAction(gameState);
    default:
      return null;
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;