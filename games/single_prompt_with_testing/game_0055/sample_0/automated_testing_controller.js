// automated_testing_controller.js - Automated testing AI controller

import { gameState } from './globals.js';

function getTestWinAction() {
  if (!gameState.player) return null;
  
  // Strategy: Aggressively attack nearest enemy while collecting power-ups
  
  // Priority 1: Collect power-ups if nearby and health is low
  if (gameState.player.health < 50 && gameState.powerups.length > 0) {
    const nearestPowerup = findNearest(gameState.player, gameState.powerups);
    if (nearestPowerup) {
      const dist = distance(gameState.player, nearestPowerup);
      if (dist < 150) {
        return moveTowards(gameState.player, nearestPowerup);
      }
    }
  }
  
  // Priority 2: Attack nearest enemy if in range
  if (gameState.enemies.length > 0) {
    const nearestEnemy = findNearest(gameState.player, gameState.enemies);
    if (nearestEnemy) {
      const dist = distance(gameState.player, nearestEnemy);
      
      // Attack if close enough
      if (dist < 50 && gameState.player.swordCooldown === 0) {
        return { keyCode: 90 }; // Z - Attack
      }
      
      // Dash towards enemy if far
      if (dist > 100 && gameState.player.dashCooldown === 0) {
        const moveAction = moveTowards(gameState.player, nearestEnemy);
        // Return dash action
        return { keyCode: 32 }; // Space - Dash
      }
      
      // Use slow-mo if surrounded
      if (gameState.enemies.length > 3 && gameState.slowMoCharge > 60) {
        return { keyCode: 16 }; // Shift - Slow motion
      }
      
      // Move towards enemy
      return moveTowards(gameState.player, nearestEnemy);
    }
  }
  
  // Priority 3: Move to center if at edge
  const centerX = 300;
  const centerY = 200;
  if (distance(gameState.player, { x: centerX, y: centerY }) > 100) {
    return moveTowards(gameState.player, { x: centerX, y: centerY });
  }
  
  return null;
}

function getBasicTestAction() {
  if (!gameState.player) return null;
  
  // Simple circular movement pattern
  const time = gameState.frameCount * 0.05;
  const targetX = 300 + Math.cos(time) * 150;
  const targetY = 200 + Math.sin(time) * 100;
  
  // Occasionally attack
  if (gameState.frameCount % 30 === 0) {
    return { keyCode: 90 }; // Z - Attack
  }
  
  // Occasionally dash
  if (gameState.frameCount % 60 === 0 && gameState.player.dashCooldown === 0) {
    return { keyCode: 32 }; // Space - Dash
  }
  
  return moveTowards(gameState.player, { x: targetX, y: targetY });
}

function getRandomAction() {
  const actions = [37, 38, 39, 40, 32, 90]; // Arrows, Space, Z
  const action = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: action };
}

// Helper functions
function distance(obj1, obj2) {
  const dx = obj2.x - obj1.x;
  const dy = obj2.y - obj1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function findNearest(player, objects) {
  if (objects.length === 0) return null;
  
  let nearest = objects[0];
  let minDist = distance(player, nearest);
  
  for (const obj of objects) {
    const dist = distance(player, obj);
    if (dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  }
  
  return nearest;
}

function moveTowards(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
  } else {
    return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
  }
}

// Main export function
export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction();
    case "TEST_2":
      return getTestWinAction();
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;