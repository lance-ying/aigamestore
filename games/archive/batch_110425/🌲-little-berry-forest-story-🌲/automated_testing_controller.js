// automated_testing_controller.js - Automated testing strategies

import { gameState, CHARACTER_DEFS, RECIPES, DISHES_TO_WIN, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { vx: 0, vy: 0, sprint: false, space: false, z: false };
  
  // Close cooking menu if open
  if (gameState.showCookingMenu) {
    if (gameState.cookedDishes.length < DISHES_TO_WIN) {
      // Try to cook if we have recipes
      if (gameState.unlockedRecipes.length > 0) {
        return { vx: 0, vy: 0, sprint: false, space: true, z: false };
      }
    }
    // Close menu
    return { vx: 0, vy: 0, sprint: false, space: false, z: true };
  }
  
  // Priority 1: Interact with characters
  for (let char of gameState.characters) {
    if (!char.interacted) {
      const dx = char.x - player.x;
      const dy = char.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        return { vx: 0, vy: 0, sprint: false, space: true, z: false };
      }
      
      // Move towards character
      const vx = dx / dist;
      const vy = dy / dist;
      return { vx, vy, sprint: true, space: false, z: false };
    }
  }
  
  // Priority 2: Collect ingredients if we don't have enough
  const needsIngredients = gameState.unlockedRecipes.some(recipeId => {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || gameState.cookedDishes.includes(recipeId)) return false;
    
    return Object.entries(recipe.ingredients).some(([item, count]) => {
      return gameState.inventory[item] < count;
    });
  });
  
  if (needsIngredients) {
    for (let ingredient of gameState.ingredients) {
      if (!ingredient.collected) {
        const dx = ingredient.x - player.x;
        const dy = ingredient.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
          return { vx: 0, vy: 0, sprint: false, space: true, z: false };
        }
        
        // Move towards ingredient
        const vx = dx / dist;
        const vy = dy / dist;
        return { vx, vy, sprint: true, space: false, z: false };
      }
    }
  }
  
  // Priority 3: Go to cooking station and cook
  if (gameState.cookedDishes.length < DISHES_TO_WIN && gameState.unlockedRecipes.length > 0) {
    const station = gameState.cookingStation;
    if (station) {
      const dx = station.x - player.x;
      const dy = station.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        // Open cooking menu
        return { vx: 0, vy: 0, sprint: false, space: false, z: true };
      }
      
      // Move towards station
      const vx = dx / dist;
      const vy = dy / dist;
      return { vx, vy, sprint: true, space: false, z: false };
    }
  }
  
  // Default: explore
  return getRandomAction(gameState);
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { vx: 0, vy: 0, sprint: false, space: false, z: false };
  
  // Simple movement test
  const time = gameState.frameCount;
  
  if (time % 240 < 60) {
    return { vx: 1, vy: 0, sprint: false, space: false, z: false };
  } else if (time % 240 < 120) {
    return { vx: 0, vy: 1, sprint: false, space: false, z: false };
  } else if (time % 240 < 180) {
    return { vx: -1, vy: 0, sprint: false, space: false, z: false };
  } else {
    return { vx: 0, vy: -1, sprint: false, space: false, z: false };
  }
}

function getRecipeTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { vx: 0, vy: 0, sprint: false, space: false, z: false };
  
  // Test recipe and cooking mechanics
  if (gameState.showCookingMenu) {
    // Try to cook
    return { vx: 0, vy: 0, sprint: false, space: true, z: false };
  }
  
  // Collect ingredients
  for (let ingredient of gameState.ingredients) {
    if (!ingredient.collected && gameState.inventory[ingredient.type] < 5) {
      const dx = ingredient.x - player.x;
      const dy = ingredient.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        return { vx: 0, vy: 0, sprint: false, space: true, z: false };
      }
      
      const vx = dx / dist;
      const vy = dy / dist;
      return { vx, vy, sprint: false, space: false, z: false };
    }
  }
  
  // Go to cooking station
  const station = gameState.cookingStation;
  if (station) {
    const dx = station.x - player.x;
    const dy = station.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 40) {
      return { vx: 0, vy: 0, sprint: false, space: false, z: true };
    }
    
    const vx = dx / dist;
    const vy = dy / dist;
    return { vx, vy, sprint: false, space: false, z: false };
  }
  
  return { vx: 0, vy: 0, sprint: false, space: false, z: false };
}

function getMiniGameTestAction(gameState) {
  // Test mini-game functionality (if implemented)
  return getRandomAction(gameState);
}

function getRandomAction(gameState) {
  const actions = [
    { vx: 1, vy: 0, sprint: false, space: false, z: false },
    { vx: -1, vy: 0, sprint: false, space: false, z: false },
    { vx: 0, vy: 1, sprint: false, space: false, z: false },
    { vx: 0, vy: -1, sprint: false, space: false, z: false },
    { vx: 0, vy: 0, sprint: false, space: true, z: false }
  ];
  
  // Use frame count for pseudo-random but deterministic behavior
  const index = Math.floor((gameState.frameCount / 30)) % actions.length;
  return actions[index];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRecipeTestAction(gameState);
    case "TEST_4":
      return getMiniGameTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;