// automated_testing_controller.js - Automated testing
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Track position to prevent getting stuck
  if (gameState.positionHistory.length > 60) {
    gameState.positionHistory.shift();
  }
  gameState.positionHistory.push({ x: gameState.player.x, y: gameState.player.y });
  
  // Check if stuck
  let isStuck = false;
  if (gameState.positionHistory.length >= 60) {
    const recent = gameState.positionHistory.slice(-30);
    const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
    const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
    const variance = recent.reduce((sum, p) => {
      return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
    }, 0) / recent.length;
    isStuck = variance < 100;
  }
  
  // Handle upgrade screen
  if (gameState.showUpgradeScreen && gameState.availableUpgrades.length > 0) {
    // Prioritize: Max Health > Damage > Fire Rate > Speed > Others
    let bestIndex = 0;
    let bestPriority = -1;
    
    for (let i = 0; i < gameState.availableUpgrades.length; i++) {
      const upgrade = gameState.availableUpgrades[i];
      let priority = 0;
      
      if (upgrade.name.includes("Fortitude") || upgrade.name.includes("Vitality")) {
        priority = 5;
      } else if (upgrade.name.includes("Med Kit") || upgrade.name.includes("First Aid")) {
        priority = gameState.player.health < gameState.player.maxHealth * 0.5 ? 6 : 2;
      } else if (upgrade.name.includes("Heavy Caliber") || upgrade.name.includes("Sharp")) {
        priority = 4;
      } else if (upgrade.name.includes("Rapid") || upgrade.name.includes("Quick")) {
        priority = 3;
      } else if (upgrade.name.includes("Sprint") || upgrade.name.includes("Swift")) {
        priority = 2;
      } else {
        priority = 1;
      }
      
      if (priority > bestPriority) {
        bestPriority = priority;
        bestIndex = i;
      }
    }
    
    return { upgrade: bestIndex };
  }
  
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, dash: false };
  
  // Find nearest enemy and XP gem
  let nearestEnemy = null;
  let nearestEnemyDist = Infinity;
  let nearestGem = null;
  let nearestGemDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < nearestEnemyDist) {
      nearestEnemyDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  for (const gem of gameState.xpGems) {
    const dist = Math.hypot(gem.x - player.x, gem.y - player.y);
    if (dist < nearestGemDist) {
      nearestGemDist = dist;
      nearestGem = gem;
    }
  }
  
  // Decision making
  const dangerThreshold = 60;
  const gemCollectThreshold = 150;
  const lowHealthThreshold = 50;
  
  let targetX = player.x;
  let targetY = player.y;
  let shouldDash = false;
  
  // Emergency: Low health and close enemy
  if (player.health < lowHealthThreshold && nearestEnemy && nearestEnemyDist < dangerThreshold) {
    // Run away from enemy
    targetX = player.x + (player.x - nearestEnemy.x) * 2;
    targetY = player.y + (player.y - nearestEnemy.y) * 2;
    shouldDash = player.dashCooldown <= 0;
  }
  // Close enemy: Kite (maintain distance)
  else if (nearestEnemy && nearestEnemyDist < dangerThreshold) {
    // Move perpendicular to enemy
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    targetX = player.x - dy;
    targetY = player.y + dx;
    shouldDash = player.dashCooldown <= 0 && nearestEnemyDist < 40;
  }
  // Collect nearby gems
  else if (nearestGem && nearestGemDist < gemCollectThreshold) {
    targetX = nearestGem.x;
    targetY = nearestGem.y;
  }
  // Stay in center area for better positioning
  else if (isStuck || Math.abs(player.x - CANVAS_WIDTH / 2) > 150 || Math.abs(player.y - CANVAS_HEIGHT / 2) > 100) {
    targetX = CANVAS_WIDTH / 2;
    targetY = CANVAS_HEIGHT / 2;
  }
  // Circular movement to dodge
  else {
    const angle = (gameState.gameTime * 2) % (Math.PI * 2);
    targetX = CANVAS_WIDTH / 2 + Math.cos(angle) * 80;
    targetY = CANVAS_HEIGHT / 2 + Math.sin(angle) * 60;
  }
  
  // Calculate movement direction
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (Math.abs(dx) > 5) {
    action.left = dx < 0;
    action.right = dx > 0;
  }
  
  if (Math.abs(dy) > 5) {
    action.up = dy < 0;
    action.down = dy > 0;
  }
  
  action.dash = shouldDash;
  
  return action;
}

