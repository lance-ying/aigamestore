// automated_testing_controller.js - Automated testing controller

import { gameState, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_DOWN, KEY_UP, ITEM_TEMPLATES, COMBO_DEFINITIONS } from './globals.js';

let testState = {
  step: 0,
  waitFrames: 0,
  purchasedItems: [],
  targetComboIndex: 0,
  itemsToBurn: []
};

function getTestWinAction(gameState) {
  // Strategy: Systematically discover all combos
  testState.waitFrames--;
  
  if (testState.waitFrames > 0) {
    return null;
  }
  
  // If letter is showing, dismiss it
  if (gameState.currentLetter && !gameState.currentLetter.dismissed) {
    testState.waitFrames = 5;
    return KEY_SPACE;
  }
  
  // Get next combo to discover
  if (testState.targetComboIndex >= COMBO_DEFINITIONS.length) {
    // All combos discovered
    return null;
  }
  
  const targetCombo = COMBO_DEFINITIONS[testState.targetComboIndex];
  
  // Check if combo already discovered
  if (gameState.combosDiscovered.includes(targetCombo.id)) {
    testState.targetComboIndex++;
    testState.step = 0;
    return null;
  }
  
  switch (testState.step) {
    case 0: // Open catalog
      if (!gameState.catalogOpen) {
        testState.step = 1;
        testState.waitFrames = 10;
        return KEY_Z;
      }
      testState.step = 1;
      return null;
      
    case 1: // Navigate to and purchase first item
      if (gameState.catalogOpen) {
        const item1Template = ITEM_TEMPLATES.find(t => t.id === targetCombo.items[0]);
        if (item1Template && gameState.coins >= item1Template.cost) {
          // Check if item already in inventory
          const hasItem = gameState.inventory.some(i => i.id === item1Template.id);
          if (!hasItem) {
            testState.waitFrames = 10;
            testState.step = 2;
            return KEY_SPACE;
          }
        } else {
          // Not enough coins - burn something first
          testState.step = 5;
          return KEY_Z;
        }
      }
      testState.step = 2;
      return null;
      
    case 2: // Purchase second item
      if (gameState.catalogOpen) {
        const item2Template = ITEM_TEMPLATES.find(t => t.id === targetCombo.items[1]);
        if (item2Template && gameState.coins >= item2Template.cost) {
          const hasItem = gameState.inventory.some(i => i.id === item2Template.id && !i.isBurning);
          if (!hasItem) {
            testState.waitFrames = 10;
            testState.step = 3;
            return KEY_SPACE;
          }
        }
      }
      testState.step = 3;
      return null;
      
    case 3: // Close catalog
      if (gameState.catalogOpen) {
        testState.waitFrames = 10;
        testState.step = 4;
        return KEY_Z;
      }
      testState.step = 4;
      return null;
      
    case 4: // Burn first item
      if (!gameState.catalogOpen && gameState.inventory.length > 0) {
        const item1 = gameState.inventory.find(i => i.id === targetCombo.items[0]);
        if (item1 && !item1.isBurning) {
          testState.waitFrames = 60;
          testState.step = 5;
          return KEY_SHIFT;
        }
      }
      testState.step = 5;
      return null;
      
    case 5: // Hold shift to drag
      if (testState.waitFrames <= 0) {
        testState.step = 6;
        testState.waitFrames = 10;
      }
      return KEY_SHIFT;
      
    case 6: // Release and burn second item
      if (gameState.inventory.length > 0) {
        const item2 = gameState.inventory.find(i => i.id === targetCombo.items[1]);
        if (item2 && !item2.isBurning) {
          testState.waitFrames = 60;
          testState.step = 7;
          return KEY_SHIFT;
        }
      }
      testState.step = 7;
      return null;
      
    case 7: // Hold shift for second item
      if (testState.waitFrames <= 0) {
        testState.step = 8;
        testState.waitFrames = 200; // Wait for burning
      }
      return KEY_SHIFT;
      
    case 8: // Wait for combo discovery and burning to complete
      if (gameState.combosDiscovered.includes(targetCombo.id)) {
        testState.targetComboIndex++;
        testState.step = 0;
        testState.waitFrames = 20;
      }
      return null;
      
    default:
      testState.step = 0;
      return null;
  }
}

function getBasicTestAction(gameState) {
  // Test basic mechanics: purchase, drag, burn
  testState.waitFrames--;
  
  if (testState.waitFrames > 0) {
    return null;
  }
  
  // Dismiss letters
  if (gameState.currentLetter && !gameState.currentLetter.dismissed) {
    testState.waitFrames = 5;
    return KEY_SPACE;
  }
  
  switch (testState.step) {
    case 0: // Open catalog
      if (!gameState.catalogOpen) {
        testState.waitFrames = 10;
        testState.step = 1;
        return KEY_Z;
      }
      testState.step = 1;
      return null;
      
    case 1: // Purchase item
      if (gameState.catalogOpen && gameState.coins >= 5) {
        testState.waitFrames = 10;
        testState.step = 2;
        return KEY_SPACE;
      }
      testState.step = 2;
      return null;
      
    case 2: // Close catalog
      if (gameState.catalogOpen) {
        testState.waitFrames = 10;
        testState.step = 3;
        return KEY_Z;
      }
      testState.step = 3;
      return null;
      
    case 3: // Grab item
      if (gameState.inventory.length > 0) {
        testState.waitFrames = 60;
        testState.step = 4;
        return KEY_SHIFT;
      }
      testState.step = 0;
      return null;
      
    case 4: // Hold shift to drag to fire
      if (testState.waitFrames <= 0) {
        testState.step = 5;
        testState.waitFrames = 200; // Wait for burning
      }
      return KEY_SHIFT;
      
    case 5: // Wait for burning complete
      if (gameState.burningItems.length === 0) {
        testState.step = 0;
        testState.waitFrames = 20;
      }
      return null;
      
    default:
      testState.step = 0;
      return null;
  }
}

function getRandomAction(gameState) {
  const actions = [null, null, null, KEY_Z, KEY_SPACE, KEY_DOWN, KEY_UP, KEY_SHIFT];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;