// automated_testing_controller.js - AI controllers for automated testing

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z } from './globals.js';

// TEST_1: Basic movement and control testing
function getTest1Action(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const frameCount = gameState.frameCount;
  
  // Pattern-based movement testing
  const cycle = frameCount % 240;
  
  if (cycle < 60) {
    // Move right
    return { keyCode: KEY_RIGHT };
  } else if (cycle < 120) {
    // Move up
    return { keyCode: KEY_UP };
  } else if (cycle < 180) {
    // Move left
    return { keyCode: KEY_LEFT };
  } else {
    // Move down
    return { keyCode: KEY_DOWN };
  }
}

// TEST_2: Combat and win condition testing
function getTest2Action(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDistance = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEnemy = enemy;
    }
  }
  
  // Priority 1: Move toward nearest enemy
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    
    // Fire missile if locked
    if (gameState.lockedTarget && gameState.lockProgress >= 1) {
      return { keyCode: KEY_Z };
    }
    
    // Fire guns
    if (Math.abs(dx) < 150 && Math.abs(dy) < 50) {
      return { keyCode: KEY_SPACE };
    }
    
    // Move toward enemy
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Priority 2: Collect power-ups when no enemies nearby
  if (gameState.powerUps.length > 0) {
    const powerUp = gameState.powerUps[0];
    const dx = powerUp.x - player.x;
    const dy = powerUp.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Priority 3: Attack ground targets
  if (gameState.groundTargets.length > 0) {
    const target = gameState.groundTargets[0];
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    
    if (Math.abs(dx) < 100) {
      return { keyCode: KEY_SPACE };
    }
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Default: Move right
  return { keyCode: KEY_RIGHT };
}

// Main automated testing function
export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;