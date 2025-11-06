import { gameState, GAME_PHASES } from './globals.js';

// Test 1: Basic game functionality using sticky keys
function getStickyKeysAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Track if player is stuck
  const currentPos = { x: gameState.player.x, y: gameState.player.y };
  if (Math.abs(currentPos.x - gameState.lastPosition.x) < 1 && 
      Math.abs(currentPos.y - gameState.lastPosition.y) < 1) {
    gameState.stuckCounter++;
  } else {
    gameState.stuckCounter = 0;
  }
  gameState.lastPosition = { ...currentPos };
  
  // If stuck for too long, randomize actions
  if (gameState.stuckCounter > 60) {
    return [37, 38, 39, 40, 32, 90][Math.floor(Math.random() * 6)];
  }
  
  // Change action every 30 frames
  const actionSeed = Math.floor(gameState.time / 30) % 10;
  
  switch (actionSeed) {
    case 0: return 37; // Left
    case 1: return 39; // Right
    case 2: return 38; // Jump
    case 3: return 90; // Z (mine/attack)
    case 4: return 32; // Space (place)
    case 5: return 16; // Shift (switch item)
    case 6: return 39; // Right
    case 7: return 38; // Jump
    case 8: return 90; // Z (mine/attack)
    case 9: return 39; // Right
    default: return 39; // Right
  }
}

// Test 2: Win the game by crafting a portal
function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Check if we have a portal already
  for (const item of gameState.inventory) {
    if (item.type === 15) { // PORTAL
      // Place the portal
      return 32; // Space
    }
  }
  
  // Check if we're near a crafting table
  if (!gameState.nearCraftingTable) {
    // First priority: Place crafting table if we have one
    let hasCraftingTable = false;
    for (const item of gameState.inventory) {
      if (item.type === 14) { // CRAFTING_TABLE
        hasCraftingTable = true;
        // Switch to crafting table
        for (let i = 0; i < gameState.inventory.length; i++) {
          if (gameState.inventory[i].type === 14 && gameState.selectedItemIndex !== i) {
            return 16; // Shift to cycle
          }
        }
        // Place it
        return 32; // Space
      }
    }
    
    // Second priority: Mine resources
    // Check if player is on the ground
    if (gameState.player.isGrounded) {
      // Alternate between mining and moving
      if (gameState.time % 30 < 15) {
        return 90; // Z (mine)
      } else {
        return Math.random() < 0.7 ? 39 : 37; // Right or Left
      }
    } else {
      // Jump if stuck
      if (gameState.stuckCounter > 20) {
        return 38; // Jump
      }
      // Otherwise keep moving
      return Math.random() < 0.7 ? 39 : 37;
    }
  } else {
    // We're near a crafting table, try to craft the portal
    // First, mine more resources if needed
    if (gameState.time % 30 < 15) {
      return 90; // Z (mine)
    } else {
      return Math.random() < 0.7 ? 39 : 37; // Right or Left
    }
  }
}

// Test 3: Combat mechanics
function getTestCombatAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Check if it's night (when enemies spawn)
  const isNight = gameState.time % 1800 >= 900;
  
  // Check for nearby enemies
  let nearbyEnemy = false;
  let enemyToRight = false;
  
  for (const entity of gameState.entities) {
    if (entity.constructor.name === 'Enemy') {
      const distX = entity.x - gameState.player.x;
      const distY = entity.y - gameState.player.y;
      
      if (Math.abs(distX) < 100 && Math.abs(distY) < 50) {
        nearbyEnemy = true;
        enemyToRight = distX > 0;
        break;
      }
    }
  }
  
  // Combat behavior
  if (nearbyEnemy) {
    // Face the enemy
    if ((enemyToRight && !gameState.player.facingRight) || 
        (!enemyToRight && gameState.player.facingRight)) {
      return enemyToRight ? 39 : 37; // Turn to face enemy
    }
    
    // Attack if close
    if (Math.random() < 0.7) {
      return 90; // Z (attack)
    }
    
    // Jump to avoid
    if (Math.random() < 0.3) {
      return 38; // Jump
    }
    
    // Move towards enemy
    return enemyToRight ? 39 : 37;
  }
  
  // No enemies nearby
  if (isNight) {
    // During night, build a shelter
    if (gameState.time % 30 < 15) {
      // Place blocks
      return 32; // Space
    } else {
      // Move and mine
      return gameState.time % 60 < 30 ? 39 : 90; // Right or Mine
    }
  } else {
    // During day, explore and gather resources
    return getStickyKeysAction(gameState);
  }
}

// Test 4: Crafting progression
function getTestCraftingAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Check if we have the best pickaxe (gold)
  let hasGoldPickaxe = false;
  for (const item of gameState.inventory) {
    if (item.type === 9) { // GOLD_PICKAXE
      hasGoldPickaxe = true;
      break;
    }
  }
  
  if (hasGoldPickaxe) {
    // If we have the best pickaxe, just explore
    return getStickyKeysAction(gameState);
  }
  
  // Check if we're near a crafting table
  if (!gameState.nearCraftingTable) {
    // First priority: Place crafting table if we have one
    let hasCraftingTable = false;
    for (const item of gameState.inventory) {
      if (item.type === 14) { // CRAFTING_TABLE
        hasCraftingTable = true;
        // Switch to crafting table
        for (let i = 0; i < gameState.inventory.length; i++) {
          if (gameState.inventory[i].type === 14 && gameState.selectedItemIndex !== i) {
            return 16; // Shift to cycle
          }
        }
        // Place it
        return 32; // Space
      }
    }
    
    // Mine resources
    if (gameState.time % 30 < 20) {
      return 90; // Z (mine)
    } else {
      // Move around
      return Math.random() < 0.7 ? 39 : 37; // Right or Left
    }
  } else {
    // We're near a crafting table, try to craft better tools
    // First, mine more resources if needed
    if (gameState.time % 30 < 15) {
      return 90; // Z (mine)
    } else {
      return Math.random() < 0.7 ? 39 : 37; // Right or Left
    }
  }
}

// Test 5: Building mechanics
function getTestBuildingAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Check if it's almost night
  const approachingNight = gameState.time % 1800 >= 700 && gameState.time % 1800 < 900;
  
  // If approaching night, build a shelter
  if (approachingNight) {
    // Cycle between building actions
    const buildPhase = Math.floor(gameState.time / 15) % 4;
    
    switch (buildPhase) {
      case 0: return 90; // Mine (gather resources)
      case 1: return 32; // Place block
      case 2: return 39; // Move right
      case 3: return 16; // Switch items
    }
  }
  
  // Otherwise, explore and gather resources
  return getStickyKeysAction(gameState);
}

export function game_testing_controller(gameState) {
  // Track position to detect if stuck
  const currentPos = { x: gameState.player?.x || 0, y: gameState.player?.y || 0 };
  if (gameState.player && 
      Math.abs(currentPos.x - gameState.lastPosition.x) < 1 && 
      Math.abs(currentPos.y - gameState.lastPosition.y) < 1) {
    gameState.stuckCounter++;
  } else {
    gameState.stuckCounter = 0;
  }
  
  if (gameState.player) {
    gameState.lastPosition = { x: gameState.player.x, y: gameState.player.y };
  }
  
  // If stuck for too long, return random action
  if (gameState.stuckCounter > 60) {
    return [37, 38, 39, 40, 32, 90][Math.floor(Math.random() * 6)];
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    case "TEST_4":
      return getTestCraftingAction(gameState);
    case "TEST_5":
      return getTestBuildingAction(gameState);
    default:
      return null;
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;