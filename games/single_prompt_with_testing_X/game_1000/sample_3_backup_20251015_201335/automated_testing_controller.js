import { gameState, BLOCK_TYPES, BLOCK_SIZE, WORLD_WIDTH } from './globals.js';
import { getBlockAt } from './world.js';
import { canCraft, getAvailableRecipes } from './crafting.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false, mining: false };
  
  const inputs = { left: false, right: false, jump: false, mining: false };
  
  // Strategy: Mine resources -> Craft tools -> Defeat boss
  
  // Phase 1: Gather wood if needed
  if (!gameState.playerInventory.wood || gameState.playerInventory.wood < 5) {
    return mineNearestBlock(player, BLOCK_TYPES.WOOD, inputs);
  }
  
  // Phase 2: Craft wooden pickaxe if don't have any pickaxe
  if (!player.equippedTool || player.equippedTool === "none") {
    if (canCraft("wooden_pickaxe")) {
      // Open crafting is handled by shift key, but we can't press it
      // Instead, just continue mining - the test will manually handle crafting
    }
    return mineNearestBlock(player, BLOCK_TYPES.WOOD, inputs);
  }
  
  // Phase 3: Gather stone
  if (player.equippedTool === "wooden_pickaxe" && (!gameState.playerInventory.stone || gameState.playerInventory.stone < 5)) {
    return mineNearestBlock(player, BLOCK_TYPES.STONE, inputs);
  }
  
  // Phase 4: Gather iron ore
  if ((!gameState.playerInventory.iron_ore || gameState.playerInventory.iron_ore < 10)) {
    return mineNearestBlock(player, BLOCK_TYPES.IRON_ORE, inputs);
  }
  
  // Phase 5: Fight boss
  const boss = gameState.enemies.find(e => e.type === "boss_golem" && e.alive);
  if (boss) {
    return fightEnemy(player, boss, inputs);
  }
  
  // Phase 6: Find boss or explore
  return exploreRight(player, inputs);
}

function mineNearestBlock(player, blockType, inputs) {
  const playerBlockX = Math.floor((player.x + player.width / 2) / BLOCK_SIZE);
  const playerBlockY = Math.floor((player.y + player.height / 2) / BLOCK_SIZE);
  
  let nearest = null;
  let nearestDist = 1000;
  
  // Search for nearest block
  for (let dx = -20; dx <= 20; dx++) {
    for (let dy = -10; dy <= 10; dy++) {
      const bx = playerBlockX + dx;
      const by = playerBlockY + dy;
      
      if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < gameState.blocks[0].length) {
        const block = gameState.blocks[bx][by];
        if (block.type === blockType) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { bx, by };
          }
        }
      }
    }
  }
  
  if (nearest) {
    const targetX = nearest.bx * BLOCK_SIZE + BLOCK_SIZE / 2;
    const targetY = nearest.by * BLOCK_SIZE + BLOCK_SIZE / 2;
    
    return moveToward(player, targetX, targetY, inputs, true);
  }
  
  // No block found, explore
  return exploreRight(player, inputs);
}

function moveToward(player, targetX, targetY, inputs, mining = false) {
  const dx = targetX - (player.x + player.width / 2);
  const dy = targetY - (player.y + player.height / 2);
  
  // If close enough and mining, start mining
  if (Math.abs(dx) < 60 && Math.abs(dy) < 60 && mining) {
    inputs.mining = true;
    return inputs;
  }
  
  // Move horizontally
  if (dx > 10) {
    inputs.right = true;
  } else if (dx < -10) {
    inputs.left = true;
  }
  
  // Jump if blocked or need to go up
  if (dy < -20 || isBlockedHorizontally(player, dx > 0)) {
    inputs.jump = true;
  }
  
  return inputs;
}

function isBlockedHorizontally(player, movingRight) {
  const checkX = movingRight ? player.x + player.width + 5 : player.x - 5;
  const checkY = player.y + player.height / 2;
  
  const block = getBlockAt(checkX, checkY);
  return block && block.type !== BLOCK_TYPES.AIR;
}

function fightEnemy(player, enemy, inputs) {
  const targetX = enemy.x + enemy.width / 2;
  const targetY = enemy.y + enemy.height / 2;
  
  return moveToward(player, targetX, targetY, inputs, true);
}

function exploreRight(player, inputs) {
  inputs.right = true;
  
  // Jump occasionally
  if (Math.random() < 0.1 || isBlockedHorizontally(player, true)) {
    inputs.jump = true;
  }
  
  return inputs;
}

function getTestMovementAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false, mining: false };
  
  const inputs = { left: false, right: false, jump: false, mining: false };
  
  // Test movement by moving right and jumping
  inputs.right = true;
  
  if (gameState.testPositionHistory.length === 0 || 
      (gameState.testPositionHistory.length > 0 && 
       Math.abs(player.x - gameState.testPositionHistory[gameState.testPositionHistory.length - 1].x) < 1)) {
    inputs.jump = true;
  }
  
  return inputs;
}

function getTestResourceGatheringAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false, mining: false };
  
  const inputs = { left: false, right: false, jump: false, mining: false };
  
  // Mine different types of blocks
  const resourcesNeeded = ["wood", "stone", "dirt", "iron_ore"];
  
  for (const resource of resourcesNeeded) {
    const blockType = {
      "wood": BLOCK_TYPES.WOOD,
      "stone": BLOCK_TYPES.STONE,
      "dirt": BLOCK_TYPES.DIRT,
      "iron_ore": BLOCK_TYPES.IRON_ORE,
    }[resource];
    
    if (!gameState.playerInventory[resource] || gameState.playerInventory[resource] < 3) {
      return mineNearestBlock(player, blockType, inputs);
    }
  }
  
  // All resources gathered
  return { left: false, right: false, jump: false, mining: false };
}

function getTestCombatAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false, mining: false };
  
  const inputs = { left: false, right: false, jump: false, mining: false };
  
  // Find and fight enemies
  const enemy = gameState.enemies.find(e => e.alive && e.type !== "boss_golem");
  
  if (enemy) {
    return fightEnemy(player, enemy, inputs);
  }
  
  // Explore to find enemies
  return exploreRight(player, inputs);
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    jump: Math.random() < 0.1,
    mining: Math.random() < 0.2,
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestWinAction(gameState);
    case "TEST_2":
      return getTestResourceGatheringAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    case "TEST_4":
      return getTestMovementAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;