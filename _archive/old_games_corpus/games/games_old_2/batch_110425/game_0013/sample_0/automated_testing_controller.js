// automated_testing_controller.js - Automated testing

import { gameState, INGREDIENT_DATA } from './globals.js';

let testState = {
  lastAction: null,
  actionCounter: 0,
  stateHistory: []
};

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  
  // Track state to prevent loops
  testState.actionCounter++;
  
  // Strategy: Create high-quality burgers and serve customers efficiently
  
  // If we have customers and a burger, serve them
  if (gameState.menuState === "SERVE" && 
      gameState.customers.length > 0 && 
      gameState.currentBurger.quality > 0) {
    return { keyCode: 32, key: ' ' }; // Serve
  }
  
  // If creating burger, add good ingredients
  if (gameState.menuState === "CREATE_BURGER") {
    const ingredientList = gameState.ingredients.filter(ing => ing.quantity > 0);
    
    if (gameState.currentBurger.ingredients.length < 5 && ingredientList.length > 0) {
      // Prioritize high-quality ingredients
      const goodIngredients = ["BACON", "EGG", "FISH", "TARTAR", "AVOCADO", "MUSHROOM"];
      const hasGood = ingredientList.find(ing => goodIngredients.includes(ing.type));
      
      if (hasGood) {
        const index = ingredientList.indexOf(hasGood);
        if (index !== gameState.selectedIndex) {
          return { keyCode: index > gameState.selectedIndex ? 40 : 38, key: 'ArrowDown' };
        }
        return { keyCode: 32, key: ' ' }; // Add ingredient
      } else {
        // Add any available ingredient
        return { keyCode: 32, key: ' ' };
      }
    } else {
      // Done creating burger
      return { keyCode: 27, key: 'Escape' }; // Back to main
    }
  }
  
  // Main menu logic
  if (gameState.menuState === "MAIN") {
    // Check if we can expand
    if (gameState.branches < 3) {
      const cost = 200 + (gameState.branches - 1) * 150;
      const reputationRequired = 60 + (gameState.branches - 1) * 20;
      
      if (gameState.money >= cost && gameState.reputation >= reputationRequired) {
        if (gameState.selectedIndex !== 3) {
          return { keyCode: gameState.selectedIndex < 3 ? 40 : 38, key: 'ArrowDown' };
        }
        return { keyCode: 32, key: ' ' }; // Expand
      }
    }
    
    // Priority: Serve > Create > Shop
    if (gameState.customers.length > 0 && gameState.currentBurger.quality > 0) {
      if (gameState.selectedIndex !== 1) {
        return { keyCode: gameState.selectedIndex < 1 ? 40 : 38, key: 'ArrowDown' };
      }
      return { keyCode: 32, key: ' ' }; // Serve
    }
    
    if (gameState.currentBurger.quality === 0) {
      // Need to create burger
      if (gameState.selectedIndex !== 0) {
        return { keyCode: 38, key: 'ArrowUp' };
      }
      return { keyCode: 32, key: ' ' }; // Create
    }
    
    // Buy ingredients if low
    const lowStock = gameState.ingredients.filter(ing => ing.quantity < 3);
    if (lowStock.length > 0 && gameState.money > 50) {
      if (gameState.selectedIndex !== 2) {
        return { keyCode: gameState.selectedIndex < 2 ? 40 : 38, key: 'ArrowDown' };
      }
      return { keyCode: 32, key: ' ' }; // Shop
    }
    
    // Default: Create burger
    if (gameState.selectedIndex !== 0) {
      return { keyCode: 38, key: 'ArrowUp' };
    }
    return { keyCode: 32, key: ' ' };
  }
  
  // Expand menu
  if (gameState.menuState === "EXPAND") {
    return { keyCode: 32, key: ' ' }; // Try to expand
  }
  
  // Shop menu
  if (gameState.menuState === "SHOP") {
    // Buy ingredients
    if (gameState.selectedIndex < gameState.unlockedIngredients.length) {
      return { keyCode: 32, key: ' ' };
    }
    return { keyCode: 27, key: 'Escape' };
  }
  
  return { keyCode: 32, key: ' ' };
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 32, key: ' ' },
    { keyCode: 27, key: 'Escape' }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getBasicTestAction(gameState) {
  // Basic testing: cycle through menus and test interactions
  
  if (gameState.menuState === "MAIN") {
    if (testState.actionCounter % 60 < 15) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else if (testState.actionCounter % 60 < 20) {
      return { keyCode: 32, key: ' ' };
    }
  }
  
  if (gameState.menuState !== "MAIN") {
    if (testState.actionCounter % 40 < 10) {
      return { keyCode: 32, key: ' ' };
    } else if (testState.actionCounter % 40 < 20) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else {
      return { keyCode: 27, key: 'Escape' };
    }
  }
  
  testState.actionCounter++;
  return { keyCode: 32, key: ' ' };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;