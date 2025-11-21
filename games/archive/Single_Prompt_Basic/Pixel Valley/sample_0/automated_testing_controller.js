import { TOOLS, TILE_TYPES, CROP_STAGES } from './globals.js';

// Helper function to find nearest tillable tile
function findNearestTillableTile(gameState) {
  const playerTile = gameState.player.getCurrentTile();
  let nearestTile = null;
  let minDistance = Infinity;
  
  for (const tile of gameState.tiles) {
    if (tile.type === TILE_TYPES.GRASS) {
      const distance = Math.abs(tile.x - playerTile.x) + Math.abs(tile.y - playerTile.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTile = tile;
      }
    }
  }
  
  return nearestTile;
}

// Helper function to find nearest tilled tile to plant
function findNearestTilledTile(gameState) {
  const playerTile = gameState.player.getCurrentTile();
  let nearestTile = null;
  let minDistance = Infinity;
  
  for (const tile of gameState.tiles) {
    if (tile.type === TILE_TYPES.TILLED && !tile.crop) {
      const distance = Math.abs(tile.x - playerTile.x) + Math.abs(tile.y - playerTile.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTile = tile;
      }
    }
  }
  
  return nearestTile;
}

// Helper function to find nearest planted tile to water
function findNearestPlantedTile(gameState) {
  const playerTile = gameState.player.getCurrentTile();
  let nearestTile = null;
  let minDistance = Infinity;
  
  for (const tile of gameState.tiles) {
    if (tile.type === TILE_TYPES.PLANTED && tile.crop && !tile.crop.watered) {
      const distance = Math.abs(tile.x - playerTile.x) + Math.abs(tile.y - playerTile.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTile = tile;
      }
    }
  }
  
  return nearestTile;
}

// Helper function to find nearest harvestable crop
function findNearestHarvestableCrop(gameState) {
  const playerTile = gameState.player.getCurrentTile();
  let nearestTile = null;
  let minDistance = Infinity;
  
  for (const tile of gameState.tiles) {
    if (tile.crop && tile.crop.stage === CROP_STAGES.READY) {
      const distance = Math.abs(tile.x - playerTile.x) + Math.abs(tile.y - playerTile.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTile = tile;
      }
    }
  }
  
  return nearestTile;
}

// Helper function to find bed
function findBed(gameState) {
  return gameState.bed;
}

// Helper function to move towards target
function moveTowards(gameState, targetX, targetY) {
  const playerTile = gameState.player.getCurrentTile();
  
  if (playerTile.x < targetX) return 39; // RIGHT
  if (playerTile.x > targetX) return 37; // LEFT
  if (playerTile.y < targetY) return 40; // DOWN
  if (playerTile.y > targetY) return 38; // UP
  
  return null; // Already at target
}

// Sticky keys implementation for basic testing
function getStickyKeysAction(gameState) {
  // Use a deterministic pattern based on frameCount
  const frameCount = gameState.frameCount || 0;
  const pattern = Math.floor(frameCount / 60) % 10;
  
  switch (pattern) {
    case 0: return 37; // LEFT
    case 1: return 38; // UP
    case 2: return 39; // RIGHT
    case 3: return 40; // DOWN
    case 4: return 90; // Z (interact)
    case 5: return 32; // SPACE (switch tool)
    case 6: return 39; // RIGHT
    case 7: return 40; // DOWN
    case 8: return 90; // Z (interact)
    case 9: return null; // No action
    default: return null;
  }
}

// Implement a winning strategy
function getTestWinAction(gameState) {
  // If energy is low, go to bed
  if (gameState.energy < 15) {
    const bed = findBed(gameState);
    
    // If near bed, interact to sleep
    if (isNearBed(gameState)) {
      return 90; // Z to interact
    }
    
    // Move towards bed
    return moveTowards(gameState, bed.x, bed.y);
  }
  
  // Check if any crops need harvesting
  const harvestable = findNearestHarvestableCrop(gameState);
  if (harvestable) {
    // If we're at the harvestable crop, harvest it
    if (isAtTile(gameState, harvestable)) {
      // Make sure we're not using a tool
      if (gameState.currentTool !== 0) {
        return 32; // SPACE to switch tool
      }
      return 90; // Z to interact/harvest
    }
    
    // Move towards harvestable crop
    return moveTowards(gameState, harvestable.x, harvestable.y);
  }
  
  // Check if any crops need watering
  const needsWatering = findNearestPlantedTile(gameState);
  if (needsWatering) {
    // If we're at the tile that needs watering, water it
    if (isAtTile(gameState, needsWatering)) {
      // Switch to watering can if needed
      if (gameState.currentTool !== TOOLS.WATERING_CAN) {
        return 32; // SPACE to switch tool
      }
      return 90; // Z to interact/water
    }
    
    // Move towards tile that needs watering
    return moveTowards(gameState, needsWatering.x, needsWatering.y);
  }
  
  // Check if we have tilled tiles to plant
  if (gameState.gold >= gameState.seedPrice) {
    const tillable = findNearestTilledTile(gameState);
    if (tillable) {
      // If we're at the tilled tile, plant seeds
      if (isAtTile(gameState, tillable)) {
        // Switch to seeds if needed
        if (gameState.currentTool !== TOOLS.SEEDS) {
          return 32; // SPACE to switch tool
        }
        return 90; // Z to interact/plant
      }
      
      // Move towards tilled tile
      return moveTowards(gameState, tillable.x, tillable.y);
    }
  }
  
  // Till more land
  const tillable = findNearestTillableTile(gameState);
  if (tillable) {
    // If we're at the tillable tile, till it
    if (isAtTile(gameState, tillable)) {
      // Switch to hoe if needed
      if (gameState.currentTool !== TOOLS.HOE) {
        return 32; // SPACE to switch tool
      }
      return 90; // Z to interact/till
    }
    
    // Move towards tillable tile
    return moveTowards(gameState, tillable.x, tillable.y);
  }
  
  // If nothing else to do, move randomly
  return getStickyKeysAction(gameState);
}

