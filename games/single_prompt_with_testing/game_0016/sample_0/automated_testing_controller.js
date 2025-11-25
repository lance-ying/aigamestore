// automated_testing_controller.js - Automated testing

import {
  gameState,
  TIME_CONFIG,
  CRAFT_RECIPES
} from './globals.js';

function findNearest(player, items) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const item of items) {
    const dx = item.x - player.x;
    const dy = item.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = item;
    }
  }
  
  return { item: nearest, distance: minDist };
}

function moveTowards(player, target) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 50) {
    return { space: true }; // Interact
  }
  
  const keys = {};
  if (Math.abs(dx) > 5) {
    if (dx > 0) keys.right = true;
    else keys.left = true;
  }
  if (Math.abs(dy) > 5) {
    if (dy > 0) keys.down = true;
    else keys.up = true;
  }
  
  return keys;
}

function getTestBasicAction(gameState) {
  const player = gameState.player;
  
  // Priority: maintain hunger
  if (gameState.hunger < 50 && gameState.inventory.berry > 0) {
    return { key: '1' }; // Eat berry
  }
  
  // Gather berries
  const berryBushes = gameState.resources.filter(r => r.type === 'berry_bush' && !r.depleted);
  if (berryBushes.length > 0) {
    const { item: nearestBerry } = findNearest(player, berryBushes);
    return moveTowards(player, nearestBerry);
  }
  
  // Gather wood
  if (gameState.inventory.wood < 3) {
    const trees = gameState.resources.filter(r => r.type === 'tree' && !r.depleted);
    if (trees.length > 0) {
      const { item: nearestTree } = findNearest(player, trees);
      return moveTowards(player, nearestTree);
    }
  }
  
  // Gather stone
  if (gameState.inventory.stone < 3) {
    const rocks = gameState.resources.filter(r => r.type === 'rock' && !r.depleted);
    if (rocks.length > 0) {
      const { item: nearestRock } = findNearest(player, rocks);
      return moveTowards(player, nearestRock);
    }
  }
  
  // Craft axe
  if (!gameState.inventory.hasAxe && 
      gameState.inventory.wood >= CRAFT_RECIPES.AXE.wood &&
      gameState.inventory.stone >= CRAFT_RECIPES.AXE.stone) {
    return { z: true };
  }
  
  return {};
}

function getTestWinAction(gameState) {
  const player = gameState.player;
  const isNight = gameState.timeOfDay >= TIME_CONFIG.DAY_LENGTH;
  
  // Check if we can win
  if (gameState.portal.active) {
    return moveTowards(player, gameState.portal);
  }
  
  // Night survival
  if (isNight) {
    const nearFire = player.isNear(gameState.campfire, 60);
    
    if (!gameState.campfire.lit || gameState.campfire.fuel < 50) {
      if (gameState.inventory.wood > 0 && nearFire) {
        return { shift: true }; // Add wood
      }
      
      // Go to campfire
      if (!nearFire) {
        return moveTowards(player, gameState.campfire);
      }
      
      // Need wood
      const trees = gameState.resources.filter(r => r.type === 'tree' && !r.depleted);
      if (trees.length > 0 && gameState.inventory.wood < 2) {
        const { item: nearestTree } = findNearest(player, trees);
        return moveTowards(player, nearestTree);
      }
    }
    
    // Stay near fire
    if (gameState.campfire.lit && !nearFire) {
      return moveTowards(player, gameState.campfire);
    }
    
    return {}; // Wait by fire
  }
  
  // Day actions
  // Priority: maintain hunger
  if (gameState.hunger < 40) {
    if (gameState.inventory.meat > 0) {
      return { key: '2' };
    } else if (gameState.inventory.berry > 0) {
      return { key: '1' };
    }
  }
  
  // Hunt rabbits for meat
  const liveRabbits = gameState.rabbits.filter(r => r.alive);
  if (liveRabbits.length > 0 && gameState.inventory.meat < 3) {
    const { item: nearestRabbit } = findNearest(player, liveRabbits);
    return moveTowards(player, nearestRabbit);
  }
  
  // Gather berries
  if (gameState.inventory.berry < 5) {
    const berryBushes = gameState.resources.filter(r => r.type === 'berry_bush' && !r.depleted);
    if (berryBushes.length > 0) {
      const { item: nearestBerry } = findNearest(player, berryBushes);
      return moveTowards(player, nearestBerry);
    }
  }
  
  // Gather wood for campfire
  if (gameState.inventory.wood < 5) {
    const trees = gameState.resources.filter(r => r.type === 'tree' && !r.depleted);
    if (trees.length > 0) {
      const { item: nearestTree } = findNearest(player, trees);
      return moveTowards(player, nearestTree);
    }
  }
  
  // Gather stone
  if (gameState.inventory.stone < 3) {
    const rocks = gameState.resources.filter(r => r.type === 'rock' && !r.depleted);
    if (rocks.length > 0) {
      const { item: nearestRock } = findNearest(player, rocks);
      return moveTowards(player, nearestRock);
    }
  }
  
  // Craft tools
  if (!gameState.inventory.hasAxe && 
      gameState.inventory.wood >= CRAFT_RECIPES.AXE.wood &&
      gameState.inventory.stone >= CRAFT_RECIPES.AXE.stone) {
    return { z: true };
  }
  
  if (!gameState.inventory.hasPickaxe && 
      gameState.inventory.wood >= CRAFT_RECIPES.PICKAXE.wood &&
      gameState.inventory.stone >= CRAFT_RECIPES.PICKAXE.stone) {
    return { z: true };
  }
  
  return {};
}

