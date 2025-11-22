// automated_testing_controller.js - Automated testing
import { gameState, GAME_PHASES, ITEM_TYPES, TILE_SIZE } from './globals.js';
import { RECIPES } from './crafting.js';

function getTestBasicAction(gs) {
  const player = gs.player;
  if (!player) return { left: false, right: false, jump: false, attack: false };
  
  // Simple movement and mining test
  const action = { left: false, right: false, jump: false, attack: false };
  
  // Move right and mine
  if (player.x < 2000) {
    action.right = true;
    
    // Jump over obstacles
    if (player.grounded && Math.random() < 0.1) {
      action.jump = true;
    }
    
    // Mine blocks ahead
    if (Math.random() < 0.3) {
      action.attack = true;
    }
  }
  
  return action;
}

function getTestWinAction(gs) {
  const player = gs.player;
  if (!player) return { left: false, right: false, jump: false, attack: false };
  
  const action = { 
    left: false, 
    right: false, 
    jump: false, 
    attack: false,
    attackRelease: false,
    craft: false,
    craftItem: null
  };
  
  // Strategy: Mine resources -> Craft tools -> Defeat bosses -> Win
  
  // Phase 1: Gather basic resources (stone)
  if (!player.hasItem(ITEM_TYPES.STONE, 20)) {
    // Move down to stone layer
    if (player.y < 800) {
      action.right = true;
      if (player.grounded && Math.random() < 0.2) {
        action.jump = true;
      }
    }
    
    // Mine stone
    action.attack = true;
    if (Math.random() < 0.1) {
      action.attackRelease = true;
    }
    return action;
  }
  
  // Phase 2: Craft stone tools
  if (!player.equippedPickaxe || player.equippedPickaxe === ITEM_TYPES.WOOD_PICKAXE) {
    action.craft = true;
    action.craftItem = '1'; // Stone pickaxe
    return action;
  }
  if (!player.equippedSword || player.equippedSword === ITEM_TYPES.WOOD_SWORD) {
    action.craft = true;
    action.craftItem = '6'; // Stone sword
    return action;
  }
  
  // Phase 3: Gather iron
  if (!player.hasItem(ITEM_TYPES.IRON, 40)) {
    if (player.y < 1200) {
      action.right = true;
      if (player.grounded && Math.random() < 0.15) {
        action.jump = true;
      }
    }
    action.attack = true;
    if (Math.random() < 0.15) {
      action.attackRelease = true;
    }
    return action;
  }
  
  // Phase 4: Craft iron tools
  if (player.equippedPickaxe === ITEM_TYPES.STONE_PICKAXE) {
    action.craft = true;
    action.craftItem = '2'; // Iron pickaxe
    return action;
  }
  if (player.equippedSword === ITEM_TYPES.STONE_SWORD) {
    action.craft = true;
    action.craftItem = '7'; // Iron sword
    return action;
  }
  
  // Phase 5: Gather gold
  if (!player.hasItem(ITEM_TYPES.GOLD, 50)) {
    if (player.y < 1500) {
      action.right = true;
      if (player.grounded && Math.random() < 0.1) {
        action.jump = true;
      }
    }
    action.attack = true;
    if (Math.random() < 0.2) {
      action.attackRelease = true;
    }
    return action;
  }
  
  // Phase 6: Craft gold tools
  if (player.equippedPickaxe === ITEM_TYPES.IRON_PICKAXE) {
    action.craft = true;
    action.craftItem = '3';
    return action;
  }
  if (player.equippedSword === ITEM_TYPES.IRON_SWORD) {
    action.craft = true;
    action.craftItem = '8';
    return action;
  }
  
  // Phase 7: Gather diamonds
  if (!player.hasItem(ITEM_TYPES.DIAMOND, 60)) {
    if (player.y < 1800) {
      action.right = true;
      if (player.grounded && Math.random() < 0.08) {
        action.jump = true;
      }
    }
    action.attack = true;
    if (Math.random() < 0.25) {
      action.attackRelease = true;
    }
    return action;
  }
  
  // Phase 8: Craft diamond tools
  if (player.equippedPickaxe === ITEM_TYPES.GOLD_PICKAXE) {
    action.craft = true;
    action.craftItem = '4';
    return action;
  }
  if (player.equippedSword === ITEM_TYPES.GOLD_SWORD) {
    action.craft = true;
    action.craftItem = '9';
    return action;
  }
  
  // Phase 9: Gather mythril
  if (!player.hasItem(ITEM_TYPES.MYTHRIL, 70)) {
    if (player.y < 1900) {
      action.right = true;
      if (player.grounded && Math.random() < 0.05) {
        action.jump = true;
      }
    }
    action.attack = true;
    if (Math.random() < 0.3) {
      action.attackRelease = true;
    }
    return action;
  }
  
  // Phase 10: Craft mythril tools
  if (player.equippedPickaxe !== ITEM_TYPES.MYTHRIL_PICKAXE) {
    action.craft = true;
    action.craftItem = '5';
    return action;
  }
  if (player.equippedSword !== ITEM_TYPES.MYTHRIL_SWORD) {
    action.craft = true;
    action.craftItem = '0';
    return action;
  }
  
  // Phase 11: Fight bosses
  let nearestBoss = null;
  let nearestDist = Infinity;
  
  for (const entity of gs.entities) {
    if (entity === player) continue;
    if (!entity.active) continue;
    
    const dx = entity.x - player.x;
    const dy = entity.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestBoss = entity;
    }
  }
  
  if (nearestBoss) {
    const dx = nearestBoss.x - player.x;
    
    if (Math.abs(dx) > 50) {
      if (dx > 0) action.right = true;
      else action.left = true;
      
      if (player.grounded && Math.random() < 0.15) {
        action.jump = true;
      }
    } else {
      // In range - attack
      action.attack = true;
      if (Math.random() < 0.4) {
        action.attackRelease = true;
      }
      
      // Dodge
      if (Math.random() < 0.1) {
        action.jump = true;
      }
    }
  } else {
    // No boss nearby, move towards spawn areas
    if (player.x < 3000) {
      action.right = true;
      if (player.grounded && Math.random() < 0.1) {
        action.jump = true;
      }
    }
  }
  
  return action;
}

function getRandomAction(gs) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    jump: Math.random() < 0.1,
    attack: Math.random() < 0.2
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;