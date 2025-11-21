import { TILE_SIZE, TILE_TYPES, TOOL_TYPES, ITEM_TYPES } from './globals.js';
import { canCraftItem } from './ui.js';

// Test 1: Basic functionality test with sticky keys
function getStickyKeysAction(gameState) {
  const currentTime = Date.now();
  
  // Change action every 1-3 seconds
  if (currentTime - gameState.lastActionTime > 1000 + Math.random() * 2000) {
    gameState.lastActionTime = currentTime;
    
    // Choose a random action
    const actions = [
      37, // LEFT
      39, // RIGHT
      38, // UP
      32, // SPACE
      90, // Z
      16  // SHIFT
    ];
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    gameState.actionHistory.push(randomAction);
    
    // Keep only the last 10 actions in history
    if (gameState.actionHistory.length > 10) {
      gameState.actionHistory.shift();
    }
    
    return randomAction;
  }
  
  // Continue the last action if there is one
  if (gameState.actionHistory.length > 0) {
    return gameState.actionHistory[gameState.actionHistory.length - 1];
  }
  
  // Default action: move right
  return 39;
}

// Test 2: Win condition test
function getTestWinAction(gameState) {
  // First, check if we're stuck
  checkIfStuck(gameState);
  
  // If boss is already defeated, just jump around in celebration
  if (gameState.bossDefeated) {
    return getRandomJumpingAction();
  }
  
  // Phase 1: Gather basic resources
  if (!hasBasicTools(gameState.inventory)) {
    return gatherBasicResources(gameState);
  }
  
  // Phase 2: Mine for better materials
  if (!hasBetterWeapons(gameState.inventory)) {
    return mineForBetterMaterials(gameState);
  }
  
  // Phase 3: Build shelter for boss fight
  if (!hasShelter(gameState)) {
    return buildShelter(gameState);
  }
  
  // Phase 4: Fight boss if spawned
  if (gameState.bossSpawned) {
    return fightBoss(gameState);
  }
  
  // Phase 5: Explore and wait for boss to spawn
  return exploreWorld(gameState);
}

// Test 3: Resource gathering and crafting test
function getResourceGatheringAction(gameState) {
  // First, check if we're stuck
  checkIfStuck(gameState);
  
  // Make sure we have the right tool selected for mining
  if (gameState.selectedTool !== TOOL_TYPES.PICKAXE) {
    return 90; // Z to switch tools
  }
  
  // Look for resources to mine
  const player = gameState.player;
  const world = gameState.world;
  
  // Check if there's a resource to mine nearby
  const mineableResourceNearby = checkForMineableResource(gameState);
  
  if (mineableResourceNearby) {
    return 32; // SPACE to mine
  }
  
  // Try to craft items if we have materials
  if (canCraftAnything(gameState.inventory)) {
    // We would craft here, but crafting is automatic in this implementation
    // Just keep mining for more resources
    return getRandomMovementAction();
  }
  
  // Move around to find resources
  return getRandomMovementAction();
}

// Test 4: Combat mechanics test
function getCombatTestAction(gameState) {
  // First, check if we're stuck
  checkIfStuck(gameState);
  
  // Make sure we have the right tool selected for combat
  if (gameState.selectedTool !== TOOL_TYPES.SWORD) {
    return 90; // Z to switch tools
  }
  
  // Check if there are enemies nearby
  const nearbyEnemy = findNearbyEnemy(gameState);
  
  if (nearbyEnemy) {
    // Position ourselves for attack
    if (nearbyEnemy.x < gameState.player.x - 10) {
      return 37; // LEFT to face enemy
    } else if (nearbyEnemy.x > gameState.player.x + 10) {
      return 39; // RIGHT to face enemy
    }
    
    // Jump if enemy is too close
    if (Math.abs(nearbyEnemy.x - gameState.player.x) < 20 && Math.abs(nearbyEnemy.y - gameState.player.y) < 20) {
      return 38; // UP to jump
    }
    
    // Attack!
    return 32; // SPACE to attack
  }
  
  // Move around to find enemies
  return getRandomMovementAction();
}

// Test 5: Building mechanics test
function getBuildingTestAction(gameState) {
  // First, check if we're stuck
  checkIfStuck(gameState);
  
  // Check if we have building materials
  if (!hasBuildingMaterials(gameState.inventory)) {
    // Gather materials first
    return gatherBasicResources(gameState);
  }
  
  // Select block for building if not selected
  if (!gameState.selectedBlock || (gameState.selectedBlock !== ITEM_TYPES.WOODEN_PLATFORM && 
                                  gameState.selectedBlock !== ITEM_TYPES.WOODEN_WALL &&
                                  gameState.selectedBlock !== ITEM_TYPES.STONE_WALL)) {
    return 90; // Z to switch tools/blocks
  }
  
  // Find a good spot to build
  const goodBuildSpot = findGoodBuildSpot(gameState);
  
  if (goodBuildSpot) {
    // Position for building
    if (goodBuildSpot === "left") {
      return 37; // LEFT
    } else if (goodBuildSpot === "right") {
      return 39; // RIGHT
    }
    
    // Place block
    return 16; // SHIFT to place block
  }
  
  // Move around to find a good build spot
  return getRandomMovementAction();
}

// Helper functions
function checkIfStuck(gameState) {
  // Check if player hasn't moved significantly in a while
  // Implementation would track position history and inject random actions
  // Simplified version for this example
}

