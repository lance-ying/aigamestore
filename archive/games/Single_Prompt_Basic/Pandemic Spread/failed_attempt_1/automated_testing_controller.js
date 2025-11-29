import { gameState, KEY_CODES } from './globals.js';

// Test 1: Basic game functionality using sticky keys
function getStickyKeysAction(gameState) {
  // Keep track of action history and stalling detection
  if (!gameState._testData) {
    gameState._testData = {
      lastAction: null,
      actionCount: 0,
      maxActionCount: 20 + Math.floor(Math.random() * 30),
      positionHistory: [],
      stallCount: 0
    };
  }
  
  const data = gameState._testData;
  
  // Check if we need to change actions
  data.actionCount++;
  
  // Detect if we're stalled (no progress for a while)
  if (gameState.currentView === "MAP") {
    // Track infection rate to detect stalling
    const currentProgress = gameState.infectionRate;
    data.positionHistory.push(currentProgress);
    
    // Keep only last 100 positions
    if (data.positionHistory.length > 100) {
      data.positionHistory.shift();
    }
    
    // Check if we're stalled (no change in infection rate)
    if (data.positionHistory.length > 50) {
      const recentPositions = data.positionHistory.slice(-50);
      const uniqueValues = new Set(recentPositions.map(p => Math.floor(p * 100)));
      
      if (uniqueValues.size < 3) {
        data.stallCount++;
      } else {
        data.stallCount = 0;
      }
    }
  }
  
  // If stalled or time to change action, pick a new action
  if (data.stallCount > 10 || data.actionCount >= data.maxActionCount) {
    // Reset counters
    data.actionCount = 0;
    data.maxActionCount = 20 + Math.floor(Math.random() * 30);
    
    // If stalled, try to make progress
    if (data.stallCount > 10) {
      data.stallCount = 0;
      
      // If we're stalled on the map, switch to upgrades
      if (gameState.currentView === "MAP") {
        return KEY_CODES.Z; // Switch to upgrades view
      }
      
      // If in upgrade view, try to purchase upgrades
      return KEY_CODES.SPACE;
    }
    
    // Otherwise pick a random action
    const possibleActions = [
      KEY_CODES.Z,       // Toggle view
      KEY_CODES.SPACE,   // Select/purchase
      KEY_CODES.UP,      // Navigate up
      KEY_CODES.DOWN,    // Navigate down
      KEY_CODES.LEFT,    // Navigate left
      KEY_CODES.RIGHT,   // Navigate right
      KEY_CODES.SHIFT    // Speed up
    ];
    
    data.lastAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
  }
  
  return data.lastAction;
}

