// automated_testing_controller.js - Automated testing functions

import { gameState, GAME_PHASES, ROD_UPGRADES } from './globals.js';

let testState = {
  positionHistory: [],
  stuckCounter: 0,
  lastAction: null,
  targetWaterIndex: 0,
  shopVisitCounter: 0,
  lastShopFrame: 0
};

function getTestWinAction(gameState) {
  // Strategy: Systematically fish in all areas, upgrade rod when possible, complete journal
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keys: [] };
  }
  
  const player = gameState.player;
  const keys = [];
  
  // Check if we should visit shop
  const nextRodLevel = gameState.rodLevel + 1;
  const canUpgrade = nextRodLevel < ROD_UPGRADES.length && 
                      gameState.money >= ROD_UPGRADES[nextRodLevel].cost;
  
  // Visit shop periodically if we can upgrade
  if (canUpgrade && !gameState.shopOpen && !gameState.fishingLine) {
    if (gameState.player.p.frameCount - testState.lastShopFrame > 180) {
      testState.lastShopFrame = gameState.player.p.frameCount;
      return { keys: [90] }; // Open shop to upgrade
    }
  }
  
  // Close shop if it's open
  if (gameState.shopOpen) {
    return { keys: [90] };
  }
  
  // Handle active fishing
  if (gameState.fishingLine) {
    if (gameState.fishingLine.state === 'biting') {
      return { keys: [32] }; // Reel when biting
    }
    // Wait for bite or complete cast
    return { keys: [] };
  }
  
  // Find target water area to fish
  if (!gameState.waterAreas || gameState.waterAreas.length === 0) {
    return { keys: [] };
  }
  
  // Cycle through water areas
  testState.targetWaterIndex = testState.targetWaterIndex % gameState.waterAreas.length;
  const targetWater = gameState.waterAreas[testState.targetWaterIndex];
  
  const targetX = targetWater.x + targetWater.width / 2;
  const targetY = targetWater.y + targetWater.height / 2;
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If close enough to water, try to fish
  if (distance < ROD_UPGRADES[gameState.rodLevel].castRange * 0.8) {
    if (player.canFish()) {
      // Rotate to next water area after fishing
      testState.targetWaterIndex++;
      return { keys: [32] }; // Cast line
    }
  }
  
  // Move towards target water
  if (Math.abs(dx) > 5) {
    keys.push(dx > 0 ? 39 : 37); // RIGHT or LEFT
  }
  if (Math.abs(dy) > 5) {
    keys.push(dy > 0 ? 40 : 38); // DOWN or UP
  }
  
  // Use sprint for faster movement
  if (keys.length > 0) {
    keys.push(16); // SHIFT
  }
  
  return { keys };
}

function getBasicTestAction(gameState) {
  // Test basic movement and fishing
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keys: [] };
  }
  
  const player = gameState.player;
  const keys = [];
  
  // Handle active fishing
  if (gameState.fishingLine) {
    if (gameState.fishingLine.state === 'biting') {
      return { keys: [32] };
    }
    return { keys: [] };
  }
  
  // Try to fish if near water
  if (player.canFish()) {
    return { keys: [32] };
  }
  
  // Move towards first water area
  if (gameState.waterAreas && gameState.waterAreas.length > 0) {
    const water = gameState.waterAreas[0];
    const targetX = water.x + water.width / 2;
    const targetY = water.y + water.height / 2;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    
    if (Math.abs(dx) > 10) {
      keys.push(dx > 0 ? 39 : 37);
    }
    if (Math.abs(dy) > 10) {
      keys.push(dy > 0 ? 40 : 38);
    }
  }
  
  return { keys };
}

function getShopTestAction(gameState) {
  // Test shop and upgrade system
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keys: [] };
  }
  
  const player = gameState.player;
  
  // Handle active fishing to earn money
  if (gameState.fishingLine) {
    if (gameState.fishingLine.state === 'biting') {
      return { keys: [32] };
    }
    return { keys: [] };
  }
  
  // Try to upgrade if possible
  const nextRodLevel = gameState.rodLevel + 1;
  if (nextRodLevel < ROD_UPGRADES.length && 
      gameState.money >= ROD_UPGRADES[nextRodLevel].cost) {
    if (!gameState.shopOpen) {
      return { keys: [90] }; // Open shop
    } else {
      return { keys: [90] }; // Close shop (upgrade happens on open)
    }
  }
  
  // Fish to earn money
  if (player.canFish()) {
    return { keys: [32] };
  }
  
  // Move to water
  if (gameState.waterAreas && gameState.waterAreas.length > 0) {
    const water = gameState.waterAreas[0];
    const dx = water.x + water.width / 2 - player.x;
    const dy = water.y + water.height / 2 - player.y;
    
    const keys = [];
    if (Math.abs(dx) > 10) keys.push(dx > 0 ? 39 : 37);
    if (Math.abs(dy) > 10) keys.push(dy > 0 ? 40 : 38);
    return { keys };
  }
  
  return { keys: [] };
}

function getMovementTestAction(gameState) {
  // Test movement mechanics including sprint
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keys: [] };
  }
  
  const player = gameState.player;
  const frameCount = player.p ? player.p.frameCount : 0;
  const keys = [];
  
  // Move in patterns to test all directions
  const pattern = Math.floor(frameCount / 60) % 8;
  
  switch(pattern) {
    case 0: keys.push(39); break; // RIGHT
    case 1: keys.push(40); break; // DOWN
    case 2: keys.push(37); break; // LEFT
    case 3: keys.push(38); break; // UP
    case 4: keys.push(39, 40); break; // RIGHT+DOWN
    case 5: keys.push(37, 40); break; // LEFT+DOWN
    case 6: keys.push(37, 38); break; // LEFT+UP
    case 7: keys.push(39, 38); break; // RIGHT+UP
  }
  
  // Add sprint every other cycle
  if (pattern % 2 === 0) {
    keys.push(16);
  }
  
  return { keys };
}

function getRandomAction(gameState) {
  // Random exploration
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keys: [] };
  }
  
  const player = gameState.player;
  const rand = player.p ? player.p.random() : Math.random();
  const keys = [];
  
  // Handle fishing
  if (gameState.fishingLine) {
    if (gameState.fishingLine.state === 'biting') {
      return { keys: [32] };
    }
    return { keys: [] };
  }
  
  // Random actions
  if (rand < 0.3 && player.canFish()) {
    return { keys: [32] };
  }
  
  if (rand < 0.4) {
    return { keys: [90] }; // Toggle shop
  }
  
  // Random movement
  if (rand < 0.5) keys.push(37);
  else if (rand < 0.6) keys.push(39);
  
  if (rand < 0.7) keys.push(38);
  else if (rand < 0.8) keys.push(40);
  
  if (rand < 0.3) keys.push(16); // Sprint
  
  return { keys };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getShopTestAction(gameState);
    case "TEST_4":
      return getMovementTestAction(gameState);
    case "TEST_5":
      return getRandomAction(gameState);
    default:
      return { keys: [] };
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;