function hasBasicTools(inventory) {
  return (inventory[ITEM_TYPES.WOOD_PICKAXE] > 0 || 
          inventory[ITEM_TYPES.STONE_PICKAXE] > 0 || 
          inventory[ITEM_TYPES.IRON_PICKAXE] > 0) &&
         (inventory[ITEM_TYPES.WOOD_AXE] > 0 || 
          inventory[ITEM_TYPES.STONE_AXE] > 0 || 
          inventory[ITEM_TYPES.IRON_AXE] > 0) &&
         (inventory[ITEM_TYPES.WOOD_SWORD] > 0 || 
          inventory[ITEM_TYPES.STONE_SWORD] > 0 || 
          inventory[ITEM_TYPES.IRON_SWORD] > 0);
}

function hasBetterWeapons(inventory) {
  return inventory[ITEM_TYPES.IRON_SWORD] > 0 || inventory[ITEM_TYPES.GOLD_SWORD] > 0;
}

function hasShelter(gameState) {
  // Simplified check - in a real implementation, would check for an actual structure
  return gameState.inventory[ITEM_TYPES.WOODEN_WALL] >= 10 &&
         gameState.inventory[ITEM_TYPES.WOODEN_PLATFORM] >= 5;
}

function hasBuildingMaterials(inventory) {
  return (inventory[ITEM_TYPES.WOODEN_WALL] > 0 ||
          inventory[ITEM_TYPES.STONE_WALL] > 0 ||
          inventory[ITEM_TYPES.WOODEN_PLATFORM] > 0);
}

function gatherBasicResources(gameState) {
  // First, check if there's a tree or stone nearby to mine
  const resourceNearby = checkForMineableResource(gameState);
  
  if (resourceNearby) {
    return 32; // SPACE to mine
  }
  
  // Move to find resources
  return getRandomMovementAction();
}

function mineForBetterMaterials(gameState) {
  // Check if we're deep enough for better ores
  if (gameState.player.y < 40 * TILE_SIZE) {
    // Need to go deeper
    return 39; // RIGHT to explore
  }
  
  // Check if there's an ore nearby
  const oreNearby = checkForMineableResource(gameState, true);
  
  if (oreNearby) {
    return 32; // SPACE to mine
  }
  
  // Move to find ores
  return getRandomMovementAction();
}

function buildShelter(gameState) {
  // Simplified shelter building
  // In a real implementation, would build walls and platforms in a specific pattern
  
  if (gameState.selectedBlock !== ITEM_TYPES.WOODEN_WALL &&
      gameState.selectedBlock !== ITEM_TYPES.WOODEN_PLATFORM) {
    return 90; // Z to switch tools/blocks
  }
  
  // Place block
  return 16; // SHIFT to place block
}

function fightBoss(gameState) {
  // Find the boss
  const boss = findBoss(gameState);
  
  if (!boss) {
    return getRandomMovementAction();
  }
  
  // Make sure we have the sword selected
  if (gameState.selectedTool !== TOOL_TYPES.SWORD) {
    return 90; // Z to switch tools
  }
  
  // Position for attack
  if (boss.x < gameState.player.x - 20) {
    return 37; // LEFT to face boss
  } else if (boss.x > gameState.player.x + 20) {
    return 39; // RIGHT to face boss
  }
  
  // Jump if boss is too close
  if (Math.abs(boss.x - gameState.player.x) < 30) {
    return 38; // UP to jump
  }
  
  // Attack!
  return 32; // SPACE to attack
}

function exploreWorld(gameState) {
  // Simplified exploration - just move around
  return getRandomMovementAction();
}

function checkForMineableResource(gameState, lookForOres = false) {
  // Simplified resource detection
  // In a real implementation, would check tiles around the player for resources
  return Math.random() < 0.3; // 30% chance to "find" a resource
}

function findNearbyEnemy(gameState) {
  // Check if there are enemies in the entities array
  for (const entity of gameState.entities) {
    if (entity.type && entity.type.includes('enemy')) {
      // Check if enemy is nearby
      const dx = entity.x - gameState.player.x;
      const dy = entity.y - gameState.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        return entity;
      }
    }
  }
  
  return null;
}

function findBoss(gameState) {
  // Check if there's a boss in the entities array
  for (const entity of gameState.entities) {
    if (entity.type === 'enemy_boss') {
      return entity;
    }
  }
  
  return null;
}

function findGoodBuildSpot(gameState) {
  // Simplified build spot detection
  if (Math.random() < 0.3) {
    return Math.random() < 0.5 ? "left" : "right";
  }
  return null;
}

function canCraftAnything(inventory) {
  // Check if we can craft any item
  // This is a simplified version
  return inventory[ITEM_TYPES.WOOD] >= 3 || inventory[ITEM_TYPES.STONE] >= 4;
}

function getRandomMovementAction() {
  const actions = [37, 39, 38]; // LEFT, RIGHT, UP
  return actions[Math.floor(Math.random() * actions.length)];
}

function getRandomJumpingAction() {
  // Either jump, move left, or move right
  const r = Math.random();
  if (r < 0.4) return 38; // UP
  if (r < 0.7) return 37; // LEFT
  return 39; // RIGHT
}

// Main testing controller
export function game_testing_controller(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getResourceGatheringAction(gameState);
    case "TEST_4":
      return getCombatTestAction(gameState);
    case "TEST_5":
      return getBuildingTestAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;