function getTestMovementAction(gameState) {
  const frame = gameState.player ? Math.floor(Date.now() / 1000) % 4 : 0;
  
  switch(frame) {
    case 0: return { right: true };
    case 1: return { down: true };
    case 2: return { left: true };
    case 3: return { up: true };
    default: return {};
  }
}

function getTestInteractionAction(gameState) {
  const player = gameState.player;
  
  // Test gathering all resource types
  if (gameState.inventory.berry < 5) {
    const berryBushes = gameState.resources.filter(r => r.type === 'berry_bush' && !r.depleted);
    if (berryBushes.length > 0) {
      const { item: nearestBerry } = findNearest(player, berryBushes);
      return moveTowards(player, nearestBerry);
    }
  }
  
  if (gameState.inventory.wood < 5) {
    const trees = gameState.resources.filter(r => r.type === 'tree' && !r.depleted);
    if (trees.length > 0) {
      const { item: nearestTree } = findNearest(player, trees);
      return moveTowards(player, nearestTree);
    }
  }
  
  if (gameState.inventory.stone < 5) {
    const rocks = gameState.resources.filter(r => r.type === 'rock' && !r.depleted);
    if (rocks.length > 0) {
      const { item: nearestRock } = findNearest(player, rocks);
      return moveTowards(player, nearestRock);
    }
  }
  
  // Test hunting
  const liveRabbits = gameState.rabbits.filter(r => r.alive);
  if (liveRabbits.length > 0) {
    const { item: nearestRabbit } = findNearest(player, liveRabbits);
    return moveTowards(player, nearestRabbit);
  }
  
  return {};
}

function getTestNightSurvivalAction(gameState) {
  const player = gameState.player;
  
  // Gather wood first
  if (gameState.inventory.wood < 3) {
    const trees = gameState.resources.filter(r => r.type === 'tree' && !r.depleted);
    if (trees.length > 0) {
      const { item: nearestTree } = findNearest(player, trees);
      return moveTowards(player, nearestTree);
    }
  }
  
  // Go to campfire
  const nearFire = player.isNear(gameState.campfire, 60);
  if (!nearFire) {
    return moveTowards(player, gameState.campfire);
  }
  
  // Light/fuel campfire
  if (gameState.inventory.wood > 0 && (!gameState.campfire.lit || gameState.campfire.fuel < 100)) {
    return { shift: true };
  }
  
  return {}; // Wait
}

function getRandomAction(gameState) {
  const actions = [
    { left: true },
    { right: true },
    { up: true },
    { down: true },
    { space: true },
    {}
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestMovementAction(gameState);
    case "TEST_4":
      return getTestInteractionAction(gameState);
    case "TEST_5":
      return getTestNightSurvivalAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;