// automated_testing_controller.js - Automated testing functions
import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return null;

  // Strategy: Gather resources -> Craft equipment -> Clear zones -> Escape
  
  // Phase 1: Gather initial resources
  if (gameState.inventory.wood < 30 || gameState.inventory.stone < 30) {
    // Find nearest destructible
    let nearest = null;
    let minDist = Infinity;
    
    for (const obj of gameState.destructibles) {
      if (!obj.active) continue;
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    }
    
    if (nearest) {
      if (minDist < 50) {
        return "INTERACT";
      } else {
        return moveTowards(player, nearest);
      }
    }
  }

  // Phase 2: Craft equipment
  if (gameState.equippedWeapon === "fists" || gameState.equippedTool === "hands") {
    // Move to nearest crafting station
    let nearest = null;
    let minDist = Infinity;
    
    for (const station of gameState.craftingStations) {
      const dx = station.x - player.x;
      const dy = station.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = station;
      }
    }
    
    if (nearest) {
      const dx = nearest.x - player.x;
      const dy = nearest.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60) {
        return "INTERACT";
      } else {
        return moveTowards(player, nearest);
      }
    }
  }

  // Phase 3: Clear zones (defeat enemies)
  if (gameState.clearedZones.length < 4) {
    // Find nearest active enemy
    let nearest = null;
    let minDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    
    if (nearest) {
      const dx = nearest.x - player.x;
      const dy = nearest.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Keep distance and attack
      if (dist < 150) {
        if (dist < 40 && player.stamina > 20) {
          return "ATTACK";
        } else if (dist > 60) {
          return moveTowards(player, nearest);
        } else {
          // Circle around
          return moveAway(player, nearest);
        }
      } else {
        return moveTowards(player, nearest);
      }
    }
  }

  // Phase 4: Escape
  if (gameState.clearedZones.length >= 4 && gameState.escapePoint) {
    const dx = gameState.escapePoint.x - player.x;
    const dy = gameState.escapePoint.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 70) {
      return "INTERACT";
    } else {
      return moveTowards(player, gameState.escapePoint);
    }
  }

  return null;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;

  // Simple exploration pattern
  const frameCount = gameState.player.x + gameState.player.y; // Use position as pseudo-frame
  
  if (frameCount % 200 < 50) {
    return "RIGHT";
  } else if (frameCount % 200 < 100) {
    return "DOWN";
  } else if (frameCount % 200 < 150) {
    return "LEFT";
  } else {
    return "UP";
  }
}

function getCombatTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;

  // Find nearest enemy and engage
  let nearest = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.active) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  if (nearest) {
    if (minDist < 40 && player.stamina > 20) {
      return "ATTACK";
    } else {
      return moveTowards(player, nearest);
    }
  }

  return "RIGHT";
}

function moveTowards(player, target) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx > absDy) {
    return dx > 0 ? "RIGHT" : "LEFT";
  } else {
    return dy > 0 ? "DOWN" : "UP";
  }
}

function moveAway(player, target) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx > absDy) {
    return dx > 0 ? "LEFT" : "RIGHT";
  } else {
    return dy > 0 ? "UP" : "DOWN";
  }
}

export function get_automated_testing_action(gameState) {
  if (!gameState || !gameState.player) return null;

  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCombatTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;