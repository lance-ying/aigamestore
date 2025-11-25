// automated_testing_controller.js - Automated testing logic

import { gameState, GAME_PHASES } from './globals.js';

// Test 1: Basic gameplay testing
function getTest1Action(state) {
  if (!state.player) return null;
  
  // Handle upgrade selection
  if (state.isPendingUpgrade && state.upgradesAvailable.length > 0) {
    // Prefer damage and fire rate upgrades
    for (let i = 0; i < state.upgradesAvailable.length; i++) {
      const upgrade = state.upgradesAvailable[i];
      if (upgrade.type === 'damage' || upgrade.type === 'fireRate') {
        return { selectUpgrade: i };
      }
    }
    return { selectUpgrade: 0 };
  }
  
  const player = state.player;
  const action = { move: { x: 0, y: 0 }, shoot: false, dash: false, special: false };
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Move in circular pattern
  const time = Date.now() / 1000;
  action.move.x = Math.cos(time * 2) * 0.5;
  action.move.y = Math.sin(time * 2) * 0.5;
  
  // Shoot continuously
  action.shoot = true;
  
  // Dash if enemy too close
  if (nearestEnemy && minDist < 50) {
    action.dash = true;
  }
  
  return action;
}

// Test 2: Optimal win strategy
function getTest2Action(state) {
  if (!state.player) return null;
  
  // Handle upgrade selection - prioritize damage and fire rate
  if (state.isPendingUpgrade && state.upgradesAvailable.length > 0) {
    for (let i = 0; i < state.upgradesAvailable.length; i++) {
      const upgrade = state.upgradesAvailable[i];
      if (upgrade.type === 'damage') return { selectUpgrade: i };
    }
    for (let i = 0; i < state.upgradesAvailable.length; i++) {
      const upgrade = state.upgradesAvailable[i];
      if (upgrade.type === 'fireRate') return { selectUpgrade: i };
    }
    for (let i = 0; i < state.upgradesAvailable.length; i++) {
      const upgrade = state.upgradesAvailable[i];
      if (upgrade.type === 'multishot') return { selectUpgrade: i };
    }
    return { selectUpgrade: 0 };
  }
  
  const player = state.player;
  const action = { move: { x: 0, y: 0 }, shoot: true, dash: false, special: false };
  
  // Calculate center position
  const centerX = 300;
  const centerY = 200;
  const radius = 80;
  
  // Find nearest threat
  let nearestEnemy = null;
  let minDist = Infinity;
  let enemyCluster = { x: 0, y: 0, count: 0 };
  
  for (const enemy of state.enemies) {
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
    
    // Calculate enemy cluster center
    if (dist < 150) {
      enemyCluster.x += enemy.x;
      enemyCluster.y += enemy.y;
      enemyCluster.count++;
    }
  }
  
  if (enemyCluster.count > 0) {
    enemyCluster.x /= enemyCluster.count;
    enemyCluster.y /= enemyCluster.count;
  }
  
  // Kiting strategy: stay in center area, avoid clusters
  const distToCenter = Math.sqrt((player.x - centerX) ** 2 + (player.y - centerY) ** 2);
  
  if (distToCenter > radius) {
    // Move toward center
    const dx = centerX - player.x;
    const dy = centerY - player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    action.move.x = dx / len;
    action.move.y = dy / len;
  } else if (enemyCluster.count > 0) {
    // Move away from enemy cluster
    const dx = player.x - enemyCluster.x;
    const dy = player.y - enemyCluster.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      action.move.x = dx / len;
      action.move.y = dy / len;
    }
  } else {
    // Circle strafe
    const time = Date.now() / 1000;
    const angle = time * 1.5;
    const targetX = centerX + Math.cos(angle) * radius;
    const targetY = centerY + Math.sin(angle) * radius;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 5) {
      action.move.x = dx / len;
      action.move.y = dy / len;
    }
  }
  
  // Emergency dash if overwhelmed
  if (minDist < 40 || (enemyCluster.count > 5 && minDist < 80)) {
    action.dash = true;
  }
  
  // Use special when charged and enemies nearby
  if (player.specialCharge >= player.specialMaxCharge && state.enemies.length > 3) {
    action.special = true;
  }
  
  return action;
}

// Random action fallback
function getRandomAction(state) {
  if (!state.player) return null;
  
  if (state.isPendingUpgrade && state.upgradesAvailable.length > 0) {
    return { selectUpgrade: Math.floor(Math.random() * state.upgradesAvailable.length) };
  }
  
  return {
    move: {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1
    },
    shoot: Math.random() > 0.3,
    dash: Math.random() > 0.95,
    special: Math.random() > 0.98
  };
}

// Main automated testing controller
export function get_automated_testing_action(state) {
  switch(state.controlMode) {
    case "TEST_1":
      return getTest1Action(state);
    case "TEST_2":
      return getTest2Action(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;

export default get_automated_testing_action;