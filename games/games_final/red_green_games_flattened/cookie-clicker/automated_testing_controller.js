// automated_testing_controller.js - Automated testing logic
import { gameState } from './globals.js';

// Track state for testing
let testState = {
  lastActionFrame: 0,
  strategy: "initial_clicks",
  targetBuilding: null,
  clicksNeeded: 0
};

function getTestWinAction(gameState) {
  const currentFrame = gameState.frameCounter;
  
  // Initial cookie gathering phase
  if (gameState.cookies < 15 && gameState.manualClicks < 20) {
    // Click rapidly to get initial cookies
    if (currentFrame - testState.lastActionFrame > 5) {
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 }; // SPACE
    }
    return null;
  }
  
  // Purchase Cursors first
  if (gameState.buildings[0].count < 3 && gameState.cookies >= gameState.buildings[0].getCost()) {
    // Make sure we're on buildings tab
    if (gameState.currentTab !== "BUILDINGS") {
      return { keyCode: 16 }; // SHIFT
    }
    // Select cursor (index 0)
    if (gameState.selectedIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 90 }; // Z to purchase
  }
  
  // Purchase Grandmas
  if (gameState.buildings[1].count < 2 && gameState.cookies >= gameState.buildings[1].getCost()) {
    if (gameState.currentTab !== "BUILDINGS") {
      return { keyCode: 16 }; // SHIFT
    }
    if (gameState.selectedIndex !== 1) {
      return { keyCode: 40 }; // DOWN
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 90 }; // Z
  }
  
  // Purchase Farms for higher production
  if (gameState.buildings[2].count < 1 && gameState.cookies >= gameState.buildings[2].getCost()) {
    if (gameState.currentTab !== "BUILDINGS") {
      return { keyCode: 16 }; // SHIFT
    }
    if (gameState.selectedIndex !== 2) {
      return { keyCode: 40 }; // DOWN
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 90 }; // Z
  }
  
  // Buy upgrades when available
  const availableUpgrades = gameState.upgrades.filter(u => u.isAvailable() && !u.purchased);
  if (availableUpgrades.length > 0 && gameState.cookies >= availableUpgrades[0].cost) {
    if (gameState.currentTab !== "UPGRADES") {
      return { keyCode: 16 }; // SHIFT
    }
    if (gameState.selectedIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 90 }; // Z
  }
  
  // Keep purchasing more buildings
  if (gameState.cookies >= gameState.buildings[0].getCost()) {
    if (gameState.currentTab !== "BUILDINGS") {
      return { keyCode: 16 }; // SHIFT
    }
    if (gameState.selectedIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    if (currentFrame - testState.lastActionFrame > 30) {
      testState.lastActionFrame = currentFrame;
      return { keyCode: 90 }; // Z
    }
  }
  
  // Click cookie occasionally to supplement income
  if (currentFrame - testState.lastActionFrame > 60) {
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  const currentFrame = gameState.frameCounter;
  
  // Test clicking
  if (gameState.manualClicks < 50) {
    if (currentFrame % 10 === 0) {
      return { keyCode: 32 }; // SPACE
    }
  }
  
  // Test navigation
  if (currentFrame % 120 === 60) {
    return { keyCode: 40 }; // DOWN
  }
  
  if (currentFrame % 120 === 90) {
    return { keyCode: 38 }; // UP
  }
  
  // Test tab switching
  if (currentFrame % 300 === 150) {
    return { keyCode: 16 }; // SHIFT
  }
  
  // Try to purchase when possible
  if (currentFrame % 180 === 0 && gameState.cookies >= 15) {
    return { keyCode: 90 }; // Z
  }
  
  return null;
}

function getUpgradeTestAction(gameState) {
  const currentFrame = gameState.frameCounter;
  
  // Click to earn cookies
  if (gameState.cookies < 100) {
    if (currentFrame % 5 === 0) {
      return { keyCode: 32 }; // SPACE
    }
    return null;
  }
  
  // Buy a cursor to unlock upgrades
  if (gameState.buildings[0].count === 0 && gameState.cookies >= 15) {
    if (gameState.currentTab !== "BUILDINGS") {
      return { keyCode: 16 }; // SHIFT
    }
    if (gameState.selectedIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    return { keyCode: 90 }; // Z
  }
  
  // Switch to upgrades tab
  if (gameState.currentTab !== "UPGRADES") {
    return { keyCode: 16 }; // SHIFT
  }
  
  // Purchase available upgrade
  const availableUpgrades = gameState.upgrades.filter(u => u.isAvailable());
  if (availableUpgrades.length > 0 && gameState.cookies >= availableUpgrades[0].cost) {
    if (gameState.selectedIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    return { keyCode: 90 }; // Z
  }
  
  // Keep clicking
  if (currentFrame % 10 === 0) {
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getNavigationTestAction(gameState) {
  const currentFrame = gameState.frameCounter;
  const pattern = Math.floor(currentFrame / 60) % 8;
  
  switch (pattern) {
    case 0:
      return { keyCode: 40 }; // DOWN
    case 1:
      return { keyCode: 40 }; // DOWN
    case 2:
      return { keyCode: 38 }; // UP
    case 3:
      return { keyCode: 38 }; // UP
    case 4:
      return { keyCode: 16 }; // SHIFT
    case 5:
      return { keyCode: 40 }; // DOWN
    case 6:
      return { keyCode: 16 }; // SHIFT
    case 7:
      return { keyCode: 32 }; // SPACE
    default:
      return null;
  }
}

function getGoldenCookieTestAction(gameState) {
  const currentFrame = gameState.frameCounter;
  
  // Click cookie to trigger golden cookies
  if (currentFrame % 5 === 0) {
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [32, 38, 40, 90, 16]; // SPACE, UP, DOWN, Z, SHIFT
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  
  if (Math.random() < 0.3) {
    return { keyCode: randomKey };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getUpgradeTestAction(gameState);
    case "TEST_4":
      return getNavigationTestAction(gameState);
    case "TEST_5":
      return getGoldenCookieTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;