// Test 2: Win strategy - Focus on transmission and drug resistance
function getTestWinAction(gameState) {
  if (!gameState._winTestData) {
    gameState._winTestData = {
      phase: 0,
      upgradeQueue: [],
      lastAction: null,
      actionDelay: 0
    };
  }
  
  const data = gameState._winTestData;
  
  // Decrement action delay if set
  if (data.actionDelay > 0) {
    data.actionDelay--;
    return data.lastAction;
  }
  
  // Phase 0: Initial setup - go to upgrade menu
  if (data.phase === 0) {
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      data.phase = 1;
      return KEY_CODES.Z;
    }
    data.phase = 1;
  }
  
  // Phase 1: Prioritize transmission upgrades
  if (data.phase === 1) {
    // Make sure we're in the upgrade view
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      return KEY_CODES.Z;
    }
    
    // If we have enough DNA for any transmission upgrade, buy it
    if (gameState.selectedUpgradeCategory !== 0) {
      data.lastAction = KEY_CODES.LEFT;
      data.actionDelay = 5;
      return KEY_CODES.LEFT;
    }
    
    // Find the cheapest available transmission upgrade
    let cheapestUpgrade = -1;
    let cheapestCost = Infinity;
    
    for (let i = 0; i < gameState.upgradeCategories[0].upgrades.length; i++) {
      const upgrade = gameState.upgradeCategories[0].upgrades[i];
      if (upgrade.level < upgrade.maxLevel && upgrade.cost < cheapestCost) {
        cheapestUpgrade = i;
        cheapestCost = upgrade.cost;
      }
    }
    
    // If we found an upgrade and have enough DNA, navigate to it and buy it
    if (cheapestUpgrade !== -1 && gameState.dnaPoints >= cheapestCost) {
      // Navigate to the upgrade
      if (gameState.selectedUpgrade !== cheapestUpgrade) {
        if (gameState.selectedUpgrade < cheapestUpgrade) {
          data.lastAction = KEY_CODES.DOWN;
          data.actionDelay = 5;
          return KEY_CODES.DOWN;
        } else {
          data.lastAction = KEY_CODES.UP;
          data.actionDelay = 5;
          return KEY_CODES.UP;
        }
      }
      
      // Buy the upgrade
      data.lastAction = KEY_CODES.SPACE;
      data.actionDelay = 5;
      
      // If we've maxed out all transmission upgrades, move to phase 2
      let allTransmissionMaxed = true;
      for (const upgrade of gameState.upgradeCategories[0].upgrades) {
        if (upgrade.level < upgrade.maxLevel) {
          allTransmissionMaxed = false;
          break;
        }
      }
      
      if (allTransmissionMaxed) {
        data.phase = 2;
      }
      
      return KEY_CODES.SPACE;
    }
    
    // If we don't have enough DNA, toggle speed
    if (gameState.gameSpeed === 1) {
      data.lastAction = KEY_CODES.SHIFT;
      data.actionDelay = 5;
      return KEY_CODES.SHIFT;
    }
    
    // Check if we should move to phase 2 (if infection rate is high enough)
    if (gameState.infectionRate > 0.3) {
      data.phase = 2;
    }
    
    // If nothing else, wait
    return null;
  }
  
  // Phase 2: Add resistance upgrades
  if (data.phase === 2) {
    // Make sure we're in the upgrade view
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      return KEY_CODES.Z;
    }
    
    // Navigate to Abilities category
    if (gameState.selectedUpgradeCategory !== 2) {
      if (gameState.selectedUpgradeCategory < 2) {
        data.lastAction = KEY_CODES.RIGHT;
        data.actionDelay = 5;
        return KEY_CODES.RIGHT;
      } else {
        data.lastAction = KEY_CODES.LEFT;
        data.actionDelay = 5;
        return KEY_CODES.LEFT;
      }
    }
    
    // Prioritize drug resistance and mutation
    const targetUpgrades = [2, 3]; // Drug Resistance and Mutation
    
    // Find the cheapest available target upgrade
    let cheapestUpgrade = -1;
    let cheapestCost = Infinity;
    
    for (const upgradeIndex of targetUpgrades) {
      const upgrade = gameState.upgradeCategories[2].upgrades[upgradeIndex];
      if (upgrade.level < upgrade.maxLevel && upgrade.cost < cheapestCost) {
        cheapestUpgrade = upgradeIndex;
        cheapestCost = upgrade.cost;
      }
    }
    
    // If we found an upgrade and have enough DNA, navigate to it and buy it
    if (cheapestUpgrade !== -1 && gameState.dnaPoints >= cheapestCost) {
      // Navigate to the upgrade
      if (gameState.selectedUpgrade !== cheapestUpgrade) {
        if (gameState.selectedUpgrade < cheapestUpgrade) {
          data.lastAction = KEY_CODES.DOWN;
          data.actionDelay = 5;
          return KEY_CODES.DOWN;
        } else {
          data.lastAction = KEY_CODES.UP;
          data.actionDelay = 5;
          return KEY_CODES.UP;
        }
      }
      
      // Buy the upgrade
      data.lastAction = KEY_CODES.SPACE;
      data.actionDelay = 5;
      
      // If both resistance upgrades are maxed, move to phase 3
      if (gameState.upgradeCategories[2].upgrades[2].level === 3 &&
          gameState.upgradeCategories[2].upgrades[3].level === 3) {
        data.phase = 3;
      }
      
      return KEY_CODES.SPACE;
    }
    
    // If infection rate is high enough, move to phase 3
    if (gameState.infectionRate > 0.6) {
      data.phase = 3;
    }
    
    // If we don't have enough DNA, toggle speed
    if (gameState.gameSpeed === 1) {
      data.lastAction = KEY_CODES.SHIFT;
      data.actionDelay = 5;
      return KEY_CODES.SHIFT;
    }
    
    // If nothing else, wait
    return null;
  }
  
  // Phase 3: Balance remaining upgrades and check win condition
  if (data.phase === 3) {
    // If we're close to winning, just speed up
    if (gameState.infectionRate > 0.9) {
      if (gameState.gameSpeed === 1) {
        data.lastAction = KEY_CODES.SHIFT;
        data.actionDelay = 5;
        return KEY_CODES.SHIFT;
      }
      return null;
    }
    
    // Make sure we're in the upgrade view
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      return KEY_CODES.Z;
    }
    
    // Find any affordable upgrade across all categories
    let bestCategory = -1;
    let bestUpgrade = -1;
    let bestCost = Infinity;
    
    for (let catIdx = 0; catIdx < gameState.upgradeCategories.length; catIdx++) {
      for (let upIdx = 0; upIdx < gameState.upgradeCategories[catIdx].upgrades.length; upIdx++) {
        const upgrade = gameState.upgradeCategories[catIdx].upgrades[upIdx];
        if (upgrade.level < upgrade.maxLevel && upgrade.cost < bestCost && gameState.dnaPoints >= upgrade.cost) {
          bestCategory = catIdx;
          bestUpgrade = upIdx;
          bestCost = upgrade.cost;
        }
      }
    }
    
    // If we found an affordable upgrade, navigate to it and buy it
    if (bestCategory !== -1) {
      // Navigate to the category
      if (gameState.selectedUpgradeCategory !== bestCategory) {
        if (gameState.selectedUpgradeCategory < bestCategory) {
          data.lastAction = KEY_CODES.RIGHT;
          data.actionDelay = 5;
          return KEY_CODES.RIGHT;
        } else {
          data.lastAction = KEY_CODES.LEFT;
          data.actionDelay = 5;
          return KEY_CODES.LEFT;
        }
      }
      
      // Navigate to the upgrade
      if (gameState.selectedUpgrade !== bestUpgrade) {
        if (gameState.selectedUpgrade < bestUpgrade) {
          data.lastAction = KEY_CODES.DOWN;
          data.actionDelay = 5;
          return KEY_CODES.DOWN;
        } else {
          data.lastAction = KEY_CODES.UP;
          data.actionDelay = 5;
          return KEY_CODES.UP;
        }
      }
      
      // Buy the upgrade
      data.lastAction = KEY_CODES.SPACE;
      data.actionDelay = 5;
      return KEY_CODES.SPACE;
    }
    
    // If we don't have enough DNA, toggle speed
    if (gameState.gameSpeed === 1) {
      data.lastAction = KEY_CODES.SHIFT;
      data.actionDelay = 5;
      return KEY_CODES.SHIFT;
    }
    
    // If nothing else, wait
    return null;
  }
  
  return null;
}

