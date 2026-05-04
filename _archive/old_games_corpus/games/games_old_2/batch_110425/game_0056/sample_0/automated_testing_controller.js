// automated_testing_controller.js
import { gameState } from './globals.js';

let testState = {
  phase: "INIT",
  actionQueue: [],
  waitFrames: 0,
  lastMoney: 0,
  stuckCounter: 0,
  ingredientsPurchased: false,
  recipeCreated: false,
  staffHired: false
};

function resetTestState() {
  testState = {
    phase: "INIT",
    actionQueue: [],
    waitFrames: 0,
    lastMoney: 0,
    stuckCounter: 0,
    ingredientsPurchased: false,
    recipeCreated: false,
    staffHired: false
  };
}

function getTestBasicAction(gameState) {
  // Simple navigation test
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Navigate through menus systematically
  if (gameState.currentMenu === "MAIN") {
    if (gameState.selectedIndex < 3) {
      testState.waitFrames = 10;
      return 40; // DOWN
    } else {
      testState.waitFrames = 10;
      return 32; // SPACE to enter serve menu
    }
  } else if (gameState.currentMenu === "INGREDIENTS") {
    if (!testState.ingredientsPurchased) {
      if (gameState.money >= 5) {
        testState.ingredientsPurchased = true;
        testState.waitFrames = 10;
        return 32; // SPACE to buy
      }
    }
    testState.waitFrames = 10;
    return 90; // Z to go back
  } else if (gameState.currentMenu === "RECIPES") {
    if (gameState.subMenu === null) {
      testState.waitFrames = 10;
      return 32; // SPACE to create
    } else if (gameState.subMenu === "CREATE") {
      if (gameState.selectedIngredients.length < 1) {
        testState.waitFrames = 10;
        return 32; // SPACE to select ingredient
      } else {
        testState.waitFrames = 10;
        return 90; // Z to go back
      }
    }
  } else if (gameState.currentMenu === "STAFF") {
    if (!testState.staffHired && gameState.money >= 20) {
      testState.staffHired = true;
      testState.waitFrames = 10;
      return 32; // SPACE to hire
    }
    testState.waitFrames = 10;
    return 90; // Z to go back
  } else {
    testState.waitFrames = 10;
    return 90; // Z to go back
  }
  
  return null;
}

function getTestWinAction(gameState) {
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Phase-based strategy for winning
  switch (testState.phase) {
    case "INIT":
      testState.phase = "BUY_INGREDIENTS";
      testState.waitFrames = 5;
      return null;
      
    case "BUY_INGREDIENTS":
      if (gameState.currentMenu === "MAIN") {
        testState.waitFrames = 5;
        return 32; // Select first option (Ingredients)
      } else if (gameState.currentMenu === "INGREDIENTS") {
        // Buy diverse ingredients
        const ingredient = gameState.availableIngredients[gameState.selectedIndex];
        if (ingredient && gameState.money >= ingredient.cost) {
          const owned = gameState.ownedIngredients.find(o => o.id === ingredient.id);
          const ownedCount = owned ? owned.quantity : 0;
          
          if (ownedCount < 3) {
            testState.waitFrames = 3;
            return 32; // SPACE to buy
          }
        }
        
        // Move to next ingredient or go back if done
        if (gameState.selectedIndex < gameState.availableIngredients.length - 1) {
          testState.waitFrames = 3;
          return 40; // DOWN
        } else {
          // Done buying, go to recipes
          testState.phase = "CREATE_RECIPES";
          testState.waitFrames = 5;
          return 90; // Z to go back
        }
      }
      break;
      
    case "CREATE_RECIPES":
      if (gameState.currentMenu === "MAIN") {
        gameState.selectedIndex = 1; // Move to recipes
        testState.waitFrames = 5;
        return 32; // SPACE
      } else if (gameState.currentMenu === "RECIPES") {
        if (gameState.subMenu === null) {
          if (gameState.recipes.length < 5 && gameState.ownedIngredients.some(i => i.quantity > 0)) {
            testState.waitFrames = 5;
            return 32; // SPACE to create
          } else {
            // Done creating recipes, hire staff
            testState.phase = "HIRE_STAFF";
            testState.waitFrames = 5;
            return 90; // Z
          }
        } else if (gameState.subMenu === "CREATE") {
          const availableIngredients = gameState.ownedIngredients.filter(i => i.quantity > 0);
          
          if (gameState.selectedIngredients.length < 3 && availableIngredients.length > 0) {
            // Select ingredient
            const targetIndex = Math.min(gameState.selectedIndex, availableIngredients.length - 1);
            if (gameState.selectedIndex !== targetIndex) {
              return gameState.selectedIndex < targetIndex ? 40 : 38; // DOWN or UP
            }
            testState.waitFrames = 3;
            return 32; // SPACE to add ingredient
          } else {
            // Finalize recipe (3 ingredients selected or no more available)
            testState.waitFrames = 5;
            return 90; // Z to go back and save
          }
        }
      }
      break;
      
    case "HIRE_STAFF":
      if (gameState.currentMenu === "MAIN") {
        gameState.selectedIndex = 2; // Move to staff
        testState.waitFrames = 5;
        return 32; // SPACE
      } else if (gameState.currentMenu === "STAFF") {
        if (gameState.money >= 20 && gameState.staff.length < 3) {
          testState.waitFrames = 5;
          return 32; // SPACE to hire
        } else {
          // Done hiring, start serving
          testState.phase = "SERVE_CUSTOMERS";
          testState.waitFrames = 5;
          return 90; // Z
        }
      }
      break;
      
    case "SERVE_CUSTOMERS":
      if (gameState.currentMenu === "MAIN") {
        gameState.selectedIndex = 3; // Move to serve
        testState.waitFrames = 5;
        return 32; // SPACE
      } else if (gameState.currentMenu === "SERVE") {
        if (gameState.subMenu === null) {
          if (gameState.customers.length > 0) {
            testState.waitFrames = 5;
            return 32; // SPACE to select customer
          } else {
            // No customers, check if need more ingredients
            if (gameState.money >= 50 && gameState.ownedIngredients.filter(i => i.quantity > 0).length < 3) {
              testState.phase = "BUY_INGREDIENTS";
              testState.waitFrames = 5;
              return 90; // Z
            }
            testState.waitFrames = 20;
            return null; // Wait for customers
          }
        } else if (gameState.subMenu === "SELECT_RECIPE") {
          if (gameState.recipes.length > 0) {
            // Select best recipe (highest quality)
            const bestRecipeIndex = gameState.recipes.reduce((bestIdx, recipe, idx, arr) => {
              return recipe.quality > arr[bestIdx].quality ? idx : bestIdx;
            }, 0);
            
            if (gameState.selectedIndex !== bestRecipeIndex) {
              return gameState.selectedIndex < bestRecipeIndex ? 40 : 38; // DOWN or UP
            }
            
            testState.waitFrames = 5;
            return 32; // SPACE to serve
          }
        }
      }
      
      // Check if we need to buy more ingredients periodically
      if (gameState.money >= 100 && gameState.ownedIngredients.filter(i => i.quantity > 0).length < 5) {
        testState.phase = "BUY_INGREDIENTS";
      }
      break;
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [38, 40, 32, 90]; // UP, DOWN, SPACE, Z
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.gamePhase !== "PLAYING") {
    resetTestState();
    return null;
  }
  
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