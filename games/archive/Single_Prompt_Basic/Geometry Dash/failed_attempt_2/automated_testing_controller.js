import { KEYS } from './globals.js';

// TEST 1: Basic functionality testing with sticky keys
function getStickyKeysAction(gameState) {
  // Ensure the game is in PLAYING state
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Initialize sticky key variables if not already set
  if (!gameState.inputBuffer) {
    gameState.inputBuffer = [];
  }
  
  // Find upcoming obstacles to make jumping decisions
  const upcomingObstacles = gameState.entities.filter(e => 
    (e.type === 'spike' || e.type === 'platform') && 
    e.x > gameState.player.x && 
    e.x < gameState.player.x + 300
  );
  
  // Random action changing
  if (Math.random() < 0.05 || gameState.inputBuffer.length === 0) {
    // 70% chance to jump when there are obstacles ahead
    if (upcomingObstacles.length > 0 && Math.random() < 0.7) {
      gameState.inputBuffer.push(KEYS.SPACE);
    } else if (Math.random() < 0.3) {
      // Sometimes jump randomly
      gameState.inputBuffer.push(KEYS.SPACE);
    } else {
      // Do nothing (don't jump)
      gameState.inputBuffer.push(null);
    }
  }
  
  // Return the current action
  return gameState.inputBuffer[0];
}

// TEST 2: Win the game with optimal jumping strategy
function getTestWinAction(gameState) {
  // Ensure the game is in PLAYING state
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Find all obstacles ahead of the player
  const upcomingObstacles = gameState.entities.filter(e => 
    e.x > gameState.player.x - 10 && 
    e.x < gameState.player.x + 300
  );
  
  // Sort obstacles by distance
  upcomingObstacles.sort((a, b) => a.x - b.x);
  
  // Jump logic for different obstacles
  for (const obstacle of upcomingObstacles) {
    const distance = obstacle.x - gameState.player.x;
    
    if (obstacle.type === 'spike') {
      // Jump over spikes when they're at the optimal distance
      if (distance < 80 && distance > 20 && gameState.player.isGrounded) {
        return KEYS.SPACE;
      }
    } 
    else if (obstacle.type === 'platform') {
      // Jump onto platforms when close enough
      if (distance < 70 && distance > 30 && 
          gameState.player.isGrounded && 
          obstacle.y < gameState.player.y) {
        return KEYS.SPACE;
      }
      
      // Jump at the end of platforms to continue momentum
      if (obstacle.x + obstacle.width/2 - gameState.player.x < 30 && 
          obstacle.x + obstacle.width/2 - gameState.player.x > 0 && 
          Math.abs(gameState.player.y - (obstacle.y - obstacle.height/2)) < 5) {
        return KEYS.SPACE;
      }
    }
    else if (obstacle.type === 'finish') {
      // When near finish line, make sure we're grounded to cross it safely
      if (distance < 100 && !gameState.player.isGrounded) {
        return null; // Don't jump
      }
    }
    
    // Only process the closest few obstacles
    if (upcomingObstacles.indexOf(obstacle) >= 3) break;
  }
  
  return null; // No jump needed
}

// TEST 3: Test difficulty progression
function getTestDifficultyAction(gameState) {
  // Ensure the game is in PLAYING state
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Adjust timing based on game speed
  const jumpTimingOffset = Math.min(30, gameState.scrollSpeed * 3);
  
  // Find all obstacles ahead of the player
  const upcomingObstacles = gameState.entities.filter(e => 
    (e.type === 'spike' || e.type === 'platform') && 
    e.x > gameState.player.x - 10 && 
    e.x < gameState.player.x + 250
  );
  
  // Sort obstacles by distance
  upcomingObstacles.sort((a, b) => a.x - b.x);
  
  if (upcomingObstacles.length > 0) {
    const firstObstacle = upcomingObstacles[0];
    const distance = firstObstacle.x - gameState.player.x;
    
    // Adjust timing based on current scroll speed
    if (distance < (70 - jumpTimingOffset) && distance > (30 - jumpTimingOffset/2) && gameState.player.isGrounded) {
      return KEYS.SPACE;
    }
  }
  
  return null;
}

// TEST 4: Test collision accuracy
function getTestCollisionAction(gameState) {
  // Ensure the game is in PLAYING state
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Find all obstacles ahead of the player
  const upcomingObstacles = gameState.entities.filter(e => 
    e.type === 'spike' && 
    e.x > gameState.player.x - 10 && 
    e.x < gameState.player.x + 200
  );
  
  // Sort obstacles by distance
  upcomingObstacles.sort((a, b) => a.x - b.x);
  
  if (upcomingObstacles.length > 0) {
    const obstacle = upcomingObstacles[0];
    const distance = obstacle.x - gameState.player.x;
    
    // Jump as late as possible to test collision boundaries
    if (distance < 60 && distance > 40 && gameState.player.isGrounded) {
      return KEYS.SPACE;
    }
  }
  
  return null;
}

// TEST 5: Test checkpoint system
function getTestCheckpointAction(gameState) {
  // Ensure the game is in PLAYING state
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Find all obstacles and checkpoints ahead of the player
  const upcomingEntities = gameState.entities.filter(e => 
    e.x > gameState.player.x - 10 && 
    e.x < gameState.player.x + 300
  );
  
  // Sort by distance
  upcomingEntities.sort((a, b) => a.x - b.x);
  
  // Checkpoint testing logic
  for (const entity of upcomingEntities) {
    const distance = entity.x - gameState.player.x;
    
    if (entity.type === 'checkpoint') {
      // Always try to reach checkpoints
      if (distance < 100 && gameState.player.isGrounded) {
        return KEYS.SPACE;
      }
    } 
    else if (entity.type === 'spike') {
      // After reaching a checkpoint, intentionally die on the next spike
      // to test checkpoint respawn
      if (gameState.currentCheckpoint > 0 && 
          gameState.currentCheckpoint > gameState.lastTestedCheckpoint) {
        // Store the last tested checkpoint
        gameState.lastTestedCheckpoint = gameState.currentCheckpoint;
        // Don't jump to test death and respawn
        return null;
      }
      
      // Otherwise jump normally
      if (distance < 70 && distance > 30 && gameState.player.isGrounded) {
        return KEYS.SPACE;
      }
    }
    
    // Only process the closest few entities
    if (upcomingEntities.indexOf(entity) >= 3) break;
  }
  
  return null;
}

// Main testing controller function
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
      return getTestCheckpointAction(gameState);
    default:
      return null;
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;