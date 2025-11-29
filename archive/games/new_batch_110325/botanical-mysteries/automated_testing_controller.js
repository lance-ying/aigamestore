// automated_testing_controller.js - Automated testing logic
import { gameState } from './globals.js';
import { getUnlockedPlants, getPlantById } from './plant_manager.js';
import { CUSTOMER_CLUES } from './globals.js';

let testState = {
  actionQueue: [],
  framesSinceLastAction: 0,
  currentStrategy: null,
  visitedViews: []
};

function getTestWinAction(gameState) {
  // Strategy: Complete all customer orders correctly to win
  testState.framesSinceLastAction++;
  
  // Need some delay between actions
  if (testState.framesSinceLastAction < 20) {
    return null;
  }
  
  if (!gameState.currentCustomer) {
    // Waiting for next customer/day
    return null;
  }
  
  // Determine correct plant from customer clue
  const correctPlantId = gameState.currentCustomer.requestedPlantId;
  
  // Strategy:
  // 1. If we haven't selected the right plant, go to inventory
  // 2. Navigate to the correct plant
  // 3. Select it
  // 4. Go to customer view
  // 5. Submit
  
  if (gameState.selectedPlantId === correctPlantId && gameState.currentView === "CUSTOMER") {
    // Submit the plant
    testState.framesSinceLastAction = 0;
    return { keyCode: 32 }; // SPACE
  }
  
  if (gameState.selectedPlantId === correctPlantId && gameState.currentView !== "CUSTOMER") {
    // Navigate to customer view
    testState.framesSinceLastAction = 0;
    return { keyCode: 16 }; // SHIFT to change view
  }
  
  if (gameState.currentView === "INVENTORY") {
    // Find the correct plant in our inventory
    const plants = getUnlockedPlants();
    const targetPlant = plants.find(p => p.id === correctPlantId);
    
    if (!targetPlant) {
      // Plant not unlocked yet, skip this customer (will fail)
      testState.framesSinceLastAction = 0;
      return { keyCode: 16 }; // Move to next view
    }
    
    if (gameState.selectedPlantId !== correctPlantId) {
      // Navigate to correct plant
      const currentPlantIndex = gameState.selectedPlantId ? 
        plants.findIndex(p => p.id === gameState.selectedPlantId) : -1;
      const targetIndex = plants.findIndex(p => p.id === correctPlantId);
      
      testState.framesSinceLastAction = 0;
      if (currentPlantIndex < targetIndex) {
        return { keyCode: 39 }; // RIGHT
      } else if (currentPlantIndex > targetIndex) {
        return { keyCode: 37 }; // LEFT
      } else {
        // We're at the right plant, select it
        return { keyCode: 32 }; // SPACE
      }
    }
  }
  
  // Navigate to inventory if not there
  if (gameState.currentView !== "INVENTORY") {
    testState.framesSinceLastAction = 0;
    return { keyCode: 16 }; // SHIFT
  }
  
  return null;
}

function getTestBasicAction(gameState) {
  // Test basic mechanics: navigation, viewing plants, simple interaction
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 15) {
    return null;
  }
  
  const actions = [
    { keyCode: 16 },  // SHIFT - change view
    { keyCode: 39 },  // RIGHT arrow
    { keyCode: 37 },  // LEFT arrow
    { keyCode: 32 },  // SPACE
  ];
  
  testState.framesSinceLastAction = 0;
  return actions[Math.floor(Math.random() * actions.length)];
}

function getTestLoseAction(gameState) {
  // Deliberately give wrong plants to test lose condition
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 20) {
    return null;
  }
  
  if (!gameState.currentCustomer) {
    return null;
  }
  
  const correctPlantId = gameState.currentCustomer.requestedPlantId;
  
  if (gameState.currentView === "CUSTOMER" && gameState.selectedPlantId && 
      gameState.selectedPlantId !== correctPlantId) {
    // Give wrong plant
    testState.framesSinceLastAction = 0;
    return { keyCode: 32 }; // SPACE
  }
  
  if (gameState.currentView === "INVENTORY") {
    const plants = getUnlockedPlants();
    // Select a random wrong plant
    const wrongPlants = plants.filter(p => p.id !== correctPlantId);
    if (wrongPlants.length > 0 && !gameState.selectedPlantId) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 32 }; // Select first plant
    } else if (gameState.selectedPlantId) {
      // Go to customer
      testState.framesSinceLastAction = 0;
      return { keyCode: 16 }; // SHIFT
    }
  }
  
  if (gameState.currentView !== "INVENTORY") {
    testState.framesSinceLastAction = 0;
    return { keyCode: 16 }; // SHIFT
  }
  
  testState.framesSinceLastAction = 0;
  return { keyCode: 39 }; // Navigate
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 },  // LEFT
    { keyCode: 39 },  // RIGHT
    { keyCode: 32 },  // SPACE
    { keyCode: 16 },  // SHIFT
    { keyCode: 90 },  // Z
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLoseAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;