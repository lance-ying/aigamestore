// automated_testing_controller.js - Automated testing

import { gameState, FISHING_PHASES, LOCATIONS, WIN_CONDITIONS, UPGRADES } from './globals.js';
import { Fish } from './entities.js';

let testState = {
  framesSinceLastAction: 0,
  lastDepth: 0,
  stuckCounter: 0,
  targetDirection: 0,
  lastCash: 0,
  upgradesPurchased: { line: 0, speed: 0, weapon: 0 }
};

function getTestWinAction(gameState) {
  testState.framesSinceLastAction++;
  
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    // Check if we should open shop
    if (shouldPurchaseUpgrades()) {
      return { keyCode: 16 }; // SHIFT - open shop
    }
    
    // Cast line
    if (testState.framesSinceLastAction > 30) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 90 }; // Z - cast
    }
  } else if (gameState.fishingPhase === FISHING_PHASES.SHOP) {
    // Purchase upgrades strategically
    return purchaseUpgradesIntelligently();
  } else if (gameState.fishingPhase === FISHING_PHASES.DESCENDING) {
    // Avoid fish intelligently
    return avoidFishDuringDescent();
  } else if (gameState.fishingPhase === FISHING_PHASES.ASCENDING) {
    // Shoot fish aggressively
    if (testState.framesSinceLastAction > 8) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 32 }; // SPACE - shoot
    }
  }
  
  return null;
}

function shouldPurchaseUpgrades() {
  const lineLevel = gameState.lineUpgradeLevel;
  const speedLevel = gameState.speedUpgradeLevel;
  const weaponLevel = gameState.weaponUpgradeLevel;
  
  // Prioritize line upgrades first
  if (lineLevel < UPGRADES.line.length && gameState.cash >= UPGRADES.line[lineLevel].cost) {
    return true;
  }
  
  // Then weapon upgrades
  if (weaponLevel < UPGRADES.weapon.length && gameState.cash >= UPGRADES.weapon[weaponLevel].cost) {
    return true;
  }
  
  // Finally speed upgrades
  if (speedLevel < UPGRADES.speed.length && gameState.cash >= UPGRADES.speed[speedLevel].cost) {
    return true;
  }
  
  return false;
}

function purchaseUpgradesIntelligently() {
  const lineLevel = gameState.lineUpgradeLevel;
  const speedLevel = gameState.speedUpgradeLevel;
  const weaponLevel = gameState.weaponUpgradeLevel;
  
  // Priority: line > weapon > speed
  if (lineLevel < UPGRADES.line.length && gameState.cash >= UPGRADES.line[lineLevel].cost) {
    testState.upgradesPurchased.line++;
    return { key: '1' };
  }
  
  if (weaponLevel < UPGRADES.weapon.length && gameState.cash >= UPGRADES.weapon[weaponLevel].cost) {
    testState.upgradesPurchased.weapon++;
    return { key: '3' };
  }
  
  if (speedLevel < UPGRADES.speed.length && gameState.cash >= UPGRADES.speed[speedLevel].cost) {
    testState.upgradesPurchased.speed++;
    return { key: '2' };
  }
  
  // Close shop if no more upgrades to buy
  return { keyCode: 16 }; // SHIFT - close shop
}

function avoidFishDuringDescent() {
  if (!gameState.player) return null;
  
  // Find nearest fish in path
  const nearbyFish = gameState.entities.filter(e => 
    e instanceof Fish && e.active &&
    Math.abs(e.y - gameState.player.y) < 100 &&
    Math.abs(e.x - gameState.player.x) < 150
  );
  
  if (nearbyFish.length > 0) {
    // Sort by distance
    nearbyFish.sort((a, b) => {
      const distA = Math.abs(a.x - gameState.player.x) + Math.abs(a.y - gameState.player.y);
      const distB = Math.abs(b.x - gameState.player.x) + Math.abs(b.y - gameState.player.y);
      return distA - distB;
    });
    
    const nearestFish = nearbyFish[0];
    
    // Steer away from fish
    if (nearestFish.x < gameState.player.x) {
      return { keyCode: 39 }; // RIGHT
    } else {
      return { keyCode: 37 }; // LEFT
    }
  }
  
  // No fish nearby, center the lure
  if (gameState.player.x < 250) {
    return { keyCode: 39 }; // RIGHT
  } else if (gameState.player.x > 350) {
    return { keyCode: 37 }; // LEFT
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  testState.framesSinceLastAction++;
  
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    // Cast line periodically
    if (testState.framesSinceLastAction > 60) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 90 }; // Z
    }
  } else if (gameState.fishingPhase === FISHING_PHASES.DESCENDING) {
    // Random steering
    if (testState.framesSinceLastAction > 30) {
      testState.framesSinceLastAction = 0;
      testState.targetDirection = Math.random() < 0.5 ? 37 : 39;
    }
    return { keyCode: testState.targetDirection };
  } else if (gameState.fishingPhase === FISHING_PHASES.ASCENDING) {
    // Shoot randomly
    if (testState.framesSinceLastAction > 15) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 32 }; // SPACE
    }
  }
  
  return null;
}

function getShopTestAction(gameState) {
  testState.framesSinceLastAction++;
  
  if (gameState.fishingPhase === FISHING_PHASES.SURFACE) {
    // Try to open shop
    if (testState.framesSinceLastAction > 30 && gameState.cash > 0) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 16 }; // SHIFT
    }
    
    // Cast line to earn money
    if (testState.framesSinceLastAction > 60) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 90 }; // Z
    }
  } else if (gameState.fishingPhase === FISHING_PHASES.SHOP) {
    // Try to purchase upgrades
    if (testState.framesSinceLastAction > 10) {
      testState.framesSinceLastAction = 0;
      
      // Try each upgrade
      const lineLevel = gameState.lineUpgradeLevel;
      const speedLevel = gameState.speedUpgradeLevel;
      const weaponLevel = gameState.weaponUpgradeLevel;
      
      if (lineLevel < UPGRADES.line.length && gameState.cash >= UPGRADES.line[lineLevel].cost) {
        return { key: '1' };
      }
      if (speedLevel < UPGRADES.speed.length && gameState.cash >= UPGRADES.speed[speedLevel].cost) {
        return { key: '2' };
      }
      if (weaponLevel < UPGRADES.weapon.length && gameState.cash >= UPGRADES.weapon[weaponLevel].cost) {
        return { key: '3' };
      }
      
      // Close shop
      return { keyCode: 16 }; // SHIFT
    }
  } else if (gameState.fishingPhase === FISHING_PHASES.DESCENDING) {
    return { keyCode: 39 }; // RIGHT - just steer right
  } else if (gameState.fishingPhase === FISHING_PHASES.ASCENDING) {
    if (testState.framesSinceLastAction > 10) {
      testState.framesSinceLastAction = 0;
      return { keyCode: 32 }; // SPACE
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [37, 39, 32, 90]; // LEFT, RIGHT, SPACE, Z
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomKey };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getShopTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;