// game_logic.js - Core game logic

import {
  gameState,
  GAME_PHASES,
  HUNGER_CONFIG,
  RESOURCE_GATHER_AMOUNTS,
  CRAFT_RECIPES,
  TIME_CONFIG,
  CAMPFIRE_CONFIG
} from './globals.js';

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update hunger
  gameState.hunger = Math.max(0, gameState.hunger - HUNGER_CONFIG.DECAY_RATE);
  
  // Check death by starvation
  if (gameState.hunger <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "starvation" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Update time of day
  gameState.timeOfDay++;
  const cycleLength = TIME_CONFIG.DAY_LENGTH + TIME_CONFIG.NIGHT_LENGTH;
  
  if (gameState.timeOfDay >= cycleLength) {
    gameState.timeOfDay = 0;
    gameState.cyclesCompleted++;
    
    // Check win condition
    if (gameState.cyclesCompleted >= TIME_CONFIG.CYCLES_TO_WIN) {
      gameState.portal.activate();
    }
  }
  
  // Nighttime damage
  const isNight = gameState.timeOfDay >= TIME_CONFIG.DAY_LENGTH;
  if (isNight) {
    const inLight = gameState.campfire.isPlayerInLight(gameState.player);
    if (!inLight) {
      gameState.hunger = Math.max(0, gameState.hunger - CAMPFIRE_CONFIG.DAMAGE_PER_FRAME);
    }
  }
  
  // Update entities
  gameState.campfire.update(p);
  gameState.portal.update(p);
  
  for (const resource of gameState.resources) {
    resource.update();
  }
  
  for (const rabbit of gameState.rabbits) {
    rabbit.update(gameState.player);
  }
  
  // Update score
  gameState.score = Math.floor(
    gameState.cyclesCompleted * 1000 +
    gameState.inventory.berry * 5 +
    gameState.inventory.wood * 10 +
    gameState.inventory.stone * 10 +
    gameState.inventory.meat * 25
  );
}

export function handleGather(p) {
  // Check for nearby resources
  for (const resource of gameState.resources) {
    if (gameState.player.isNear(resource, 50) && !resource.depleted) {
      const item = resource.gather();
      if (item) {
        let amount = RESOURCE_GATHER_AMOUNTS[item.toUpperCase()];
        
        // Bonus with tools
        if (item === 'wood' && gameState.inventory.hasAxe) {
          amount = RESOURCE_GATHER_AMOUNTS.WOOD_WITH_AXE;
        } else if (item === 'stone' && gameState.inventory.hasPickaxe) {
          amount = RESOURCE_GATHER_AMOUNTS.STONE_WITH_PICKAXE;
        }
        
        gameState.inventory[item] += amount;
        return;
      }
    }
  }
  
  // Check for nearby rabbits
  for (const rabbit of gameState.rabbits) {
    if (gameState.player.isNear(rabbit, 40) && rabbit.alive) {
      if (rabbit.hunt()) {
        gameState.inventory.meat += 1;
        return;
      }
    }
  }
}

export function handleCraft() {
  // Try to craft axe
  if (!gameState.inventory.hasAxe) {
    const recipe = CRAFT_RECIPES.AXE;
    if (gameState.inventory.wood >= recipe.wood && gameState.inventory.stone >= recipe.stone) {
      gameState.inventory.wood -= recipe.wood;
      gameState.inventory.stone -= recipe.stone;
      gameState.inventory.hasAxe = true;
      return;
    }
  }
  
  // Try to craft pickaxe
  if (!gameState.inventory.hasPickaxe) {
    const recipe = CRAFT_RECIPES.PICKAXE;
    if (gameState.inventory.wood >= recipe.wood && gameState.inventory.stone >= recipe.stone) {
      gameState.inventory.wood -= recipe.wood;
      gameState.inventory.stone -= recipe.stone;
      gameState.inventory.hasPickaxe = true;
      return;
    }
  }
}

export function handleCampfire() {
  if (gameState.player.isNear(gameState.campfire, 60)) {
    if (gameState.inventory.wood > 0) {
      gameState.inventory.wood--;
      gameState.campfire.addFuel(CAMPFIRE_CONFIG.FUEL_PER_WOOD);
    }
  }
}

export function consumeFood(itemType) {
  if (itemType === 'berry' && gameState.inventory.berry > 0) {
    gameState.inventory.berry--;
    gameState.hunger = Math.min(HUNGER_CONFIG.MAX, gameState.hunger + HUNGER_CONFIG.BERRY_RESTORE);
  } else if (itemType === 'meat' && gameState.inventory.meat > 0) {
    gameState.inventory.meat--;
    gameState.hunger = Math.min(HUNGER_CONFIG.MAX, gameState.hunger + HUNGER_CONFIG.MEAT_RESTORE);
  }
}

export function checkPortalWin(p) {
  if (gameState.portal.active && gameState.player.isNear(gameState.portal, 60)) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}