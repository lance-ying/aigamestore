// automated_testing_controller.js - Automated testing functions

import { gameState, GAME_PHASES, SHOP_TYPES } from './globals.js';
import { canPlaceShop } from './shop.js';
import { canAddFloor } from './building.js';

const KEY_CODES = {
  SPACE: 32,
  UP: 38,
  DOWN: 40,
  SHIFT: 16,
  Z: 90
};

// Test 1: Basic functionality test
function getTest1Action(state) {
  // Randomly place shops and test basic mechanics
  const actions = [];
  
  // Randomly open shop menu
  if (!state.shopMenuOpen && Math.random() < 0.1) {
    actions.push(KEY_CODES.SHIFT);
  }
  
  // In menu, randomly select shop
  if (state.shopMenuOpen && Math.random() < 0.3) {
    if (Math.random() < 0.5) {
      actions.push(KEY_CODES.DOWN);
    } else {
      actions.push(KEY_CODES.SPACE);
    }
  }
  
  // Try to place shop
  if (state.selectedShopType && Math.random() < 0.2) {
    actions.push(KEY_CODES.SPACE);
  }
  
  // Navigate floors
  if (Math.random() < 0.05) {
    actions.push(Math.random() < 0.5 ? KEY_CODES.UP : KEY_CODES.DOWN);
  }
  
  return actions.length > 0 ? actions[0] : null;
}

// Test 2: Optimal win strategy
function getTest2Action(state) {
  const actions = [];
  
  // Priority 1: Place high-value shops
  if (!state.shopMenuOpen && !state.selectedShopType) {
    actions.push(KEY_CODES.SHIFT);
    return KEY_CODES.SHIFT;
  }
  
  // Priority 2: Select best available shop
  if (state.shopMenuOpen) {
    const shopPriority = ['FOSSIL_EXHIBIT', 'CINEMA', 'ELECTRONICS', 'CLOTHING', 'RESTAURANT', 'BOOKSTORE', 'CAFE'];
    
    for (let shopType of shopPriority) {
      const shopData = SHOP_TYPES[shopType];
      if (state.money >= shopData.cost && canPlaceShop(state.currentFloorIndex, shopType)) {
        state.selectedShopType = shopType;
        actions.push(KEY_CODES.SPACE);
        return KEY_CODES.SPACE;
      }
    }
    
    // Try to add floor if needed
    if (canAddFloor()) {
      // Navigate to add floor option
      actions.push(KEY_CODES.DOWN);
      return KEY_CODES.DOWN;
    }
    
    // Close menu if can't afford anything
    actions.push(KEY_CODES.SHIFT);
    return KEY_CODES.SHIFT;
  }
  
  // Priority 3: Place selected shop
  if (state.selectedShopType) {
    // Find best floor with space
    let bestFloor = -1;
    for (let i = 0; i < state.floors.length; i++) {
      if (canPlaceShop(i, state.selectedShopType)) {
        bestFloor = i;
        break;
      }
    }
    
    if (bestFloor !== -1 && state.currentFloorIndex !== bestFloor) {
      // Navigate to best floor
      if (state.currentFloorIndex < bestFloor) {
        return KEY_CODES.UP;
      } else {
        return KEY_CODES.DOWN;
      }
    }
    
    // Place shop
    if (canPlaceShop(state.currentFloorIndex, state.selectedShopType)) {
      return KEY_CODES.SPACE;
    }
  }
  
  // Priority 4: Expand if possible
  if (state.money >= 200 && canAddFloor()) {
    actions.push(KEY_CODES.SHIFT);
    return KEY_CODES.SHIFT;
  }
  
  return null;
}

// Test 3: Floor expansion test
function getTest3Action(state) {
  // Focus on expanding floors
  if (!state.shopMenuOpen && state.floors.length < state.maxFloors) {
    if (canAddFloor()) {
      return KEY_CODES.SHIFT;
    }
  }
  
  if (state.shopMenuOpen) {
    if (canAddFloor()) {
      // Navigate down to add floor option
      return KEY_CODES.DOWN;
    }
    
    // Select cheapest shop to generate revenue
    const cheapShops = ['CAFE', 'BOOKSTORE', 'RESTAURANT'];
    for (let shopType of cheapShops) {
      const shopData = SHOP_TYPES[shopType];
      if (state.money >= shopData.cost) {
        state.selectedShopType = shopType;
        return KEY_CODES.SPACE;
      }
    }
    
    return KEY_CODES.SHIFT; // Close menu
  }
  
  // Place shops to earn money
  if (state.selectedShopType && canPlaceShop(state.currentFloorIndex, state.selectedShopType)) {
    return KEY_CODES.SPACE;
  }
  
  // Navigate floors
  if (Math.random() < 0.1) {
    return Math.random() < 0.5 ? KEY_CODES.UP : KEY_CODES.DOWN;
  }
  
  return null;
}

// Random action fallback
function getRandomAction(state) {
  const possibleActions = [KEY_CODES.SPACE, KEY_CODES.UP, KEY_CODES.DOWN, KEY_CODES.SHIFT, KEY_CODES.Z];
  return possibleActions[Math.floor(Math.random() * possibleActions.length)];
}

export function get_automated_testing_action(state) {
  if (state.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (state.controlMode) {
    case 'TEST_1':
      return getTest1Action(state);
    case 'TEST_2':
      return getTest2Action(state);
    case 'TEST_3':
      return getTest3Action(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;