// automated_testing_controller.js - Automated testing functions

import { gameState, TOWER_TYPES, GAME_PHASES } from './globals.js';

// Helper to find best tower slot
function findBestSlot(preferEarly = true) {
  const slots = gameState.towerSlots;
  
  // Find empty slots
  const emptySlots = slots.filter(s => !s.tower);
  if (emptySlots.length === 0) return null;
  
  if (preferEarly) {
    // Find slots closest to spawn
    const spawn = gameState.path[0];
    emptySlots.sort((a, b) => {
      const distA = Math.sqrt((a.x - spawn.x) ** 2 + (a.y - spawn.y) ** 2);
      const distB = Math.sqrt((b.x - spawn.x) ** 2 + (b.y - spawn.y) ** 2);
      return distA - distB;
    });
  }
  
  return emptySlots[0];
}

// Helper to find tower type we can afford
function getAffordableTowerType() {
  const types = Object.keys(TOWER_TYPES);
  
  // Prefer artillery if we can afford it
  if (gameState.gold >= TOWER_TYPES.ARTILLERY.cost) {
    return 'ARTILLERY';
  }
  
  // Then mage
  if (gameState.gold >= TOWER_TYPES.MAGE.cost) {
    return 'MAGE';
  }
  
  // Then archer or barracks
  if (gameState.gold >= TOWER_TYPES.ARCHER.cost) {
    return Math.random() > 0.5 ? 'ARCHER' : 'BARRACKS';
  }
  
  return null;
}

// Helper to navigate cursor to slot
function navigateToSlot(targetSlot) {
  if (!targetSlot) return [];
  
  // Find slot index
  const slotIndex = gameState.towerSlots.findIndex(s => s.id === targetSlot.id);
  if (slotIndex === -1) return [];
  
  const targetX = slotIndex % 6;
  const targetY = Math.floor(slotIndex / 6);
  
  const actions = [];
  
  // Move cursor to target
  while (gameState.cursorX < targetX) {
    actions.push(39); // RIGHT
    gameState.cursorX++;
  }
  while (gameState.cursorX > targetX) {
    actions.push(37); // LEFT
    gameState.cursorX--;
  }
  while (gameState.cursorY < targetY) {
    actions.push(40); // DOWN
    gameState.cursorY++;
  }
  while (gameState.cursorY > targetY) {
    actions.push(38); // UP
    gameState.cursorY--;
  }
  
  return actions;
}

// State tracking for test modes
const testState = {
  navigationQueue: [],
  lastAction: null,
  actionCooldown: 0,
  placementPhase: true,
  upgradePhase: false,
  lastGold: 200,
  stuckCounter: 0
};

function getTestWinAction(gameState) {
  // Cooldown between actions
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Check if we're stuck (no gold gain for a while)
  if (gameState.gold === testState.lastGold) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
    testState.lastGold = gameState.gold;
  }
  
  // If stuck and have towers, try upgrading
  if (testState.stuckCounter > 100 && gameState.towers.length > 0) {
    testState.placementPhase = false;
    testState.upgradePhase = true;
  }
  
  // Process navigation queue first
  if (testState.navigationQueue.length > 0) {
    const action = testState.navigationQueue.shift();
    testState.actionCooldown = 2;
    return action;
  }
  
  // Close any open menus first
  if (gameState.showTowerMenu) {
    testState.actionCooldown = 5;
    return 90; // Z to close
  }
  
  // Placement phase: build towers
  if (testState.placementPhase) {
    const towerType = getAffordableTowerType();
    
    if (towerType && gameState.towers.length < 8) {
      const slot = findBestSlot(true);
      if (slot && !slot.tower) {
        // Navigate to slot
        testState.navigationQueue = navigateToSlot(slot);
        testState.navigationQueue.push(32); // SPACE to open menu
        
        // Select tower type based on priority
        const typeIndex = Object.keys(TOWER_TYPES).indexOf(towerType);
        gameState.menuSelection = typeIndex;
        
        testState.navigationQueue.push(32); // SPACE to confirm
        testState.actionCooldown = 5;
        
        return testState.navigationQueue.shift();
      }
    }
    
    // Switch to upgrade phase if we have towers
    if (gameState.towers.length >= 4) {
      testState.placementPhase = false;
      testState.upgradePhase = true;
    }
  }
  
  // Upgrade phase: upgrade existing towers
  if (testState.upgradePhase) {
    // Find tower to upgrade
    const upgradeableTowers = gameState.towers.filter(t => {
      return t.level < 3 && gameState.gold >= t.getUpgradeCost();
    });
    
    if (upgradeableTowers.length > 0) {
      // Sort by kills (upgrade most effective towers)
      upgradeableTowers.sort((a, b) => b.kills - a.kills);
      const tower = upgradeableTowers[0];
      
      // Find slot with this tower
      const slot = gameState.towerSlots.find(s => s.tower === tower);
      if (slot) {
        testState.navigationQueue = navigateToSlot(slot);
        testState.navigationQueue.push(16); // SHIFT to upgrade
        testState.actionCooldown = 5;
        
        return testState.navigationQueue.shift();
      }
    }
    
    // Back to placement if we can afford more towers
    if (gameState.gold >= 70 && gameState.towers.length < 12) {
      testState.placementPhase = true;
      testState.upgradePhase = false;
    }
  }
  
  // Default: wait
  testState.actionCooldown = 10;
  return null;
}

function getTestBasicAction(gameState) {
  // Simple test: just place a few towers
  const actions = [39, 39, 40, 32, 32, null, null, null, 37, 37, 32, 32];
  const frameAction = actions[Math.floor(gameState.score / 100) % actions.length];
  return frameAction;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
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