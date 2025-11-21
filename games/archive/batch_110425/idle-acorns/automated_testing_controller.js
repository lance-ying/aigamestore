// automated_testing_controller.js - Automated testing strategies

import { AREAS, GAME_PHASES } from './globals.js';
import { SHOP_ITEMS } from './shop.js';
import { RECIPES } from './campfire.js';

// Helper to create key action
function createAction(keyCode, key) {
  return { keyCode, key };
}

// TEST_1: Basic testing - collect acorns and navigate areas
function getBasicTestAction(gameState) {
  const frameCount = window.gameInstance?.frameCount || 0;
  
  // Navigate through areas every 180 frames
  if (frameCount % 180 === 0) {
    return createAction(39, 'ArrowRight'); // Right arrow
  }
  
  // Collect acorns frequently
  if (frameCount % 30 === 0) {
    return createAction(32, ' '); // Space
  }
  
  return null;
}

// TEST_2: Win strategy - complete all objectives
let winStrategyState = {
  phase: 'collect_initial',
  lastAction: 0,
  purchaseQueue: [],
  targetArea: AREAS.SHOP,
  recipeIndex: 0
};

function getWinStrategyAction(gameState) {
  const frameCount = window.gameInstance?.frameCount || 0;
  
  // Reset strategy state if game restarted
  if (gameState.gamePhase === GAME_PHASES.START) {
    winStrategyState = {
      phase: 'collect_initial',
      lastAction: 0,
      purchaseQueue: [],
      targetArea: AREAS.SHOP,
      recipeIndex: 0
    };
    return null;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Throttle actions
  if (frameCount - winStrategyState.lastAction < 10) return null;
  winStrategyState.lastAction = frameCount;
  
  // Phase 1: Collect initial acorns and buy first scavenger
  if (winStrategyState.phase === 'collect_initial') {
    if (gameState.currentArea !== AREAS.SHOP) {
      return createAction(39, 'ArrowRight');
    }
    
    if (gameState.acorns < 10) {
      return createAction(32, ' '); // Collect acorns
    } else {
      // Buy first scavenger
      return createAction(90, 'z');
      winStrategyState.phase = 'enable_auto';
    }
  }
  
  // Phase 2: Enable auto-collect
  if (winStrategyState.phase === 'enable_auto') {
    winStrategyState.phase = 'buy_upgrades';
    return createAction(16, 'Shift');
  }
  
  // Phase 3: Buy upgrades systematically
  if (winStrategyState.phase === 'buy_upgrades') {
    if (gameState.currentArea !== AREAS.SHOP) {
      return createAction(39, 'ArrowRight');
    }
    
    // Priority order: Scavengers, Click upgrades, Unlock areas, Skills
    const shopSystem = window.gameInstance?.shopSystem;
    if (!shopSystem) return createAction(32, ' ');
    
    // Try to buy current selected item
    const currentItem = SHOP_ITEMS[shopSystem.selectedIndex];
    if (currentItem && shopSystem.canPurchase(currentItem.id)) {
      const purchased = shopSystem.purchase(currentItem.id);
      if (purchased) {
        // Move to next item
        if (shopSystem.selectedIndex < SHOP_ITEMS.length - 1) {
          return createAction(40, 'ArrowDown');
        }
      }
    }
    
    // Navigate to next item if can't afford current
    if (shopSystem.selectedIndex < SHOP_ITEMS.length - 1) {
      return createAction(40, 'ArrowDown');
    }
    
    // Check if we've unlocked pond
    if (gameState.upgrades.unlockPond && !winStrategyState.pondStarted) {
      winStrategyState.phase = 'fishing';
      winStrategyState.pondStarted = true;
    } else if (gameState.scavengers >= 3 && gameState.acorns < 50) {
      // Wait for passive income
      return null;
    } else {
      // Keep collecting
      return createAction(32, ' ');
    }
  }
  
  // Phase 4: Fishing
  if (winStrategyState.phase === 'fishing') {
    if (gameState.currentArea !== AREAS.POND) {
      return createAction(39, 'ArrowRight');
    }
    
    if (gameState.fishingState.casting) {
      // Try to catch in the window
      if (gameState.fishingState.catchWindowActive) {
        return createAction(90, 'z');
      }
    } else {
      // Cast line
      if (gameState.fish < 10) {
        return createAction(32, ' ');
      } else {
        winStrategyState.phase = 'gardening';
      }
    }
  }
  
  // Phase 5: Gardening
  if (winStrategyState.phase === 'gardening') {
    if (!gameState.upgrades.unlockGarden) {
      winStrategyState.phase = 'buy_upgrades';
      return null;
    }
    
    if (gameState.currentArea !== AREAS.GARDEN) {
      return createAction(39, 'ArrowRight');
    }
    
    // Plant seeds
    const emptyPlots = gameState.gardenPlots.filter(p => !p.planted);
    if (emptyPlots.length > 0 && gameState.acorns >= 5) {
      return createAction(32, ' ');
    }
    
    // Harvest ready crops
    const readyPlots = gameState.gardenPlots.filter(p => p.ready);
    if (readyPlots.length > 0) {
      return createAction(90, 'z');
    }
    
    // Move to crafting phase when we have resources
    if (gameState.crops >= 5 && gameState.fish >= 5) {
      winStrategyState.phase = 'crafting';
    }
  }
  
  // Phase 6: Crafting
  if (winStrategyState.phase === 'crafting') {
    if (!gameState.upgrades.unlockCampfire) {
      winStrategyState.phase = 'buy_upgrades';
      return null;
    }
    
    if (gameState.currentArea !== AREAS.CAMPFIRE) {
      return createAction(39, 'ArrowRight');
    }
    
    const campfireSystem = window.gameInstance?.campfireSystem;
    if (!campfireSystem) return null;
    
    // Trade with visitor if present
    if (campfireSystem.visitorPresent) {
      return createAction(90, 'z');
    }
    
    // Craft recipes
    const recipe = RECIPES[campfireSystem.selectedRecipeIndex];
    if (recipe && campfireSystem.canCraftRecipe(recipe)) {
      return createAction(90, 'z');
    } else {
      // Navigate to next recipe
      if (campfireSystem.selectedRecipeIndex < RECIPES.length - 1) {
        return createAction(40, 'ArrowDown');
      } else {
        campfireSystem.selectedRecipeIndex = 0;
        // Go back to collect more resources
        if (gameState.craftedItems < 24) {
          winStrategyState.phase = 'collect_resources';
        }
      }
    }
  }
  
  // Phase 7: Collect more resources
  if (winStrategyState.phase === 'collect_resources') {
    // Rotate between fishing and gardening
    if (gameState.fish < gameState.crops) {
      winStrategyState.phase = 'fishing';
    } else {
      winStrategyState.phase = 'gardening';
    }
    
    // Also buy more upgrades if possible
    if (gameState.acorns > 200) {
      winStrategyState.phase = 'buy_upgrades';
    }
    
    // Check progress toward win
    if (gameState.craftedItems >= 20) {
      // Final push - focus on crafting
      winStrategyState.phase = 'crafting';
    }
  }
  
  // Default: collect acorns
  return createAction(32, ' ');
}

// TEST_3: Fishing focus
function getFishingTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Navigate to pond
  if (!gameState.upgrades.unlockPond) {
    // Buy acorns and unlock pond
    if (gameState.currentArea !== AREAS.SHOP) {
      return createAction(39, 'ArrowRight');
    }
    if (gameState.acorns < 100) {
      return createAction(32, ' ');
    }
    return createAction(90, 'z');
  }
  
  if (gameState.currentArea !== AREAS.POND) {
    return createAction(39, 'ArrowRight');
  }
  
  if (gameState.fishingState.casting) {
    if (gameState.fishingState.catchWindowActive) {
      return createAction(90, 'z');
    }
  } else {
    return createAction(32, ' ');
  }
  
  return null;
}

