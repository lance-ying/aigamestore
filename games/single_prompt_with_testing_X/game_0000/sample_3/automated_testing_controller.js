// automated_testing_controller.js - Automated testing implementation

let lastActionTime = 0;
let actionCooldown = 10; // frames between actions
let stuckCounter = 0;
let lastGold = 0;
let lastLevel = 0;

function getTestWinAction(gameState) {
  // Strategy: Collect all notifications immediately, prioritize Attack upgrades, progress efficiently
  
  const currentTime = gameState.gameTime || 0;
  
  // Always collect notifications first (highest priority)
  if (gameState.notifications && gameState.notifications.length > 0) {
    const uncollected = gameState.notifications.filter(n => !n.collected);
    if (uncollected.length > 0) {
      return 32; // SPACE
    }
  }
  
  // Check if we're stuck
  if (gameState.player.gold === lastGold && gameState.player.level === lastLevel) {
    stuckCounter++;
  } else {
    stuckCounter = 0;
    lastGold = gameState.player.gold;
    lastLevel = gameState.player.level;
  }
  
  // If we have enough gold, go to upgrade screen and purchase
  if (gameState.player.gold >= 50) {
    if (gameState.currentScreen === "COMBAT") {
      return 39; // RIGHT arrow to switch to upgrade
    } else if (gameState.currentScreen === "UPGRADE") {
      // Find best affordable upgrade prioritizing Attack
      const upgrades = gameState.upgradeMenu.upgrades;
      const affordable = upgrades.filter(u => u.cost <= gameState.player.gold);
      
      if (affordable.length > 0) {
        // Prioritize Attack upgrades
        const attackUpgrades = affordable.filter(u => u.stat === "attack");
        let targetUpgrade;
        
        if (attackUpgrades.length > 0) {
          // Get the most expensive attack upgrade we can afford
          targetUpgrade = attackUpgrades.reduce((best, current) => 
            current.cost > best.cost ? current : best
          );
        } else {
          // If no attack upgrades, get most expensive affordable upgrade
          targetUpgrade = affordable.reduce((best, current) => 
            current.cost > best.cost ? current : best
          );
        }
        
        const targetIndex = upgrades.indexOf(targetUpgrade);
        const currentIndex = gameState.upgradeMenu.selectedIndex;
        
        if (currentIndex < targetIndex) {
          return 40; // DOWN
        } else if (currentIndex > targetIndex) {
          return 38; // UP
        } else {
          return 90; // Z to purchase
        }
      }
    }
  }
  
  // Switch back to combat screen to collect more rewards
  if (gameState.currentScreen === "UPGRADE") {
    return 37; // LEFT arrow
  }
  
  // Wait for combat to generate rewards
  return null;
}

function getBasicTestAction(gameState) {
  // Test basic functionality: screen switching, navigation, collection
  
  const time = gameState.gameTime || 0;
  const cycle = Math.floor(time / 120) % 4;
  
  // Cycle through different actions
  switch(cycle) {
    case 0:
      // Collect notifications
      if (gameState.notifications && gameState.notifications.length > 0) {
        return 32; // SPACE
      }
      return 39; // Go right
    case 1:
      // Navigate upgrade menu
      if (gameState.currentScreen === "UPGRADE") {
        return Math.random() < 0.5 ? 38 : 40; // UP or DOWN
      }
      return 39; // Keep going right
    case 2:
      // Try to purchase
      if (gameState.currentScreen === "UPGRADE") {
        return 90; // Z
      }
      return 39;
    case 3:
      // Go back to combat
      return 37; // LEFT
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [32, 37, 38, 39, 40, 90, null, null, null];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  if (!gameState) return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;