// Test 3: Loss condition - Focus only on symptoms
function getTestLoseAction(gameState) {
  if (!gameState._loseTestData) {
    gameState._loseTestData = {
      phase: 0,
      lastAction: null,
      actionDelay: 0
    };
  }
  
  const data = gameState._loseTestData;
  
  // Decrement action delay if set
  if (data.actionDelay > 0) {
    data.actionDelay--;
    return data.lastAction;
  }
  
  // Phase 0: Initial setup - go to upgrade menu
  if (data.phase === 0) {
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      data.phase = 1;
      return KEY_CODES.Z;
    }
    data.phase = 1;
  }
  
  // Phase 1: Focus exclusively on symptoms to lose
  if (data.phase === 1) {
    // Make sure we're in the upgrade view
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      return KEY_CODES.Z;
    }
    
    // Navigate to Symptoms category
    if (gameState.selectedUpgradeCategory !== 1) {
      if (gameState.selectedUpgradeCategory < 1) {
        data.lastAction = KEY_CODES.RIGHT;
        data.actionDelay = 5;
        return KEY_CODES.RIGHT;
      } else {
        data.lastAction = KEY_CODES.LEFT;
        data.actionDelay = 5;
        return KEY_CODES.LEFT;
      }
    }
    
    // Find the cheapest available symptom upgrade
    let cheapestUpgrade = -1;
    let cheapestCost = Infinity;
    
    for (let i = 0; i < gameState.upgradeCategories[1].upgrades.length; i++) {
      const upgrade = gameState.upgradeCategories[1].upgrades[i];
      if (upgrade.level < upgrade.maxLevel && upgrade.cost < cheapestCost) {
        cheapestUpgrade = i;
        cheapestCost = upgrade.cost;
      }
    }
    
    // If we found an upgrade and have enough DNA, navigate to it and buy it
    if (cheapestUpgrade !== -1 && gameState.dnaPoints >= cheapestCost) {
      // Navigate to the upgrade
      if (gameState.selectedUpgrade !== cheapestUpgrade) {
        if (gameState.selectedUpgrade < cheapestUpgrade) {
          data.lastAction = KEY_CODES.DOWN;
          data.actionDelay = 5;
          return KEY_CODES.DOWN;
        } else {
          data.lastAction = KEY_CODES.UP;
          data.actionDelay = 5;
          return KEY_CODES.UP;
        }
      }
      
      // Buy the upgrade
      data.lastAction = KEY_CODES.SPACE;
      data.actionDelay = 5;
      return KEY_CODES.SPACE;
    }
    
    // If we don't have enough DNA, toggle speed
    if (gameState.gameSpeed === 1) {
      data.lastAction = KEY_CODES.SHIFT;
      data.actionDelay = 5;
      return KEY_CODES.SHIFT;
    }
    
    // If nothing else, wait
    return null;
  }
  
  return null;
}

