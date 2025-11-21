// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { initializeGame, addIngredientToBurger, removeLastIngredient, serveBurgerToCustomer, buyIngredient, expandBusiness } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      initializeGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Return to main menu from sub-menus
      if (gameState.menuState !== "MAIN") {
        gameState.menuState = "MAIN";
        gameState.selectedIndex = 0;
      }
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.menuState = "MAIN";
      gameState.selectedIndex = 0;
      
      p.logs.game_info.push({
        data: { phase: "START", event: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const currentFrame = p.frameCount;
  
  // Prevent rapid inputs
  if (currentFrame - gameState.lastActionFrame < 10) {
    return;
  }
  
  switch (gameState.menuState) {
    case "MAIN":
      handleMainMenuInput(keyCode);
      break;
    case "CREATE_BURGER":
      handleCreateBurgerInput(keyCode);
      break;
    case "SERVE":
      handleServeInput(keyCode);
      break;
    case "SHOP":
      handleShopInput(keyCode);
      break;
    case "EXPAND":
      handleExpandInput(keyCode);
      break;
  }
}

function handleMainMenuInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedIndex = Math.min(3, gameState.selectedIndex + 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 32) { // SPACE
    switch (gameState.selectedIndex) {
      case 0:
        gameState.menuState = "CREATE_BURGER";
        gameState.selectedIndex = 0;
        break;
      case 1:
        gameState.menuState = "SERVE";
        gameState.selectedIndex = 0;
        break;
      case 2:
        gameState.menuState = "SHOP";
        gameState.selectedIndex = 0;
        break;
      case 3:
        gameState.menuState = "EXPAND";
        gameState.selectedIndex = 0;
        break;
    }
    gameState.lastActionFrame = gameState.frameCount;
  }
}

function handleCreateBurgerInput(keyCode) {
  const ingredientList = gameState.ingredients.filter(ing => ing.quantity > 0);
  
  if (keyCode === 38) { // UP
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedIndex = Math.min(ingredientList.length - 1, gameState.selectedIndex + 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 32) { // SPACE - Add ingredient
    if (gameState.selectedIndex < ingredientList.length) {
      const ing = ingredientList[gameState.selectedIndex];
      addIngredientToBurger(ing.type);
      gameState.lastActionFrame = gameState.frameCount;
    }
  } else if (keyCode === 90) { // Z - Remove last
    removeLastIngredient();
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 27) { // ESC - Back
    gameState.menuState = "MAIN";
    gameState.selectedIndex = 0;
    gameState.lastActionFrame = gameState.frameCount;
  }
}

function handleServeInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedIndex = Math.min(gameState.customers.length - 1, gameState.selectedIndex + 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 37) { // LEFT
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedIndex = Math.min(gameState.customers.length - 1, gameState.selectedIndex + 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 32) { // SPACE - Serve
    if (serveBurgerToCustomer(gameState.selectedIndex)) {
      gameState.lastActionFrame = gameState.frameCount;
    }
  } else if (keyCode === 27) { // ESC - Back
    gameState.menuState = "MAIN";
    gameState.selectedIndex = 0;
    gameState.lastActionFrame = gameState.frameCount;
  }
}

function handleShopInput(keyCode) {
  const buyableIngredients = Object.keys(gameState.unlockedIngredients).filter(key => {
    return gameState.unlockedIngredients.includes(key);
  });
  
  if (keyCode === 38) { // UP
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedIndex = Math.min(buyableIngredients.length - 1, gameState.selectedIndex + 1);
    gameState.lastActionFrame = gameState.frameCount;
  } else if (keyCode === 32) { // SPACE - Buy
    if (gameState.selectedIndex < gameState.unlockedIngredients.length) {
      const ingType = gameState.unlockedIngredients[gameState.selectedIndex];
      buyIngredient(ingType, 5);
      gameState.lastActionFrame = gameState.frameCount;
    }
  } else if (keyCode === 27) { // ESC - Back
    gameState.menuState = "MAIN";
    gameState.selectedIndex = 0;
    gameState.lastActionFrame = gameState.frameCount;
  }
}

function handleExpandInput(keyCode) {
  if (keyCode === 32) { // SPACE - Expand
    if (expandBusiness()) {
      gameState.lastActionFrame = gameState.frameCount;
    }
  } else if (keyCode === 27) { // ESC - Back
    gameState.menuState = "MAIN";
    gameState.selectedIndex = 0;
    gameState.lastActionFrame = gameState.frameCount;
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const action = get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    handleKeyPress(p, action.key, action.keyCode);
  }
}