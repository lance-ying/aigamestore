// automated_testing.js - Automated testing controller

import { gameState, CANVAS_WIDTH } from './globals.js';

function getDistanceToTarget(entity, target) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getNearestGem(player) {
  if (gameState.gems.length === 0) return null;
  
  let nearest = gameState.gems[0];
  let minDist = getDistanceToTarget(player, nearest);
  
  for (const gem of gameState.gems) {
    const dist = getDistanceToTarget(player, gem);
    if (dist < minDist) {
      minDist = dist;
      nearest = gem;
    }
  }
  
  return nearest;
}

function getNearestEnemy(player) {
  if (gameState.enemies.length === 0) return null;
  
  let nearest = gameState.enemies[0];
  let minDist = getDistanceToTarget(player, nearest);
  
  for (const enemy of gameState.enemies) {
    const dist = getDistanceToTarget(player, enemy);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function getBasicTestingAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const frameCount = gameState.frameCount;
  
  // Basic movement pattern: move right, jump periodically
  if (frameCount % 120 < 60) {
    return { keyCode: 39 }; // Right
  } else if (frameCount % 120 === 60) {
    return { keyCode: 32 }; // Jump
  } else if (frameCount % 120 === 80) {
    return { keyCode: 90 }; // Attack
  } else {
    return { keyCode: 37 }; // Left
  }
}

function getWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Priority 1: Attack nearby enemies
  const nearestEnemy = getNearestEnemy(player);
  if (nearestEnemy) {
    const distToEnemy = getDistanceToTarget(player, nearestEnemy);
    
    if (distToEnemy < 40) {
      // Attack enemy
      return { keyCode: 90 }; // Z - Attack
    } else if (distToEnemy < 100) {
      // Move towards enemy
      if (nearestEnemy.x > player.x) {
        return { keyCode: 39 }; // Right
      } else {
        return { keyCode: 37 }; // Left
      }
    }
  }
  
  // Priority 2: Collect gems
  const nearestGem = getNearestGem(player);
  if (nearestGem) {
    const dx = nearestGem.x - player.x;
    const dy = nearestGem.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Jump if gem is above
    if (dy < -30 && player.onGround && Math.abs(dx) < 40) {
      return { keyCode: 32 }; // Space - Jump
    }
    
    // Move towards gem
    if (Math.abs(dx) > 20) {
      if (dx > 0) {
        return { keyCode: 39 }; // Right
      } else {
        return { keyCode: 37 }; // Left
      }
    }
    
    // Jump if gem is close but above
    if (dy < -10 && player.onGround) {
      return { keyCode: 32 }; // Space
    }
  }
  
  // Default: explore
  if (player.x < 100) {
    return { keyCode: 39 }; // Right
  } else if (player.x > CANVAS_WIDTH - 100) {
    return { keyCode: 37 }; // Left
  } else if (gameState.frameCount % 60 === 0) {
    return { keyCode: 32 }; // Jump occasionally
  }
  
  return { keyCode: 39 }; // Default right
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestingAction(gameState);
    case "TEST_2":
      return getWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;