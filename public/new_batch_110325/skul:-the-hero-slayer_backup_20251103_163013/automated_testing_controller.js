// automated_testing_controller.js
import { gameState } from './globals.js';

function getTestBasicAction(gameState) {
  // Basic movement and attack test
  const action = { left: false, right: false, up: false, space: false, shift: false, z: false };
  
  if (!gameState.player) return action;
  
  const p = window.gameInstance;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDistance = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (!enemy.dead) {
      const distance = Math.abs(gameState.player.x - enemy.x);
      if (distance < minDistance) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }
  }
  
  if (nearestEnemy) {
    // Move towards enemy
    if (gameState.player.x < nearestEnemy.x - 100) {
      action.right = true;
    } else if (gameState.player.x > nearestEnemy.x + 100) {
      action.left = true;
    }
    
    // Attack when in range
    if (minDistance < 250) {
      action.space = true;
    }
    
    // Jump occasionally
    if (p.frameCount % 120 === 0 && gameState.player.onGround) {
      action.up = true;
    }
    
    // Dash to dodge
    if (minDistance < 50 && Date.now() - gameState.lastDashTime > 1000) {
      action.shift = true;
    }
  } else {
    // No enemies, move right to explore
    action.right = true;
  }
  
  // Collect items
  for (let item of gameState.items) {
    if (!item.collected) {
      if (Math.abs(gameState.player.x - item.x) < 30) {
        // Already close enough
      } else if (gameState.player.x < item.x) {
        action.right = true;
        action.left = false;
      } else {
        action.left = true;
        action.right = false;
      }
      break;
    }
  }
  
  return action;
}

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  const action = { left: false, right: false, up: false, space: false, shift: false, z: false };
  
  if (!gameState.player) return action;
  
  const p = window.gameInstance;
  
  // Priority 1: Collect skulls
  let nearestSkull = null;
  let skullDistance = Infinity;
  for (let skull of gameState.skulls) {
    if (!skull.collected) {
      const distance = Math.abs(gameState.player.x - skull.x);
      if (distance < skullDistance) {
        skullDistance = distance;
        nearestSkull = skull;
      }
    }
  }
  
  if (nearestSkull && skullDistance < 150) {
    if (gameState.player.x < nearestSkull.x - 10) {
      action.right = true;
    } else if (gameState.player.x > nearestSkull.x + 10) {
      action.left = true;
    }
    return action;
  }
  
  // Priority 2: Collect items
  let nearestItem = null;
  let itemDistance = Infinity;
  for (let item of gameState.items) {
    if (!item.collected) {
      const distance = Math.abs(gameState.player.x - item.x);
      if (distance < itemDistance) {
        itemDistance = distance;
        nearestItem = item;
      }
    }
  }
  
  if (nearestItem && itemDistance < 100) {
    if (gameState.player.x < nearestItem.x - 10) {
      action.right = true;
    } else if (gameState.player.x > nearestItem.x + 10) {
      action.left = true;
    }
    return action;
  }
  
  // Priority 3: Combat strategy
  let nearestEnemy = null;
  let minDistance = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (!enemy.dead) {
      const distance = Math.sqrt(
        Math.pow(gameState.player.x - enemy.x, 2) + 
        Math.pow(gameState.player.y - enemy.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }
  }
  
  if (nearestEnemy) {
    const optimalDistance = 180; // Maintain this distance for safe attacking
    const dx = nearestEnemy.x - gameState.player.x;
    const dy = nearestEnemy.y - gameState.player.y;
    
    // Health-based strategy
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    
    if (healthPercent < 0.3 && minDistance < 80) {
      // Low health - retreat and dash away
      action.shift = true;
      action.left = dx > 0;
      action.right = dx < 0;
    } else if (minDistance < 60) {
      // Too close - dash away
      action.shift = true;
      action.left = dx > 0;
      action.right = dx < 0;
    } else if (minDistance > optimalDistance + 30) {
      // Too far - move closer
      action.right = dx > 0;
      action.left = dx < 0;
    } else if (minDistance > optimalDistance - 30 && minDistance < optimalDistance + 30) {
      // Perfect range - attack while maintaining position
      action.space = true;
      
      // Slight adjustments
      if (dx > 20) action.right = true;
      if (dx < -20) action.left = true;
      
      // Strafe to avoid projectiles
      if (p.frameCount % 60 < 30) {
        action.right = true;
      } else {
        action.left = true;
      }
    } else {
      // Move to optimal distance
      action.right = dx > 0;
      action.left = dx < 0;
      action.space = true;
    }
    
    // Jump to dodge
    if (minDistance < 100 && gameState.player.onGround && p.frameCount % 90 === 0) {
      action.up = true;
    }
    
    // Swap skull if better option available
    if (gameState.player.collectedSkulls.length > 1) {
      if (p.frameCount % 180 === 0) {
        action.z = true;
      }
    }
  } else {
    // No enemies - patrol and explore
    if (gameState.player.x < 100) {
      action.right = true;
    } else if (gameState.player.x > 500) {
      action.left = true;
    } else {
      action.right = p.frameCount % 120 < 60;
      action.left = !action.right;
    }
  }
  
  // Check for stalling
  if (gameState.positionHistory.length > 50) {
    const recentPositions = gameState.positionHistory.slice(-50);
    const avgX = recentPositions.reduce((sum, pos) => sum + pos.x, 0) / recentPositions.length;
    const variance = recentPositions.reduce((sum, pos) => sum + Math.pow(pos.x - avgX, 2), 0) / recentPositions.length;
    
    if (variance < 100) {
      // Stalling detected - force movement
      action.right = true;
      action.up = true;
    }
  }
  
  return action;
}

