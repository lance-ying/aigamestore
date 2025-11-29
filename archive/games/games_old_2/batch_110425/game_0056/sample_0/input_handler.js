// input_handler.js
import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import { purchaseIngredient, createRecipe, hireStaff, serveCustomer } from './game_logic.js';

export function handleKeyPress(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions (handled in game.js)
  if (keyCode === 13) return; // ENTER
  if (keyCode === 27) return; // ESC
  if (keyCode === 82) return; // R
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.controlMode !== CONTROL_MODES.HUMAN) return;
  
  handleGameplayInput(keyCode);
}

export function handleGameplayInput(keyCode) {
  const UP = 38, DOWN = 40, LEFT = 37, RIGHT = 39, SPACE = 32, Z = 90;
  
  if (gameState.currentMenu === "MAIN") {
    handleMainMenu(keyCode, UP, DOWN, SPACE);
  } else if (gameState.currentMenu === "INGREDIENTS") {
    handleIngredientsMenu(keyCode, UP, DOWN, SPACE, Z);
  } else if (gameState.currentMenu === "RECIPES") {
    handleRecipesMenu(keyCode, UP, DOWN, SPACE, Z);
  } else if (gameState.currentMenu === "STAFF") {
    handleStaffMenu(keyCode, UP, DOWN, SPACE, Z);
  } else if (gameState.currentMenu === "SERVE") {
    handleServeMenu(keyCode, UP, DOWN, LEFT, RIGHT, SPACE, Z);
  }
}

function handleMainMenu(keyCode, UP, DOWN, SPACE) {
  if (keyCode === UP) {
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
  } else if (keyCode === DOWN) {
    gameState.selectedIndex = Math.min(3, gameState.selectedIndex + 1);
  } else if (keyCode === SPACE) {
    const menus = ["INGREDIENTS", "RECIPES", "STAFF", "SERVE"];
    gameState.currentMenu = menus[gameState.selectedIndex];
    gameState.selectedIndex = 0;
    gameState.subMenu = null;
  }
}

function handleIngredientsMenu(keyCode, UP, DOWN, SPACE, Z) {
  if (keyCode === Z) {
    gameState.currentMenu = "MAIN";
    gameState.selectedIndex = 0;
    return;
  }
  
  if (keyCode === UP) {
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
  } else if (keyCode === DOWN) {
    gameState.selectedIndex = Math.min(gameState.availableIngredients.length - 1, gameState.selectedIndex + 1);
  } else if (keyCode === SPACE) {
    const ingredient = gameState.availableIngredients[gameState.selectedIndex];
    purchaseIngredient(ingredient);
  }
}

function handleRecipesMenu(keyCode, UP, DOWN, SPACE, Z) {
  if (!gameState.subMenu) {
    if (keyCode === Z) {
      gameState.currentMenu = "MAIN";
      gameState.selectedIndex = 0;
      gameState.selectedIngredients = [];
      return;
    }
    
    if (keyCode === SPACE) {
      gameState.subMenu = "CREATE";
      gameState.selectedIndex = 0;
      gameState.selectedIngredients = [];
    }
  } else if (gameState.subMenu === "CREATE") {
    if (keyCode === Z) {
      if (gameState.selectedIngredients.length > 0) {
        gameState.selectedIngredients.pop();
      } else {
        gameState.subMenu = null;
        gameState.selectedIndex = 0;
      }
      return;
    }
    
    if (keyCode === UP) {
      gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    } else if (keyCode === DOWN) {
      gameState.selectedIndex = Math.min(gameState.ownedIngredients.length - 1, gameState.selectedIndex + 1);
    } else if (keyCode === SPACE) {
      const ingredient = gameState.ownedIngredients[gameState.selectedIndex];
      if (ingredient && ingredient.quantity > 0 && gameState.selectedIngredients.length < 3) {
        gameState.selectedIngredients.push(ingredient);
        
        if (gameState.selectedIngredients.length === 3) {
          createRecipe(gameState.selectedIngredients);
          gameState.selectedIngredients = [];
          gameState.subMenu = null;
          gameState.selectedIndex = 0;
        }
      }
    }
  }
}

function handleStaffMenu(keyCode, UP, DOWN, SPACE, Z) {
  if (keyCode === Z) {
    gameState.currentMenu = "MAIN";
    gameState.selectedIndex = 0;
    return;
  }
  
  if (keyCode === UP) {
    gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
  } else if (keyCode === DOWN) {
    gameState.selectedIndex = Math.min(gameState.availableApplicants.length - 1, gameState.selectedIndex + 1);
  } else if (keyCode === SPACE) {
    const applicant = gameState.availableApplicants[gameState.selectedIndex];
    if (applicant) {
      hireStaff(applicant);
      gameState.selectedIndex = 0;
    }
  }
}

function handleServeMenu(keyCode, UP, DOWN, LEFT, RIGHT, SPACE, Z) {
  if (keyCode === Z) {
    gameState.currentMenu = "MAIN";
    gameState.selectedIndex = 0;
    gameState.subMenu = null;
    return;
  }
  
  if (!gameState.subMenu) {
    // Select customer
    if (keyCode === UP) {
      gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    } else if (keyCode === DOWN) {
      gameState.selectedIndex = Math.min(gameState.customers.length - 1, gameState.selectedIndex + 1);
    } else if (keyCode === SPACE && gameState.customers.length > 0) {
      gameState.subMenu = "SELECT_RECIPE";
      gameState.selectedIndex = 0;
    }
  } else if (gameState.subMenu === "SELECT_RECIPE") {
    // Select recipe to serve
    if (keyCode === Z) {
      gameState.subMenu = null;
      gameState.selectedIndex = 0;
      return;
    }
    
    if (keyCode === UP) {
      gameState.selectedIndex = Math.max(0, gameState.selectedIndex - 1);
    } else if (keyCode === DOWN) {
      gameState.selectedIndex = Math.min(gameState.recipes.length - 1, gameState.selectedIndex + 1);
    } else if (keyCode === SPACE && gameState.recipes.length > 0) {
      const customer = gameState.customers[0]; // Serve first waiting customer
      const recipe = gameState.recipes[gameState.selectedIndex];
      if (customer && recipe) {
        serveCustomer(customer, recipe);
        gameState.subMenu = null;
        gameState.selectedIndex = 0;
      }
    }
  }
}