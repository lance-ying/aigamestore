// automated_testing_controller.js - Automated testing AI

import { gameState, PHASE_PLAYING } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Priority 1: Open menu if we need to create recipes or have lots of money
  if (!gameState.menuOpen) {
    if (gameState.recipes.length < 3 || gameState.money > 150) {
      return { key: 'Shift', keyCode: 16 };
    }
  }
  
  // Priority 2: In menu, create recipes
  if (gameState.menuOpen) {
    if (gameState.menuType === null) {
      // Select recipe creation
      if (gameState.recipes.length < 5 && gameState.cursorY !== 0) {
        return { key: 'ArrowUp', keyCode: 38 };
      }
      if (gameState.recipes.length < 5 && gameState.cursorY === 0) {
        return { key: ' ', keyCode: 32 };
      }
      // Select furniture if we have money
      if (gameState.money > 100 && gameState.furniture.length < 5) {
        if (gameState.cursorY !== 1) {
          return { key: 'ArrowDown', keyCode: 40 };
        } else {
          return { key: ' ', keyCode: 32 };
        }
      }
      // Exit menu
      return { key: 'z', keyCode: 90 };
    }
    
    if (gameState.menuType === 'RECIPE') {
      const unlockedIngredients = gameState.ingredients.filter(ing => ing.unlocked);
      
      // Select ingredients
      if (gameState.selectedIngredients.length < 2) {
        if (gameState.cursorY < unlockedIngredients.length - 1) {
          // Select current ingredient
          const ing = unlockedIngredients[gameState.cursorY];
          if (!gameState.selectedIngredients.includes(ing.id)) {
            return { key: ' ', keyCode: 32 };
          } else {
            return { key: 'ArrowDown', keyCode: 40 };
          }
        }
      }
      
      // Create recipe if we have enough ingredients
      if (gameState.selectedIngredients.length >= 2) {
        return { key: ' ', keyCode: 32 };
      }
      
      return { key: 'z', keyCode: 90 };
    }
    
    if (gameState.menuType === 'FURNITURE') {
      const unlockedFurniture = gameState.ingredients.filter(f => f.unlocked);
      
      // Select first furniture type
      if (gameState.cursorY === 0) {
        return { key: ' ', keyCode: 32 };
      } else {
        return { key: 'ArrowUp', keyCode: 38 };
      }
    }
    
    // Exit menu
    return { key: 'z', keyCode: 90 };
  }
  
  // Priority 3: Place furniture if selected
  if (gameState.selectedFurnitureType) {
    // Try to place
    return { key: ' ', keyCode: 32 };
  }
  
  // Priority 4: Serve customers
  if (gameState.customers.length > 0) {
    const waitingCustomer = gameState.customers.find(c => !c.served);
    if (waitingCustomer && gameState.recipes.length > 0) {
      return { key: ' ', keyCode: 32 };
    }
  }
  
  // Wait for customers
  return null;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Simple test: create one recipe and serve customers
  if (!gameState.menuOpen && gameState.recipes.length < 2) {
    return { key: 'Shift', keyCode: 16 };
  }
  
  if (gameState.menuOpen) {
    if (gameState.menuType === null && gameState.cursorY === 0) {
      return { key: ' ', keyCode: 32 };
    }
    if (gameState.menuType === 'RECIPE') {
      if (gameState.selectedIngredients.length < 1) {
        return { key: ' ', keyCode: 32 };
      } else {
        return { key: ' ', keyCode: 32 };
      }
    }
    return { key: 'z', keyCode: 90 };
  }
  
  // Serve customers
  if (gameState.customers.length > 0) {
    return { key: ' ', keyCode: 32 };
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: ' ', keyCode: 32 },
    null
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getBasicTestAction(gameState);
    case 'TEST_2':
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;