function getTestBasicAction(gameState) {
  if (!gameState.player) return null;
  
  // Handle upgrade screen
  if (gameState.showUpgradeScreen && gameState.availableUpgrades.length > 0) {
    return { upgrade: 0 };
  }
  
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, dash: false };
  
  // Simple circular movement
  const angle = (gameState.gameTime * 3) % (Math.PI * 2);
  const targetX = CANVAS_WIDTH / 2 + Math.cos(angle) * 100;
  const targetY = CANVAS_HEIGHT / 2 + Math.sin(angle) * 80;
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (Math.abs(dx) > 5) {
    action.left = dx < 0;
    action.right = dx > 0;
  }
  
  if (Math.abs(dy) > 5) {
    action.up = dy < 0;
    action.down = dy > 0;
  }
  
  return action;
}

function getTestUpgradeAction(gameState) {
  if (!gameState.player) return null;
  
  // Handle upgrade screen - cycle through different upgrades
  if (gameState.showUpgradeScreen && gameState.availableUpgrades.length > 0) {
    const upgradeIndex = gameState.level % gameState.availableUpgrades.length;
    return { upgrade: upgradeIndex };
  }
  
  // Aggressive XP collection
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, dash: false };
  
  let nearestGem = null;
  let nearestGemDist = Infinity;
  
  for (const gem of gameState.xpGems) {
    const dist = Math.hypot(gem.x - player.x, gem.y - player.y);
    if (dist < nearestGemDist) {
      nearestGemDist = dist;
      nearestGem = gem;
    }
  }
  
  if (nearestGem) {
    const dx = nearestGem.x - player.x;
    const dy = nearestGem.y - player.y;
    
    if (Math.abs(dx) > 5) {
      action.left = dx < 0;
      action.right = dx > 0;
    }
    
    if (Math.abs(dy) > 5) {
      action.up = dy < 0;
      action.down = dy > 0;
    }
  }
  
  return action;
}

function getTestDashAction(gameState) {
  if (!gameState.player) return null;
  
  if (gameState.showUpgradeScreen && gameState.availableUpgrades.length > 0) {
    return { upgrade: 0 };
  }
  
  const player = gameState.player;
  const action = { left: false, right: false, up: false, down: false, dash: false };
  
  // Move in a pattern and dash frequently
  const angle = (gameState.gameTime * 4) % (Math.PI * 2);
  const targetX = CANVAS_WIDTH / 2 + Math.cos(angle) * 120;
  const targetY = CANVAS_HEIGHT / 2 + Math.sin(angle) * 90;
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (Math.abs(dx) > 5) {
    action.left = dx < 0;
    action.right = dx > 0;
  }
  
  if (Math.abs(dy) > 5) {
    action.up = dy < 0;
    action.down = dy > 0;
  }
  
  // Dash frequently when available
  action.dash = player.dashCooldown <= 0 && Math.floor(gameState.gameTime * 2) % 2 === 0;
  
  return action;
}

function getRandomAction(gameState) {
  if (!gameState.player) return null;
  
  if (gameState.showUpgradeScreen && gameState.availableUpgrades.length > 0) {
    const randomIndex = Math.floor(Math.random() * gameState.availableUpgrades.length);
    return { upgrade: randomIndex };
  }
  
  return {
    left: Math.random() > 0.5,
    right: Math.random() > 0.5,
    up: Math.random() > 0.5,
    down: Math.random() > 0.5,
    dash: Math.random() > 0.9
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestUpgradeAction(gameState);
    case "TEST_4":
      return getTestDashAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;