function getTestSkullSwapAction(gameState) {
  // Test skull swapping mechanics
  const action = { left: false, right: false, up: false, space: false, shift: false, z: false };
  
  if (!gameState.player) return action;
  
  const p = window.gameInstance;
  
  // Collect skulls first
  for (let skull of gameState.skulls) {
    if (!skull.collected) {
      if (gameState.player.x < skull.x - 10) {
        action.right = true;
      } else if (gameState.player.x > skull.x + 10) {
        action.left = true;
      }
      return action;
    }
  }
  
  // Swap skulls frequently
  if (p.frameCount % 60 === 0 && gameState.player.collectedSkulls.length > 1) {
    action.z = true;
  }
  
  // Attack with each skull
  if (gameState.enemies.length > 0) {
    action.space = true;
    const nearestEnemy = gameState.enemies[0];
    action.right = gameState.player.x < nearestEnemy.x;
    action.left = gameState.player.x > nearestEnemy.x;
  }
  
  return action;
}

function getTestItemCollectionAction(gameState) {
  // Test item collection
  const action = { left: false, right: false, up: false, space: false, shift: false, z: false };
  
  if (!gameState.player) return action;
  
  // Attack enemies to generate items
  if (gameState.enemies.length > 0) {
    const nearestEnemy = gameState.enemies[0];
    action.space = true;
    if (Math.abs(gameState.player.x - nearestEnemy.x) < 200) {
      action.right = gameState.player.x < nearestEnemy.x - 100;
      action.left = gameState.player.x > nearestEnemy.x + 100;
    } else {
      action.right = gameState.player.x < nearestEnemy.x;
      action.left = gameState.player.x > nearestEnemy.x;
    }
  }
  
  // Collect items
  for (let item of gameState.items) {
    if (!item.collected) {
      if (gameState.player.x < item.x - 5) {
        action.right = true;
        action.left = false;
      } else if (gameState.player.x > item.x + 5) {
        action.left = true;
        action.right = false;
      }
      break;
    }
  }
  
  return action;
}

function getTestDeathAction(gameState) {
  // Test death mechanics - intentionally take damage
  const action = { left: false, right: false, up: false, space: false, shift: false, z: false };
  
  if (!gameState.player) return action;
  
  // Move towards enemies without attacking
  if (gameState.enemies.length > 0) {
    const nearestEnemy = gameState.enemies[0];
    action.right = gameState.player.x < nearestEnemy.x;
    action.left = gameState.player.x > nearestEnemy.x;
    // Don't attack or dash
  }
  
  return action;
}

function getRandomAction(gameState) {
  const p = window.gameInstance;
  const action = { left: false, right: false, up: false, space: false, shift: false, z: false };
  
  if (p.random() < 0.3) action.left = true;
  if (p.random() < 0.3) action.right = true;
  if (p.random() < 0.1) action.up = true;
  if (p.random() < 0.2) action.space = true;
  if (p.random() < 0.05) action.shift = true;
  if (p.random() < 0.05) action.z = true;
  
  return action;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestSkullSwapAction(gameState);
    case "TEST_4":
      return getTestItemCollectionAction(gameState);
    case "TEST_5":
      return getTestDeathAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;