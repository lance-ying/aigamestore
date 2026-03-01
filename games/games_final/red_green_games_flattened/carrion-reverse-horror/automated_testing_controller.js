// automated_testing_controller.js - Automated testing AI

import { gameState, distance, angleBetween } from './globals.js';

// TEST_1: Basic movement and consumption testing
function getTest1Action() {
  if (!gameState.player || gameState.humans.length === 0) {
    return null;
  }
  
  // Find nearest human
  let nearest = null;
  let minDist = Infinity;
  
  for (let human of gameState.humans) {
    const dist = distance(gameState.player.x, gameState.player.y, human.x, human.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = human;
    }
  }
  
  if (!nearest) return null;
  
  // Move towards nearest human
  const angle = angleBetween(gameState.player.x, gameState.player.y, nearest.x, nearest.y);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  
  // Choose direction key
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Right or Left
  } else {
    return dy > 0 ? { keyCode: 40 } : { keyCode: 38 }; // Down or Up
  }
}

// TEST_2: Optimal win strategy
function getTest2Action() {
  if (!gameState.player || gameState.humans.length === 0) {
    return null;
  }
  
  // Find nearest human
  let nearest = null;
  let minDist = Infinity;
  
  for (let human of gameState.humans) {
    const dist = distance(gameState.player.x, gameState.player.y, human.x, human.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = human;
    }
  }
  
  if (!nearest) return null;
  
  const dist = distance(gameState.player.x, gameState.player.y, nearest.x, nearest.y);
  
  // Use lunge if close enough
  if (dist < 50 && gameState.player.lungeCooldown === 0) {
    return { keyCode: 32 }; // Space
  }
  
  // Use tentacles if available and target is at medium range
  if (dist > 50 && dist < 150 && gameState.canUseTentacles) {
    return { keyCode: 16 }; // Shift
  }
  
  // Use blood trail for speed if available and far from target
  if (dist > 100 && gameState.canUseBloodTrail && 
      !gameState.bloodTrailActive && gameState.bloodTrailCooldown === 0) {
    return { keyCode: 90 }; // Z
  }
  
  // Move towards nearest human
  const angle = angleBetween(gameState.player.x, gameState.player.y, nearest.x, nearest.y);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  
  // Choose direction key with priority to larger component
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Right or Left
  } else {
    return dy > 0 ? { keyCode: 40 } : { keyCode: 38 }; // Down or Up
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action();
    case "TEST_2":
      return getTest2Action();
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}