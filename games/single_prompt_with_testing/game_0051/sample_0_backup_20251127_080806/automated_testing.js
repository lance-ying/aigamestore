// automated_testing.js - Automated testing controller

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, KEY_SHIFT, KEY_Z } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Strategy: Engage nearest enemy, attack, collect power-ups
  
  // Check for nearby power-ups first
  if (gameState.powerUps.length > 0) {
    const nearestPowerUp = findNearest(gameState.player, gameState.powerUps);
    if (nearestPowerUp) {
      const distance = getDistance(gameState.player, nearestPowerUp);
      if (distance < 100) {
        return getMoveTowardAction(gameState.player, nearestPowerUp);
      }
    }
  }
  
  // Find nearest enemy
  if (gameState.enemies.length > 0) {
    const nearestEnemy = findNearest(gameState.player, gameState.enemies);
    if (nearestEnemy) {
      const distance = getDistance(gameState.player, nearestEnemy);
      
      // If enemy is close, decide whether to attack or dodge
      if (distance < 60) {
        // Attack if sword is ready
        if (gameState.player.sword.cooldown === 0) {
          return { keyCode: KEY_SPACE };
        }
        
        // Dash away if enemy is attacking
        if (nearestEnemy.sword.attacking && gameState.player.dash.cooldown === 0) {
          return { keyCode: KEY_SHIFT };
        }
        
        // Block if can't attack or dash
        if (nearestEnemy.sword.attacking) {
          return { keyCode: KEY_Z };
        }
      }
      
      // Move toward enemy if far
      if (distance > 50) {
        return getMoveTowardAction(gameState.player, nearestEnemy);
      }
      
      // Attack when in range
      return { keyCode: KEY_SPACE };
    }
  }
  
  // Move to center if no enemies
  const center = { x: 300, y: 200 };
  return getMoveTowardAction(gameState.player, center);
}

function getRandomAction(gameState) {
  const actions = [
    KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, 
    KEY_SPACE, KEY_SHIFT, KEY_Z
  ];
  
  // 70% movement, 30% actions
  if (Math.random() < 0.7) {
    return { keyCode: actions[Math.floor(Math.random() * 4)] };
  } else {
    return { keyCode: actions[4 + Math.floor(Math.random() * 3)] };
  }
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  // Simple test: move in circles and attack periodically
  const frame = gameState.frameCount;
  const cycle = frame % 240;
  
  if (cycle < 60) {
    return { keyCode: KEY_RIGHT };
  } else if (cycle < 120) {
    return { keyCode: KEY_DOWN };
  } else if (cycle < 180) {
    return { keyCode: KEY_LEFT };
  } else {
    return { keyCode: KEY_UP };
  }
  
  // Attack every 30 frames
  if (frame % 30 === 0) {
    return { keyCode: KEY_SPACE };
  }
}

// Helper functions
function findNearest(entity, targets) {
  if (targets.length === 0) return null;
  
  return targets.reduce((nearest, target) => {
    const distToNearest = getDistance(entity, nearest);
    const distToTarget = getDistance(entity, target);
    return distToTarget < distToNearest ? target : nearest;
  });
}

function getDistance(obj1, obj2) {
  const dx = obj2.x - obj1.x;
  const dy = obj2.y - obj1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMoveTowardAction(entity, target) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  
  // Prioritize larger difference
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
  } else {
    return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;