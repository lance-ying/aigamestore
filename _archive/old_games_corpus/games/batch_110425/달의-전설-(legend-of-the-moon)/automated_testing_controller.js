// automated_testing_controller.js - Automated testing AI

import {
  KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN,
  KEY_SPACE, KEY_Z, KEY_SHIFT,
  ATTACK_RANGE,
  gameState
} from './globals.js';
import { distance } from './utils.js';

let moveHistory = [];
let stuckCounter = 0;
let lastAction = null;

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player || !player.isAlive()) return null;
  
  // Track position for stuck detection
  trackPosition(player.x, player.y);
  
  // Collect items first
  const nearestItem = findNearestItem(player);
  if (nearestItem) {
    return moveTowards(player, nearestItem.x, nearestItem.y);
  }
  
  // Use heal if low HP
  if (player.hp < player.maxHp * 0.4 && gameState.healCooldown === 0) {
    return KEY_SHIFT;
  }
  
  // Find nearest enemy
  const nearestEnemy = findNearestEnemy(player);
  if (!nearestEnemy) return null;
  
  const dist = distance(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
  
  // Use fireball if available and enemy is far
  if (dist > 80 && dist < 200 && gameState.fireballCooldown === 0) {
    faceEnemy(player, nearestEnemy);
    return KEY_Z;
  }
  
  // Kiting strategy: keep optimal distance
  const optimalDistance = 50;
  
  if (dist < optimalDistance - 10) {
    // Move away
    return moveAway(player, nearestEnemy.x, nearestEnemy.y);
  } else if (dist > optimalDistance + 30) {
    // Move closer
    return moveTowards(player, nearestEnemy.x, nearestEnemy.y);
  } else if (dist < ATTACK_RANGE + 5 && gameState.attackCooldown === 0) {
    // Attack if in range
    return KEY_SPACE;
  } else {
    // Circle around enemy
    return circleAround(player, nearestEnemy);
  }
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player || !player.isAlive()) return null;
  
  // Simple test: move around and attack nearby enemies
  const nearestEnemy = findNearestEnemy(player);
  if (!nearestEnemy) {
    // Explore randomly
    const rand = Math.random();
    if (rand < 0.25) return KEY_LEFT;
    if (rand < 0.5) return KEY_RIGHT;
    if (rand < 0.75) return KEY_UP;
    return KEY_DOWN;
  }
  
  const dist = distance(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
  
  if (dist < ATTACK_RANGE && gameState.attackCooldown === 0) {
    return KEY_SPACE;
  }
  
  return moveTowards(player, nearestEnemy.x, nearestEnemy.y);
}

function getSkillTestAction(gameState) {
  const player = gameState.player;
  if (!player || !player.isAlive()) return null;
  
  // Test all skills
  const nearestEnemy = findNearestEnemy(player);
  if (!nearestEnemy) return null;
  
  const dist = distance(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
  
  // Test fireball
  if (gameState.fireballCooldown === 0 && dist > 50) {
    faceEnemy(player, nearestEnemy);
    return KEY_Z;
  }
  
  // Test heal
  if (gameState.healCooldown === 0 && player.hp < player.maxHp * 0.8) {
    return KEY_SHIFT;
  }
  
  // Move and attack
  if (dist < ATTACK_RANGE && gameState.attackCooldown === 0) {
    return KEY_SPACE;
  }
  
  return moveTowards(player, nearestEnemy.x, nearestEnemy.y);
}

function findNearestEnemy(player) {
  let nearest = null;
  let minDist = Infinity;
  
  gameState.enemies.forEach(enemy => {
    if (!enemy.isAlive) return;
    const dist = distance(player.x, player.y, enemy.x, enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  });
  
  return nearest;
}

function findNearestItem(player) {
  let nearest = null;
  let minDist = Infinity;
  
  gameState.items.forEach(item => {
    if (item.collected) return;
    const dist = distance(player.x, player.y, item.x, item.y);
    if (dist < minDist && dist < 150) {
      minDist = dist;
      nearest = item;
    }
  });
  
  return nearest;
}

function moveTowards(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? KEY_RIGHT : KEY_LEFT;
  } else {
    return dy > 0 ? KEY_DOWN : KEY_UP;
  }
}

function moveAway(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? KEY_LEFT : KEY_RIGHT;
  } else {
    return dy > 0 ? KEY_UP : KEY_DOWN;
  }
}

function circleAround(player, enemy) {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const newAngle = angle + Math.PI / 4;
  const targetX = enemy.x + Math.cos(newAngle) * 60;
  const targetY = enemy.y + Math.sin(newAngle) * 60;
  return moveTowards(player, targetX, targetY);
}

function faceEnemy(player, enemy) {
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    player.facingDirection = dx > 0 ? 3 : 1;
  } else {
    player.facingDirection = dy > 0 ? 0 : 2;
  }
}

function trackPosition(x, y) {
  moveHistory.push({ x, y });
  if (moveHistory.length > 60) {
    moveHistory.shift();
  }
  
  // Check if stuck
  if (moveHistory.length >= 60) {
    const recent = moveHistory.slice(-30);
    const variance = calculateVariance(recent);
    if (variance < 100) {
      stuckCounter++;
    } else {
      stuckCounter = 0;
    }
  }
}

function calculateVariance(positions) {
  const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
  const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
  const variance = positions.reduce((sum, p) => {
    return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
  }, 0) / positions.length;
  return variance;
}

function getRandomAction() {
  const actions = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSkillTestAction(gameState);
    default:
      return getRandomAction();
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;