// input.js - Input handling for all game phases

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initializeGameState } from './globals.js';
import { createRecipe, addRecipe, unlockIngredient } from './recipe.js';
import { placeFurniture, FURNITURE_TYPES } from './furniture.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: 'game_started' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      initializeGameState();
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: 'game_restarted' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Playing phase controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handlePlayingInput(p, key, keyCode);
  }
}

function handlePlayingInput(p, key, keyCode) {
  // Shift - Toggle menu
  if (keyCode === 16) {
    gameState.menuOpen = !gameState.menuOpen;
    if (gameState.menuOpen) {
      gameState.menuType = null;
      gameState.cursorX = 0;
      gameState.cursorY = 0;
    }
    return;
  }
  
  if (gameState.menuOpen) {
    handleMenuInput(p, keyCode);
  } else {
    handleGameplayInput(p, keyCode);
  }
}

function handleMenuInput(p, keyCode) {
  // Z - Back/Cancel
  if (keyCode === 90) {
    if (gameState.menuType !== null) {
      // Clear selections when going back
      if (gameState.menuType === 'RECIPE') {
        gameState.selectedIngredients = [];
      }
      gameState.menuType = null;
      gameState.cursorY = 0;
    } else {
      gameState.menuOpen = false;
    }
    return;
  }
  
  // Navigation
  if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    if (gameState.menuType === null) {
      gameState.cursorY = Math.min(2, gameState.cursorY + 1);
    } else if (gameState.menuType === 'RECIPE') {
      const maxY = gameState.ingredients.filter(ing => ing.unlocked).length - 1;
      gameState.cursorY = Math.min(maxY, gameState.cursorY + 1);
    } else if (gameState.menuType === 'FURNITURE') {
      const maxY = FURNITURE_TYPES.filter(f => f.unlocked).length - 1;
      gameState.cursorY = Math.min(maxY, gameState.cursorY + 1);
    }
  }
  
  // Space - Select
  if (keyCode === 32) {
    if (gameState.menuType === null) {
      // Main menu selection
      if (gameState.cursorY === 0) {
        gameState.menuType = 'RECIPE';
        gameState.cursorY = 0;
      } else if (gameState.cursorY === 1) {
        gameState.menuType = 'FURNITURE';
        gameState.cursorY = 0;
      } else if (gameState.cursorY === 2) {
        gameState.menuType = 'STATS';
        gameState.cursorY = 0;
      }
    } else if (gameState.menuType === 'RECIPE') {
      handleRecipeMenuSelect(p);
    } else if (gameState.menuType === 'FURNITURE') {
      handleFurnitureMenuSelect(p);
    }
  }
}

function handleRecipeMenuSelect(p) {
  const ingredients = gameState.ingredients.filter(ing => ing.unlocked);
  if (gameState.cursorY < ingredients.length) {
    const ingredient = ingredients[gameState.cursorY];
    const index = gameState.selectedIngredients.indexOf(ingredient.id);
    
    if (index > -1) {
      gameState.selectedIngredients.splice(index, 1);
    } else if (gameState.selectedIngredients.length < 3) {
      gameState.selectedIngredients.push(ingredient.id);
    }
  } else {
    // Create recipe
    if (gameState.selectedIngredients.length > 0) {
      const recipe = createRecipe(gameState.selectedIngredients);
      if (recipe) {
        addRecipe(recipe);
        gameState.selectedIngredients = [];
        gameState.menuType = null;
      }
    }
  }
}

function handleFurnitureMenuSelect(p) {
  const furniture = FURNITURE_TYPES.filter(f => f.unlocked);
  if (gameState.cursorY < furniture.length) {
    const selected = furniture[gameState.cursorY];
    gameState.selectedFurnitureType = selected.id;
    gameState.menuOpen = false;
    gameState.cursorX = 0;
    gameState.cursorY = 0;
  }
}

function handleGameplayInput(p, keyCode) {
  // If furniture placement mode
  if (gameState.selectedFurnitureType) {
    handleFurniturePlacement(p, keyCode);
    return;
  }
  
  // Space - Serve customer
  if (keyCode === 32) {
    serveNearestCustomer();
    return;
  }
  
  // Z - Cancel selections
  if (keyCode === 90) {
    gameState.selectedCustomer = null;
    gameState.selectedFurnitureType = null;
    return;
  }
}

function handleFurniturePlacement(p, keyCode) {
  const furn = FURNITURE_TYPES.find(f => f.id === gameState.selectedFurnitureType);
  if (!furn) return;
  
  // Arrow navigation
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(10 - furn.width, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(8 - furn.height, gameState.cursorY + 1);
  }
  
  // Space - Place
  if (keyCode === 32) {
    const placed = placeFurniture(furn, gameState.cursorX, gameState.cursorY);
    if (placed) {
      gameState.selectedFurnitureType = null;
    }
  }
  
  // Z - Cancel
  if (keyCode === 90) {
    gameState.selectedFurnitureType = null;
  }
}

function serveNearestCustomer() {
  if (gameState.customers.length === 0 || gameState.recipes.length === 0) {
    return;
  }
  
  // Get first waiting customer
  const customer = gameState.customers.find(c => !c.served);
  if (!customer) return;
  
  // Find best recipe for customer
  const bestRecipe = findBestRecipe(customer);
  if (bestRecipe && gameState.money >= bestRecipe.cost) {
    gameState.money -= bestRecipe.cost;
    customer.serve(bestRecipe);
  }
}

function findBestRecipe(customer) {
  let bestRecipe = null;
  let bestScore = -1;
  
  for (const recipe of gameState.recipes) {
    // Score based on quality match
    const qualityDiff = Math.abs(recipe.quality - customer.preferredQuality);
    const score = 10 - qualityDiff;
    
    if (score > bestScore) {
      bestScore = score;
      bestRecipe = recipe;
    }
  }
  
  return bestRecipe;
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  const action = window.get_automated_testing_action(gameState);
  if (action && action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}