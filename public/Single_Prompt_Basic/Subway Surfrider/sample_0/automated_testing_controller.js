import { 
  getClosestObstacleAhead, 
  isObstacleTypeAhead, 
  isSaferLane,
  getClosestCoinAhead
} from './physics.js';

import { LANE_POSITIONS, WIN_SCORE } from './globals.js';

// Sticky keys action for basic testing
function getStickyKeysAction(gameState) {
  const { player, obstacles, frameCount } = gameState;
  
  if (!player) return null;
  
  // Change action every 60 frames (about 1 second)
  const actionSeed = Math.floor(frameCount / 60) % 5;
  
  // Basic actions to test different inputs
  switch (actionSeed) {
    case 0:
      return 37; // LEFT
    case 1:
      return 39; // RIGHT
    case 2:
      return 38; // UP (jump)
    case 3:
      return 40; // DOWN (slide)
    case 4:
      return null; // No action
  }
  
  return null;
}

// Win test action - tries to reach the winning score
function getTestWinAction(gameState) {
  const { player, obstacles, coins, frameCount } = gameState;
  
  if (!player || player.movingToLane) return null;
  
  // Get closest obstacle and coin
  const { obstacle: closestObstacle, distance: obstacleDistance } = getClosestObstacleAhead(player, obstacles);
  const { coin: closestCoin, distance: coinDistance } = getClosestCoinAhead(player, coins);
  
  // Reaction distance - how far ahead we look for obstacles
  const reactionDistance = 200;
  
  // If there's a close obstacle in our lane
  if (closestObstacle && obstacleDistance < reactionDistance) {
    // Jump over barriers
    if (closestObstacle.type === 'barrier' && obstacleDistance < 100) {
      return 38; // UP
    }
    
    // Slide under tunnels
    if (closestObstacle.type === 'tunnel' && obstacleDistance < 100) {
      return 40; // DOWN
    }
    
    // For trains, we need to change lanes
    if (closestObstacle.type === 'train') {
      // Check which lane is safer to move to
      if (player.laneIndex === 0) {
        return 39; // RIGHT (only option from leftmost lane)
      } else if (player.laneIndex === 2) {
        return 37; // LEFT (only option from rightmost lane)
      } else {
        // From middle lane, choose the safer side
        return isSaferLane(player, obstacles, 0, reactionDistance) ? 37 : 39;
      }
    }
  }
  
  // If there's a coin we can get
  if (closestCoin && coinDistance < 150) {
    const coinLaneIndex = LANE_POSITIONS.indexOf(closestCoin.x);
    
    // Move to the coin's lane if different
    if (coinLaneIndex !== player.laneIndex) {
      return coinLaneIndex < player.laneIndex ? 37 : 39; // LEFT or RIGHT
    }
  }
  
  // If no immediate threats or coins, stay in the middle lane for better positioning
  if (player.laneIndex !== 1 && frameCount % 120 === 0) {
    return player.laneIndex < 1 ? 39 : 37; // Move toward center
  }
  
  return null;
}

// Test for difficulty progression
function getTestDifficultyAction(gameState) {
  const { player, obstacles, speed, frameCount } = gameState;
  
  if (!player) return null;
  
  // Focus on survival to test difficulty progression
  const { obstacle: closestObstacle, distance: obstacleDistance } = getClosestObstacleAhead(player, obstacles);
  
  // React to obstacles
  if (closestObstacle && obstacleDistance < 150) {
    if (closestObstacle.type === 'barrier') {
      return 38; // Jump
    } else if (closestObstacle.type === 'tunnel') {
      return 40; // Slide
    } else if (closestObstacle.type === 'train') {
      // Change lanes based on current position
      if (player.laneIndex === 0) {
        return 39; // Move right
      } else if (player.laneIndex === 2) {
        return 37; // Move left
      } else {
        // From middle lane, check obstacle patterns to decide
        const leftSafer = isSaferLane(player, obstacles, 0, 200);
        const rightSafer = isSaferLane(player, obstacles, 2, 200);
        
        if (leftSafer && !rightSafer) return 37;
        if (rightSafer && !leftSafer) return 39;
        return Math.random() < 0.5 ? 37 : 39; // Random if both equal
      }
    }
  }
  
  // Occasionally return to middle lane for better positioning
  if (frameCount % 180 === 0 && player.laneIndex !== 1) {
    return player.laneIndex < 1 ? 39 : 37;
  }
  
  return null;
}

// Test for collision accuracy
function getTestCollisionAction(gameState) {
  const { player, obstacles, frameCount } = gameState;
  
  if (!player) return null;
  
  // Test edge cases for collision detection
  const { obstacle: closestObstacle, distance: obstacleDistance } = getClosestObstacleAhead(player, obstacles);
  
  // If we have a close obstacle, test collision boundaries
  if (closestObstacle && obstacleDistance < 120) {
    // For barriers, test jumping at different distances
    if (closestObstacle.type === 'barrier') {
      if (obstacleDistance < 80 && obstacleDistance > 40) {
        return 38; // Jump
      }
    }
    // For tunnels, test sliding at different distances
    else if (closestObstacle.type === 'tunnel') {
      if (obstacleDistance < 70 && obstacleDistance > 30) {
        return 40; // Slide
      }
    }
    // For trains, test lane changes at the edge
    else if (closestObstacle.type === 'train' && obstacleDistance < 100) {
      return player.laneIndex < 2 ? 39 : 37;
    }
  }
  
  // Occasionally change lanes to encounter different obstacles
  if (frameCount % 120 === 0) {
    return (frameCount % 360 < 180) ? 37 : 39;
  }
  
  return null;
}

// Test for game restart functionality
function getTestRestartAction(gameState) {
  const { player, obstacles, frameCount } = gameState;
  
  if (!player) return null;
  
  // Deliberately crash into an obstacle to test game over state
  const { obstacle: closestObstacle, distance: obstacleDistance } = getClosestObstacleAhead(player, obstacles);
  
  // If there's a train ahead, stay in the lane to crash
  if (closestObstacle && closestObstacle.type === 'train' && obstacleDistance < 150) {
    return null; // Do nothing, let the crash happen
  }
  
  // Otherwise, basic navigation
  if (frameCount % 180 < 60) {
    return 37; // Move left
  } else if (frameCount % 180 < 120) {
    return 39; // Move right
  } else if (isObstacleTypeAhead(player, obstacles, 'barrier', 100)) {
    return 38; // Jump
  } else if (isObstacleTypeAhead(player, obstacles, 'tunnel', 100)) {
    return 40; // Slide
  }
  
  return null;
}

// Main testing controller
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDifficultyAction(gameState);
    case "TEST_4":
      return getTestCollisionAction(gameState);
    case "TEST_5":
      return getTestRestartAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;