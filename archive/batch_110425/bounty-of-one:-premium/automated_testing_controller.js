import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { action: null };
  
  // Strategy: Kite enemies, prioritize survival and upgrade selection
  
  // Handle upgrade selection
  if (gameState.pendingLevelUp && gameState.upgradeChoices.length > 0) {
    // Prioritize damage, health, and attack speed upgrades
    const priorities = ['damage', 'health', 'attackSpeed', 'multishot', 'range'];
    for (const priority of priorities) {
      const index = gameState.upgradeChoices.findIndex(u => u.id === priority);
      if (index !== -1) {
        return { action: 'upgrade', upgradeIndex: index };
      }
    }
    // Default to first choice
    return { action: 'upgrade', upgradeIndex: 0 };
  }
  
  // Calculate center point
  const centerX = 300;
  const centerY = 200;
  
  // Find nearest enemy and nearest orb
  let nearestEnemy = null;
  let nearestEnemyDist = Infinity;
  let nearestOrb = null;
  let nearestOrbDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < nearestEnemyDist) {
      nearestEnemy = enemy;
      nearestEnemyDist = dist;
    }
  }
  
  for (const orb of gameState.experienceOrbs) {
    const dist = Math.hypot(orb.x - player.x, orb.y - player.y);
    if (dist < nearestOrbDist) {
      nearestOrb = orb;
      nearestOrbDist = dist;
    }
  }
  
  // Decision making
  const actions = [];
  
  // Dash if enemy is too close
  if (nearestEnemyDist < 50 && player.dashCooldown === 0) {
    actions.push(32); // Space
  }
  
  // Collect nearby orbs if safe
  const safeDistance = 100;
  if (nearestOrb && nearestOrbDist < 80 && (nearestEnemyDist > safeDistance || !nearestEnemy)) {
    // Move toward orb
    const dx = nearestOrb.x - player.x;
    const dy = nearestOrb.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      actions.push(dx > 0 ? 39 : 37); // Right or Left
    } else {
      actions.push(dy > 0 ? 40 : 38); // Down or Up
    }
  } else {
    // Kiting: Move in circular pattern while maintaining distance
    const angle = Math.atan2(player.y - centerY, player.x - centerX);
    const distFromCenter = Math.hypot(player.x - centerX, player.y - centerY);
    
    // Stay within safe zone
    const targetRadius = 120;
    
    if (nearestEnemy && nearestEnemyDist < 80) {
      // Move away from nearest enemy
      const fleeAngle = Math.atan2(player.y - nearestEnemy.y, player.x - nearestEnemy.x);
      const targetX = player.x + Math.cos(fleeAngle) * 50;
      const targetY = player.y + Math.sin(fleeAngle) * 50;
      
      if (targetX > player.x) actions.push(39); // Right
      if (targetX < player.x) actions.push(37); // Left
      if (targetY > player.y) actions.push(40); // Down
      if (targetY < player.y) actions.push(38); // Up
    } else {
      // Circle around center
      const targetAngle = angle + 0.05;
      const targetX = centerX + Math.cos(targetAngle) * targetRadius;
      const targetY = centerY + Math.sin(targetAngle) * targetRadius;
      
      if (targetX > player.x) actions.push(39); // Right
      if (targetX < player.x) actions.push(37); // Left
      if (targetY > player.y) actions.push(40); // Down
      if (targetY < player.y) actions.push(38); // Up
    }
  }
  
  return { action: 'keys', keys: actions };
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { action: null };
  
  // Handle upgrade selection - pick first choice
  if (gameState.pendingLevelUp) {
    return { action: 'upgrade', upgradeIndex: 0 };
  }
  
  // Simple circular movement
  const centerX = 300;
  const centerY = 200;
  const angle = (Date.now() / 1000) % (Math.PI * 2);
  const radius = 100;
  
  const targetX = centerX + Math.cos(angle) * radius;
  const targetY = centerY + Math.sin(angle) * radius;
  
  const actions = [];
  
  if (targetX > player.x + 10) actions.push(39); // Right
  if (targetX < player.x - 10) actions.push(37); // Left
  if (targetY > player.y + 10) actions.push(40); // Down
  if (targetY < player.y - 10) actions.push(38); // Up
  
  // Dash occasionally
  if (Math.random() < 0.02 && player.dashCooldown === 0) {
    actions.push(32);
  }
  
  return { action: 'keys', keys: actions };
}

function getAggressiveTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { action: null };
  
  // Handle upgrade selection - prioritize pickup range and speed
  if (gameState.pendingLevelUp && gameState.upgradeChoices.length > 0) {
    const priorities = ['pickupRange', 'speed', 'damage', 'health'];
    for (const priority of priorities) {
      const index = gameState.upgradeChoices.findIndex(u => u.id === priority);
      if (index !== -1) {
        return { action: 'upgrade', upgradeIndex: index };
      }
    }
    return { action: 'upgrade', upgradeIndex: 0 };
  }
  
  // Find nearest orb
  let nearestOrb = null;
  let nearestOrbDist = Infinity;
  
  for (const orb of gameState.experienceOrbs) {
    const dist = Math.hypot(orb.x - player.x, orb.y - player.y);
    if (dist < nearestOrbDist) {
      nearestOrb = orb;
      nearestOrbDist = dist;
    }
  }
  
  const actions = [];
  
  // Aggressively move toward orbs
  if (nearestOrb) {
    const dx = nearestOrb.x - player.x;
    const dy = nearestOrb.y - player.y;
    
    if (dx > 5) actions.push(39);
    if (dx < -5) actions.push(37);
    if (dy > 5) actions.push(40);
    if (dy < -5) actions.push(38);
    
    // Dash toward orb if available
    if (nearestOrbDist > 50 && player.dashCooldown === 0) {
      actions.push(32);
    }
  }
  
  return { action: 'keys', keys: actions };
}

function getDefensiveTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { action: null };
  
  // Handle upgrade selection - prioritize health and defense
  if (gameState.pendingLevelUp && gameState.upgradeChoices.length > 0) {
    const priorities = ['health', 'heal', 'dashCooldown', 'speed'];
    for (const priority of priorities) {
      const index = gameState.upgradeChoices.findIndex(u => u.id === priority);
      if (index !== -1) {
        return { action: 'upgrade', upgradeIndex: index };
      }
    }
    return { action: 'upgrade', upgradeIndex: 0 };
  }
  
  // Stay near edges, avoid center
  const edgeMargin = 80;
  const actions = [];
  
  // Find nearest enemy
  let nearestEnemyDist = Infinity;
  for (const enemy of gameState.enemies) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < nearestEnemyDist) nearestEnemyDist = dist;
  }
  
  // If enemy too close, dash away
  if (nearestEnemyDist < 70 && player.dashCooldown === 0) {
    actions.push(32);
  }
  
  // Move along edges
  if (player.x < edgeMargin) actions.push(39); // Move right
  else if (player.x > 600 - edgeMargin) actions.push(37); // Move left
  
  if (player.y < edgeMargin) actions.push(40); // Move down
  else if (player.y > 400 - edgeMargin) actions.push(38); // Move up
  
  return { action: 'keys', keys: actions };
}

function getRandomAction(gameState) {
  const player = gameState.player;
  if (!player) return { action: null };
  
  // Handle upgrade selection randomly
  if (gameState.pendingLevelUp && gameState.upgradeChoices.length > 0) {
    const index = Math.floor(Math.random() * gameState.upgradeChoices.length);
    return { action: 'upgrade', upgradeIndex: index };
  }
  
  const actions = [];
  const keys = [37, 38, 39, 40]; // Arrow keys
  
  // Random movement
  for (const key of keys) {
    if (Math.random() < 0.3) actions.push(key);
  }
  
  // Random dash
  if (Math.random() < 0.05) actions.push(32);
  
  return { action: 'keys', keys: actions };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAggressiveTestAction(gameState);
    case "TEST_4":
      return getDefensiveTestAction(gameState);
    case "TEST_5":
      return getRandomAction(gameState);
    default:
      return { action: null };
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;