// TEST_4: Garden focus
function getGardenTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  // Navigate to garden
  if (!gameState.upgrades.unlockGarden) {
    if (gameState.currentArea !== AREAS.SHOP) {
      return createAction(39, 'ArrowRight');
    }
    if (gameState.acorns < 200) {
      return createAction(32, ' ');
    }
    return createAction(90, 'z');
  }
  
  if (gameState.currentArea !== AREAS.GARDEN) {
    return createAction(39, 'ArrowRight');
  }
  
  const emptyPlots = gameState.gardenPlots.filter(p => !p.planted);
  if (emptyPlots.length > 0 && gameState.acorns >= 5) {
    return createAction(32, ' ');
  }
  
  const readyPlots = gameState.gardenPlots.filter(p => p.ready);
  if (readyPlots.length > 0) {
    return createAction(90, 'z');
  }
  
  return null;
}

// TEST_5: Campfire focus
function getCampfireTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;
  
  if (!gameState.upgrades.unlockCampfire) {
    if (gameState.currentArea !== AREAS.SHOP) {
      return createAction(39, 'ArrowRight');
    }
    if (gameState.acorns < 350) {
      return createAction(32, ' ');
    }
    return createAction(90, 'z');
  }
  
  // Collect resources first
  if (gameState.fish < 5 || gameState.crops < 5) {
    if (gameState.fish < 5) {
      if (gameState.currentArea !== AREAS.POND) {
        return createAction(39, 'ArrowRight');
      }
      if (gameState.fishingState.casting) {
        if (gameState.fishingState.catchWindowActive) {
          return createAction(90, 'z');
        }
      } else {
        return createAction(32, ' ');
      }
    } else {
      if (gameState.currentArea !== AREAS.GARDEN) {
        return createAction(39, 'ArrowRight');
      }
      return createAction(90, 'z');
    }
  }
  
  if (gameState.currentArea !== AREAS.CAMPFIRE) {
    return createAction(39, 'ArrowRight');
  }
  
  return createAction(90, 'z');
}

// Random action for fallback
function getRandomAction(gameState) {
  const actions = [
    createAction(32, ' '),
    createAction(39, 'ArrowRight'),
    createAction(90, 'z')
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

// Main export function
export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getWinStrategyAction(gameState);
    case "TEST_3":
      return getFishingTestAction(gameState);
    case "TEST_4":
      return getGardenTestAction(gameState);
    case "TEST_5":
      return getCampfireTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;