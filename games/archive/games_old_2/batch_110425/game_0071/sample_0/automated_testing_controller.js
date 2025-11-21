// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';

let testState = {
  phase: "INIT",
  targetIngredientIndex: 0,
  recipesCreatedThisSession: 0,
  framesSinceLastAction: 0,
  actionQueue: []
};

function getTestWinAction(gameState) {
  testState.framesSinceLastAction++;
  
  // Throttle actions
  if (testState.framesSinceLastAction < 10) {
    return null;
  }
  testState.framesSinceLastAction = 0;
  
  // Execute queued actions
  if (testState.actionQueue.length > 0) {
    return testState.actionQueue.shift();
  }
  
  // Strategy: Create diverse recipes and serve customers efficiently
  
  // Phase 1: Create recipes if menu is not full
  const emptySlots = gameState.menuSlots.filter(slot => slot === null).length;
  if (emptySlots > 0 && gameState.currentView === "CAFE") {
    testState.actionQueue.push({keyCode: 16}); // Switch to Recipe Lab
    return null;
  }
  
  if (gameState.currentView === "RECIPE_LAB" && emptySlots > 0) {
    // Create a recipe
    if (!gameState.recipeInProgress.active) {
      // Select ingredients strategically
      const targetCount = Math.min(3, gameState.unlockedIngredients.length);
      
      for (let i = 0; i < targetCount; i++) {
        const ingIndex = (testState.recipesCreatedThisSession * 2 + i) % gameState.unlockedIngredients.length;
        
        // Navigate to ingredient
        while (gameState.selectedMenuIndex < ingIndex) {
          testState.actionQueue.push({keyCode: 39}); // Right
        }
        while (gameState.selectedMenuIndex > ingIndex) {
          testState.actionQueue.push({keyCode: 37}); // Left
        }
        
        testState.actionQueue.push({keyCode: 32}); // Add ingredient
      }
      
      testState.actionQueue.push({keyCode: 32}); // Finalize recipe
      testState.recipesCreatedThisSession++;
      
      return testState.actionQueue.shift();
    }
  }
  
  // Phase 2: Switch to cafe and serve customers
  if (gameState.currentView === "RECIPE_LAB" && emptySlots === 0) {
    testState.actionQueue.push({keyCode: 16}); // Switch to Cafe
    return null;
  }
  
  if (gameState.currentView === "CAFE") {
    // Serve customers
    const waitingCustomers = gameState.customers.filter(c => !c.served).length;
    if (waitingCustomers > 0) {
      return {keyCode: 32}; // Serve
    }
    
    // If no customers and money available, consider creating more recipes
    if (gameState.money >= 50 && gameState.menuSlots.every(slot => slot !== null)) {
      testState.actionQueue.push({keyCode: 16}); // Switch to Recipe Lab
      return null;
    }
  }
  
  // Default: wait
  return null;
}

function getBasicTestAction(gameState) {
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 15) {
    return null;
  }
  testState.framesSinceLastAction = 0;
  
  // Execute queued actions
  if (testState.actionQueue.length > 0) {
    return testState.actionQueue.shift();
  }
  
  // Simple test: create one recipe and serve customers
  
  if (gameState.currentView === "CAFE" && gameState.menuSlots[0] === null) {
    testState.actionQueue.push({keyCode: 16}); // Switch to Recipe Lab
    return null;
  }
  
  if (gameState.currentView === "RECIPE_LAB" && gameState.menuSlots[0] === null) {
    // Create simple recipe
    testState.actionQueue.push({keyCode: 32}); // Add first ingredient
    testState.actionQueue.push({keyCode: 39}); // Move right
    testState.actionQueue.push({keyCode: 32}); // Add second ingredient
    testState.actionQueue.push({keyCode: 32}); // Finalize
    testState.actionQueue.push({keyCode: 16}); // Switch to Cafe
    
    return testState.actionQueue.shift();
  }
  
  if (gameState.currentView === "CAFE") {
    // Serve customers
    const waitingCustomers = gameState.customers.filter(c => !c.served).length;
    if (waitingCustomers > 0) {
      return {keyCode: 32}; // Serve
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    {keyCode: 37}, // Left
    {keyCode: 39}, // Right
    {keyCode: 32}, // Space
    {keyCode: 16}  // Shift
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      return getBasicTestAction(gameState);
    case CONTROL_MODES.TEST_2:
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;