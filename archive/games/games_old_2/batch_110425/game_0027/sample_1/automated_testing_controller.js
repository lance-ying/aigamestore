// automated_testing_controller.js - Automated testing strategies

import { gameState, BUILDING_TYPES, GIFT_ITEMS, GRID_COLS, GRID_ROWS } from './globals.js';
import { canPlaceBuilding } from './building.js';

// Test strategy: Win the game
function getTestWinAction(gameState) {
  const action = { keyCode: null };
  
  // Strategy: Build diverse attractions systematically
  // Switch to build mode if not already
  if (gameState.buildMode !== 'BUILD') {
    action.keyCode = 16; // SHIFT to change mode
    return action;
  }
  
  // If we have enough money, place buildings
  if (gameState.money >= 100) {
    // Try to place buildings in a grid pattern
    const buildingKeys = Object.keys(BUILDING_TYPES).filter(key => {
      const building = BUILDING_TYPES[key];
      const unlocked = !building.unlockFollowers || gameState.snsFollowers >= building.unlockFollowers;
      return unlocked && gameState.money >= building.cost;
    });
    
    if (buildingKeys.length > 0) {
      // Select a diverse building type
      const currentType = gameState.selectedBuildingType;
      const currentIndex = buildingKeys.indexOf(currentType);
      const nextIndex = (currentIndex + 1) % buildingKeys.length;
      const targetType = buildingKeys[nextIndex];
      
      if (currentType !== targetType) {
        action.keyCode = 40; // DOWN to navigate menu
        return action;
      }
      
      // Try to place the building
      const building = BUILDING_TYPES[targetType];
      
      // Find a valid placement location
      let placed = false;
      for (let y = 0; y < GRID_ROWS - building.height && !placed; y++) {
        for (let x = 0; x < GRID_COLS - building.width && !placed; x++) {
          if (canPlaceBuilding(x, y, building.width, building.height)) {
            // Move cursor to this position
            if (gameState.cursorGridX !== x) {
              action.keyCode = gameState.cursorGridX < x ? 39 : 37; // RIGHT or LEFT
              return action;
            }
            if (gameState.cursorGridY !== y) {
              action.keyCode = gameState.cursorGridY < y ? 40 : 38; // DOWN or UP
              return action;
            }
            
            // Place building
            action.keyCode = 32; // SPACE
            placed = true;
            return action;
          }
        }
      }
    }
  }
  
  // If we have money and guests, give gifts
  if (gameState.money >= 20 && gameState.guests.length > 0) {
    if (gameState.buildMode !== 'GIFT') {
      action.keyCode = 16; // SHIFT to gift mode
      return action;
    }
    
    // Move cursor to a guest location
    const guest = gameState.guests[0];
    const targetGridX = Math.floor((guest.screenX - 200) / 20);
    const targetGridY = Math.floor((guest.screenY - 50) / 20);
    
    if (gameState.cursorGridX !== targetGridX) {
      action.keyCode = gameState.cursorGridX < targetGridX ? 39 : 37;
      return action;
    }
    if (gameState.cursorGridY !== targetGridY) {
      action.keyCode = gameState.cursorGridY < targetGridY ? 40 : 38;
      return action;
    }
    
    // Give gift
    action.keyCode = 32; // SPACE
    return action;
  }
  
  // Default: wait/random movement
  const random = Math.floor(gameState.gameTime * 0.1) % 4;
  action.keyCode = [37, 38, 39, 40][random];
  return action;
}

// Test strategy: Basic mechanics
function getTestBasicAction(gameState) {
  const action = { keyCode: null };
  
  // Simple strategy: place a small pool and restaurant
  if (gameState.buildMode !== 'BUILD') {
    action.keyCode = 16; // SHIFT
    return action;
  }
  
  if (gameState.buildings.length < 2 && gameState.money >= 100) {
    if (gameState.cursorGridX < 5) {
      action.keyCode = 39; // RIGHT
      return action;
    }
    if (gameState.cursorGridY < 5) {
      action.keyCode = 40; // DOWN
      return action;
    }
    
    action.keyCode = 32; // SPACE to place
    return action;
  }
  
  // Random exploration
  const random = Math.floor(gameState.gameTime * 0.05) % 4;
  action.keyCode = [37, 38, 39, 40][random];
  return action;
}

// Test strategy: Delete and rebuild
function getTestDeleteAction(gameState) {
  const action = { keyCode: null };
  
  // Build first
  if (gameState.buildings.length < 2) {
    return getTestBasicAction(gameState);
  }
  
  // Switch to delete mode
  if (gameState.buildMode !== 'DELETE') {
    action.keyCode = 16; // SHIFT
    return action;
  }
  
  // Move to a building and delete it
  if (gameState.buildings.length > 0) {
    const building = gameState.buildings[0];
    
    if (gameState.cursorGridX !== building.gridX) {
      action.keyCode = gameState.cursorGridX < building.gridX ? 39 : 37;
      return action;
    }
    if (gameState.cursorGridY !== building.gridY) {
      action.keyCode = gameState.cursorGridY < building.gridY ? 40 : 38;
      return action;
    }
    
    action.keyCode = 90; // Z to delete
    return action;
  }
  
  return action;
}

// Random action for testing
function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 16];
  const randomIndex = Math.floor(gameState.gameTime * 0.1) % actions.length;
  return { keyCode: actions[randomIndex] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDeleteAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;