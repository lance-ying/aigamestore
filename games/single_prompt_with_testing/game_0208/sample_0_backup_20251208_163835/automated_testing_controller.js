// automated_testing_controller.js - Automated testing strategies

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE, KEY_Z } from './globals.js';

// Helper function to calculate distance
function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Find nearest entity of a type
function findNearest(entities, playerX, playerY) {
  if (!entities || entities.length === 0) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  for (const entity of entities) {
    if (!entity.active) continue;
    const distance = getDistance(playerX, playerY, entity.x, entity.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = entity;
    }
  }
  
  return nearest;
}

// TEST_1: Basic movement and combat testing
function getTest1Action(gameState) {
  if (!gameState.player || !gameState.player.active) return null;
  
  const player = gameState.player;
  
  // Priority 1: Shoot if enemies are nearby
  const nearestEnemy = findNearest(gameState.enemies, player.x, player.y);
  if (nearestEnemy) {
    const distance = getDistance(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
    
    // Shoot if enemy is in range
    if (distance < 200) {
      return { keyCode: KEY_SPACE };
    }
    
    // Move towards enemy if too far
    if (nearestEnemy.x > player.x + 20) {
      return { keyCode: KEY_RIGHT };
    } else if (nearestEnemy.x < player.x - 20) {
      return { keyCode: KEY_LEFT };
    }
  }
  
  // Priority 2: Collect nearby items
  const nearestItem = findNearest(gameState.items, player.x, player.y);
  if (nearestItem) {
    const distance = getDistance(player.x, player.y, nearestItem.x, nearestItem.y);
    
    if (distance < 150) {
      if (nearestItem.x > player.x + 10) {
        return { keyCode: KEY_RIGHT };
      } else if (nearestItem.x < player.x - 10) {
        return { keyCode: KEY_LEFT };
      }
      
      // Jump if item is above
      if (nearestItem.y < player.y - 20) {
        return { keyCode: KEY_UP };
      }
    }
  }
  
  // Priority 3: Random exploration
  if (Math.random() < 0.05) {
    const actions = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_Z];
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
  
  return null;
}

// TEST_2: Optimal strategy to win
function getTest2Action(gameState) {
  if (!gameState.player || !gameState.player.active) return null;
  
  const player = gameState.player;
  
  // Phase 1: If boss exists, focus on defeating it
  if (gameState.boss && gameState.boss.active) {
    const boss = gameState.boss;
    const distance = getDistance(player.x, player.y, boss.x, boss.y);
    
    // Shoot constantly at boss
    if (distance < 300) {
      // Maintain distance and shoot
      if (distance < 100) {
        // Too close, dash away
        if (player.dashTimer <= 0) {
          return { keyCode: KEY_Z };
        }
        // Move away
        return { keyCode: boss.x > player.x ? KEY_LEFT : KEY_RIGHT };
      } else {
        // Good range, shoot
        return { keyCode: KEY_SPACE };
      }
    } else {
      // Move closer to boss
      return { keyCode: boss.x > player.x ? KEY_RIGHT : KEY_LEFT };
    }
  }
  
  // Phase 2: If teleporter not activated, collect items first
  if (gameState.teleporter && !gameState.teleporterActivated) {
    // Collect items if available
    const nearestItem = findNearest(gameState.items, player.x, player.y);
    if (nearestItem) {
      const distance = getDistance(player.x, player.y, nearestItem.x, nearestItem.y);
      
      if (distance < 200 || gameState.itemCounts.DAMAGE < 2) {
        // Move towards item
        if (nearestItem.x > player.x + 10) {
          return { keyCode: KEY_RIGHT };
        } else if (nearestItem.x < player.x - 10) {
          return { keyCode: KEY_LEFT };
        }
        
        // Jump to reach item
        if (nearestItem.y < player.y - 30 && player.onGround) {
          return { keyCode: KEY_UP };
        }
      }
    }
    
    // Move towards teleporter after collecting some items
    const totalItems = Object.values(gameState.itemCounts).reduce((a, b) => a + b, 0);
    if (totalItems >= 3) {
      const dx = gameState.teleporter.x - player.x;
      
      if (Math.abs(dx) > 30) {
        return { keyCode: dx > 0 ? KEY_RIGHT : KEY_LEFT };
      }
      
      // Jump over obstacles
      if (player.onGround && Math.abs(dx) < 100) {
        return { keyCode: KEY_UP };
      }
    }
  }
  
  // Phase 3: Clear enemies while moving
  const nearestEnemy = findNearest(gameState.enemies, player.x, player.y);
  if (nearestEnemy) {
    const distance = getDistance(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
    
    if (distance < 150) {
      // Dash away if too close and health is low
      if (distance < 60 && player.health < player.maxHealth * 0.5 && player.dashTimer <= 0) {
        return { keyCode: KEY_Z };
      }
      
      // Shoot at enemy
      return { keyCode: KEY_SPACE };
    }
  }
  
  // Default: Move right (towards teleporter)
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