// Test 4: Rapid upgrading test
function getTestRapidUpgradeAction(gameState) {
  if (!gameState._rapidTestData) {
    gameState._rapidTestData = {
      lastAction: null,
      actionDelay: 0,
      actionSequence: [
        KEY_CODES.Z,       // Go to upgrades
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.RIGHT,   // Next category
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.RIGHT,   // Next category
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.DOWN,    // Next upgrade
        KEY_CODES.SPACE,   // Purchase
        KEY_CODES.SHIFT,   // Speed up
        KEY_CODES.Z,       // Back to map
      ],
      currentActionIndex: 0
    };
  }
  
  const data = gameState._rapidTestData;
  
  // Decrement action delay if set
  if (data.actionDelay > 0) {
    data.actionDelay--;
    return data.lastAction;
  }
  
  // Get the next action from the sequence
  const action = data.actionSequence[data.currentActionIndex];
  data.currentActionIndex = (data.currentActionIndex + 1) % data.actionSequence.length;
  
  data.lastAction = action;
  data.actionDelay = 3; // Very short delay for rapid testing
  
  return action;
}

// Test 5: Balanced strategy
function getTestBalancedAction(gameState) {
  if (!gameState._balancedTestData) {
    gameState._balancedTestData = {
      phase: 0,
      lastAction: null,
      actionDelay: 0,
      categoryIndex: 0
    };
  }
  
  const data = gameState._balancedTestData;
  
  // Decrement action delay if set
  if (data.actionDelay > 0) {
    data.actionDelay--;
    return data.lastAction;
  }
  
  // Phase 0: Initial setup - go to upgrade menu
  if (data.phase === 0) {
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      data.phase = 1;
      return KEY_CODES.Z;
    }
    data.phase = 1;
  }
  
  // Phase 1: Balanced upgrading across all categories
  if (data.phase === 1) {
    // Make sure we're in the upgrade view
    if (gameState.currentView === "MAP") {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 5;
      return KEY_CODES.Z;
    }
    
    // Navigate to current category
    if (gameState.selectedUpgradeCategory !== data.categoryIndex) {
      if (gameState.selectedUpgradeCategory < data.categoryIndex) {
        data.lastAction = KEY_CODES.RIGHT;
        data.actionDelay = 5;
        return KEY_CODES.RIGHT;
      } else {
        data.lastAction = KEY_CODES.LEFT;
        data.actionDelay = 5;
        return KEY_CODES.LEFT;
      }
    }
    
    // Find the cheapest available upgrade in current category
    let cheapestUpgrade = -1;
    let cheapestCost = Infinity;
    
    for (let i = 0; i < gameState.upgradeCategories[data.categoryIndex].upgrades.length; i++) {
      const upgrade = gameState.upgradeCategories[data.categoryIndex].upgrades[i];
      if (upgrade.level < upgrade.maxLevel && upgrade.cost < cheapestCost) {
        cheapestUpgrade = i;
        cheapestCost = upgrade.cost;
      }
    }
    
    // If we found an upgrade and have enough DNA, navigate to it and buy it
    if (cheapestUpgrade !== -1 && gameState.dnaPoints >= cheapestCost) {
      // Navigate to the upgrade
      if (gameState.selectedUpgrade !== cheapestUpgrade) {
        if (gameState.selectedUpgrade < cheapestUpgrade) {
          data.lastAction = KEY_CODES.DOWN;
          data.actionDelay = 5;
          return KEY_CODES.DOWN;
        } else {
          data.lastAction = KEY_CODES.UP;
          data.actionDelay = 5;
          return KEY_CODES.UP;
        }
      }
      
      // Buy the upgrade
      data.lastAction = KEY_CODES.SPACE;
      data.actionDelay = 5;
      
      // Move to next category after purchase
      data.categoryIndex = (data.categoryIndex + 1) % gameState.upgradeCategories.length;
      
      return KEY_CODES.SPACE;
    }
    
    // If no affordable upgrade in current category, move to next
    data.categoryIndex = (data.categoryIndex + 1) % gameState.upgradeCategories.length;
    
    // If we don't have enough DNA, toggle speed
    if (gameState.gameSpeed === 1) {
      data.lastAction = KEY_CODES.SHIFT;
      data.actionDelay = 5;
      return KEY_CODES.SHIFT;
    }
    
    // If infection rate is high enough, occasionally check the map
    if (gameState.infectionRate > 0.5 && Math.random() < 0.1) {
      data.lastAction = KEY_CODES.Z;
      data.actionDelay = 10;
      return KEY_CODES.Z;
    }
    
    // If nothing else, wait
    return null;
  }
  
  return null;
}

export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLoseAction(gameState);
    case "TEST_4":
      return getTestRapidUpgradeAction(gameState);
    case "TEST_5":
      return getTestBalancedAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;