// Test energy management
function getTestEnergyAction(gameState) {
  // If energy is almost depleted, go to bed
  if (gameState.energy < 10) {
    const bed = findBed(gameState);
    
    // If near bed, interact to sleep
    if (isNearBed(gameState)) {
      return 90; // Z to interact
    }
    
    // Move towards bed
    return moveTowards(gameState, bed.x, bed.y);
  }
  
  // Otherwise, keep tilling to deplete energy
  const tillable = findNearestTillableTile(gameState);
  if (tillable) {
    // If we're at the tillable tile, till it
    if (isAtTile(gameState, tillable)) {
      // Switch to hoe if needed
      if (gameState.currentTool !== TOOLS.HOE) {
        return 32; // SPACE to switch tool
      }
      return 90; // Z to interact/till
    }
    
    // Move towards tillable tile
    return moveTowards(gameState, tillable.x, tillable.y);
  }
  
  // If no tillable tiles, move randomly
  return getStickyKeysAction(gameState);
}

// Test crop growth cycle
function getTestCropGrowthAction(gameState) {
  // If energy is low, go to bed
  if (gameState.energy < 15) {
    const bed = findBed(gameState);
    
    // If near bed, interact to sleep
    if (isNearBed(gameState)) {
      return 90; // Z to interact
    }
    
    // Move towards bed
    return moveTowards(gameState, bed.x, bed.y);
  }
  
  // Check if any crops need watering
  const needsWatering = findNearestPlantedTile(gameState);
  if (needsWatering) {
    // If we're at the tile that needs watering, water it
    if (isAtTile(gameState, needsWatering)) {
      // Switch to watering can if needed
      if (gameState.currentTool !== TOOLS.WATERING_CAN) {
        return 32; // SPACE to switch tool
      }
      return 90; // Z to interact/water
    }
    
    // Move towards tile that needs watering
    return moveTowards(gameState, needsWatering.x, needsWatering.y);
  }
  
  // Check if we have tilled tiles to plant
  if (gameState.gold >= gameState.seedPrice) {
    const tillable = findNearestTilledTile(gameState);
    if (tillable) {
      // If we're at the tilled tile, plant seeds
      if (isAtTile(gameState, tillable)) {
        // Switch to seeds if needed
        if (gameState.currentTool !== TOOLS.SEEDS) {
          return 32; // SPACE to switch tool
        }
        return 90; // Z to interact/plant
      }
      
      // Move towards tilled tile
      return moveTowards(gameState, tillable.x, tillable.y);
    }
  }
  
  // Till more land
  const tillable = findNearestTillableTile(gameState);
  if (tillable) {
    // If we're at the tillable tile, till it
    if (isAtTile(gameState, tillable)) {
      // Switch to hoe if needed
      if (gameState.currentTool !== TOOLS.HOE) {
        return 32; // SPACE to switch tool
      }
      return 90; // Z to interact/till
    }
    
    // Move towards tillable tile
    return moveTowards(gameState, tillable.x, tillable.y);
  }
  
  // If nothing else to do, move randomly
  return getStickyKeysAction(gameState);
}

// Test tool switching
function getTestToolSwitchingAction(gameState) {
  // Switch tools every 60 frames
  if (gameState.frameCount % 60 === 0) {
    return 32; // SPACE to switch tool
  }
  
  // Move around randomly
  return getStickyKeysAction(gameState);
}

// Helper functions
function isAtTile(gameState, tile) {
  const playerTile = gameState.player.getCurrentTile();
  return playerTile.x === tile.x && playerTile.y === tile.y;
}

function isNearBed(gameState) {
  const playerTile = gameState.player.getCurrentTile();
  const bed = gameState.bed;
  
  return (playerTile.x === bed.x || playerTile.x === bed.x + 1) && playerTile.y === bed.y;
}

export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestEnergyAction(gameState);
    case "TEST_4":
      return getTestCropGrowthAction(gameState);
    case "TEST_5":
      return getTestToolSwitchingAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;