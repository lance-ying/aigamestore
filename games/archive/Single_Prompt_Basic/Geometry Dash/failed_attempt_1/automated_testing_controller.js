import { KEYS } from './input.js';
import { CANVAS_HEIGHT, GROUND_HEIGHT, PLAYER_SIZE } from './globals.js';

// Helper function to determine if player should jump based on upcoming obstacles
function shouldJump(gameState, lookAheadDistance = 200) {
  const player = gameState.player;
  if (!player) return false;
  
  // If player is already jumping, don't jump again
  if (player.isJumping) return false;
  
  // Check for obstacles ahead
  for (const obstacle of gameState.obstacles) {
    // Calculate distance to obstacle
    const distanceToObstacle = obstacle.x - (player.x + player.width);
    
    // Only consider obstacles within look-ahead distance and ahead of the player
    if (distanceToObstacle > 0 && distanceToObstacle < lookAheadDistance) {
      // Different logic based on obstacle type
      if (obstacle.type === 'spike' || obstacle.type === 'block') {
        // Jump when close enough to the obstacle
        if (distanceToObstacle < 120 && distanceToObstacle > 20) {
          return true;
        }
      } else if (obstacle.type === 'pit') {
        // Jump when very close to a pit
        if (distanceToObstacle < 60 && distanceToObstacle > 10) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Helper function to determine if player should jump to collect stars
function shouldJumpForStar(gameState, lookAheadDistance = 150) {
  const player = gameState.player;
  if (!player) return false;
  
  // If player is already jumping high, don't jump again
  if (player.isJumping && player.velocityY < -5) return false;
  
  // Check for stars ahead
  for (const star of gameState.stars) {
    if (star.collected) continue;
    
    // Calculate distance to star
    const distanceToStar = star.x - (player.x + player.width);
    
    // Only consider stars within look-ahead distance and ahead of the player
    if (distanceToStar > 0 && distanceToStar < lookAheadDistance) {
      // If star is above player's height, jump to collect it
      if (star.y < CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE * 1.5) {
        if (distanceToStar < 100 && distanceToStar > 20) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// TEST_1: Basic sticky keys testing
function getStickyKeysAction(gameState) {
  // Simple random jumping strategy
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Jump with 5% probability each frame
  if (Math.random() < 0.05 && !gameState.player.isJumping) {
    return KEYS.SPACE;
  }
  
  return null;
}

// TEST_2: Optimal strategy to win the game
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Look ahead for obstacles and jump when needed
  if (shouldJump(gameState, 200)) {
    return KEYS.SPACE;
  }
  
  return null;
}

// TEST_3: Star collection strategy
function getStarCollectionAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // First priority: avoid obstacles
  if (shouldJump(gameState, 150)) {
    return KEYS.SPACE;
  }
  
  // Second priority: collect stars
  if (shouldJumpForStar(gameState)) {
    return KEYS.SPACE;
  }
  
  return null;
}

// TEST_4: Deliberately hit different obstacles
function getObstacleCollisionAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Get the next obstacle
  const nextObstacle = gameState.obstacles.find(o => 
    o.x > gameState.player.x && o.x < gameState.player.x + 300);
  
  if (!nextObstacle) return null;
  
  // If next obstacle is a spike or block, don't jump when close
  if ((nextObstacle.type === 'spike' || nextObstacle.type === 'block') && 
      nextObstacle.x - gameState.player.x < 100) {
    return null;
  }
  
  // If next obstacle is a pit, don't jump when close
  if (nextObstacle.type === 'pit' && 
      nextObstacle.x - gameState.player.x < 60) {
    return null;
  }
  
  // Otherwise, jump randomly to navigate until we get to the target obstacle
  if (Math.random() < 0.05 && !gameState.player.isJumping) {
    return KEYS.SPACE;
  }
  
  return null;
}

// TEST_5: Continuous jumping test
function getContinuousJumpAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Jump as soon as we touch the ground
  if (!gameState.player.isJumping) {
    return KEYS.SPACE;
  }
  
  return null;
}

export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getStarCollectionAction(gameState);
    case "TEST_4":
      return getObstacleCollisionAction(gameState);
    case "TEST_5":
      return getContinuousJumpAction(gameState);
    default:
      return null;
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;