// input_handler.js - Input handling

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import { 
  createRecipe, 
  addIngredientToRecipe, 
  cancelRecipeInProgress, 
  assignRecipeToMenu,
  serveNextWaitingCustomer,
  purchaseIngredient
} from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

let p5Instance = null;

export function initInputHandler(p) {
  p5Instance = p;
}

export function handleInput(p) {
  if (!p5Instance) p5Instance = p;
  
  let action = null;
  
  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    // Human input - handled via keyPressed
    return;
  } else {
    // Automated testing input
    action = get_automated_testing_action(gameState);
  }
  
  if (action) {
    processAction(action, p);
  }
  
  gameState.framesSinceLastInput++;
}

export function processKeyPress(keyCode, p) {
  if (!p5Instance) p5Instance = p;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: {key: p.key, keyCode: keyCode},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.lastKeyPressed = keyCode;
  gameState.framesSinceLastInput = 0;
  
  // Game phase transitions
  if (gameState.gamePhase === GAME_PHASES.START && keyCode === 13) { // ENTER
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: {phase: "PLAYING"},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && keyCode === 27) { // ESC
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: {phase: "PAUSED"},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED && keyCode === 27) { // ESC
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: {phase: "PLAYING"},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if ((gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
       gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) && keyCode === 82) { // R
    gameState.gamePhase = GAME_PHASES.START;
    p.logs.game_info.push({
      data: {phase: "START"},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    processGameplayInput(keyCode, p);
  }
}

export function processGameplayInput(keyCode, p) {
  // Shift - Toggle view
  if (keyCode === 16) {
    gameState.currentView = gameState.currentView === "CAFE" ? "RECIPE_LAB" : "CAFE";
    gameState.selectedMenuIndex = 0;
    return;
  }
  
  if (gameState.currentView === "CAFE") {
    processCafeInput(keyCode, p);
  } else if (gameState.currentView === "RECIPE_LAB") {
    processRecipeLabInput(keyCode, p);
  }
}

export function processCafeInput(keyCode, p) {
  // Space - Serve customer
  if (keyCode === 32) {
    serveNextWaitingCustomer();
  }
  
  // Arrow keys - Select menu slot (for future use)
  if (keyCode === 37) { // Left
    gameState.selectedMenuIndex = Math.max(0, gameState.selectedMenuIndex - 1);
  }
  if (keyCode === 39) { // Right
    gameState.selectedMenuIndex = Math.min(3, gameState.selectedMenuIndex + 1);
  }
}

export function processRecipeLabInput(keyCode, p) {
  const maxIndex = gameState.unlockedIngredients.length - 1;
  
  // Arrow keys - Navigate ingredients
  if (keyCode === 37) { // Left
    gameState.selectedMenuIndex = Math.max(0, gameState.selectedMenuIndex - 1);
  }
  if (keyCode === 39) { // Right
    gameState.selectedMenuIndex = Math.min(maxIndex, gameState.selectedMenuIndex + 1);
  }
  if (keyCode === 38) { // Up
    gameState.selectedMenuIndex = Math.max(0, gameState.selectedMenuIndex - 5);
  }
  if (keyCode === 40) { // Down
    gameState.selectedMenuIndex = Math.min(maxIndex, gameState.selectedMenuIndex + 5);
  }
  
  // Space - Add ingredient or finalize recipe
  if (keyCode === 32) {
    if (gameState.recipeInProgress.active && gameState.recipeInProgress.ingredients.length > 0) {
      // Finalize recipe
      const recipe = createRecipe();
      if (recipe) {
        // Auto-assign to first empty slot
        for (let i = 0; i < gameState.menuSlots.length; i++) {
          if (gameState.menuSlots[i] === null) {
            assignRecipeToMenu(recipe, i);
            break;
          }
        }
      }
    } else {
      // Add ingredient
      const ingredient = gameState.unlockedIngredients[gameState.selectedMenuIndex];
      if (ingredient) {
        addIngredientToRecipe(ingredient);
      }
    }
  }
  
  // Z - Cancel recipe
  if (keyCode === 90) {
    cancelRecipeInProgress();
  }
}

export function processAction(action, p) {
  if (!action || !action.keyCode) return;
  
  processKeyPress(action.keyCode, p);
}