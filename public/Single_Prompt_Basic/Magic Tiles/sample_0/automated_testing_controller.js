import { gameState, LANE_KEYS, LANE_COUNT, TARGET_ZONE_Y, TILE_HEIGHT } from './globals.js';

// Helper function to find the closest tile to the target zone in a specific lane
function findClosestTileInLane(laneIndex) {
  let closestTile = null;
  let closestDistance = Infinity;
  
  for (const tile of gameState.tiles) {
    if (tile.laneIndex === laneIndex && !tile.hit) {
      // Calculate the distance to the perfect hit point in the target zone
      const tileMiddle = tile.y + tile.height/2;
      const targetMiddle = TARGET_ZONE_Y + TILE_HEIGHT/2;
      const distance = Math.abs(tileMiddle - targetMiddle);
      
      // Check if this tile is closer than the previous closest
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTile = tile;
      }
    }
  }
  
  return { tile: closestTile, distance: closestDistance };
}

// TEST_1: Basic game functionality test with sticky keys
function getStickyKeysAction(gameState) {
  // Tracks the last time we changed actions
  const actionChangeInterval = 20; // frames
  
  // Store state between calls using static variables
  if (typeof getStickyKeysAction.lastActionChange === 'undefined') {
    getStickyKeysAction.lastActionChange = 0;
    getStickyKeysAction.currentAction = null;
  }
  
  // Check if we need to change actions
  if (gameState.gamePhase === "PLAYING" && 
      (getStickyKeysAction.currentAction === null || 
       gameState.gameInstance.frameCount - getStickyKeysAction.lastActionChange > actionChangeInterval)) {
    
    // Find any tile that's close to the target zone
    let bestLane = -1;
    let bestDistance = Infinity;
    
    for (let i = 0; i < LANE_COUNT; i++) {
      const { tile, distance } = findClosestTileInLane(i);
      
      if (tile && distance < bestDistance && tile.isInTargetZone()) {
        bestDistance = distance;
        bestLane = i;
      }
    }
    
    // If we found a tile to hit, use that lane's key
    if (bestLane !== -1) {
      getStickyKeysAction.currentAction = LANE_KEYS[bestLane];
    } else {
      // Otherwise, pick a random lane
      const randomLane = Math.floor(Math.random() * LANE_COUNT);
      getStickyKeysAction.currentAction = LANE_KEYS[randomLane];
    }
    
    getStickyKeysAction.lastActionChange = gameState.gameInstance.frameCount;
  }
  
  return getStickyKeysAction.currentAction;
}

// TEST_2: Perfect play to win the game
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Find the lane with the tile closest to the perfect hit point
  let bestLane = -1;
  let bestDistance = Infinity;
  
  for (let i = 0; i < LANE_COUNT; i++) {
    const { tile, distance } = findClosestTileInLane(i);
    
    if (tile && tile.isInTargetZone() && distance < bestDistance) {
      bestDistance = distance;
      bestLane = i;
    }
  }
  
  // Only tap when a tile is in the perfect zone (distance < 20)
  if (bestLane !== -1 && bestDistance < 20) {
    return LANE_KEYS[bestLane];
  }
  
  return null;
}

// TEST_3: Test difficulty progression
function getTestDifficultyProgressionAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track the last observed difficulty level
  if (typeof getTestDifficultyProgressionAction.lastDifficultyLevel === 'undefined') {
    getTestDifficultyProgressionAction.lastDifficultyLevel = gameState.difficultyLevel;
  }
  
  // Log when difficulty changes
  if (gameState.difficultyLevel > getTestDifficultyProgressionAction.lastDifficultyLevel) {
    console.log(`Difficulty increased to level ${gameState.difficultyLevel}`);
    getTestDifficultyProgressionAction.lastDifficultyLevel = gameState.difficultyLevel;
  }
  
  // Use the win strategy to play well
  return getTestWinAction(gameState);
}

// TEST_4: Test combo system
function getTestComboAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Track the highest combo achieved
  if (typeof getTestComboAction.highestCombo === 'undefined') {
    getTestComboAction.highestCombo = 0;
  }
  
  // Log when combo increases
  if (gameState.player.combo > getTestComboAction.highestCombo) {
    console.log(`New highest combo: ${gameState.player.combo}`);
    getTestComboAction.highestCombo = gameState.player.combo;
  }
  
  // Use the win strategy to build combos
  return getTestWinAction(gameState);
}

// TEST_5: Test loss condition
function getTestLossAction(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;
  
  // Play normally until we reach a certain score
  const targetScoreBeforeLoss = 100;
  
  if (gameState.player.score < targetScoreBeforeLoss) {
    return getTestWinAction(gameState);
  } else {
    // Once we reach the target score, deliberately miss tiles
    // by not returning any action
    return null;
  }
}

// Main testing controller function
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDifficultyProgressionAction(gameState);
    case "TEST_4":
      return getTestComboAction(gameState);
    case "TEST_5":
      return getTestLossAction(gameState);
    default:
      return null;
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;