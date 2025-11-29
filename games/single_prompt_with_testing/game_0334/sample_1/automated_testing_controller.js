// automated_testing_controller.js - AI controller for testing

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, KEY_Z } from './globals.js';
import { distance } from './utils.js';

function findNearestItem(itemType) {
  if (!gameState.player) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  for (const collectible of gameState.collectibles) {
    if (itemType === 'any' || collectible.type === itemType) {
      const dist = distance(
        gameState.player.x,
        gameState.player.y,
        collectible.x,
        collectible.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = collectible;
      }
    }
  }
  
  return nearest;
}

function findNearestEnemy() {
  if (!gameState.player) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dist = distance(
      gameState.player.x,
      gameState.player.y,
      enemy.x,
      enemy.y
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function moveTowards(targetX, targetY) {
  if (!gameState.player) return null;
  
  const dx = targetX - gameState.player.x;
  const dy = targetY - gameState.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 10) return null;
  
  // Dash if far away and have energy
  if (dist > 100 && gameState.player.energy > 20) {
    const timeSinceDash = gameState.frameCount - gameState.lastDashTime;
    if (timeSinceDash > 40) {
      return { keyCode: KEY_SPACE };
    }
  }
  
  // Move towards target
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
  } else {
    return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
  }
}

function getBasicMovementAction() {
  if (!gameState.player) return null;
  
  // Simple exploration pattern
  const time = gameState.frameCount;
  
  if (time % 120 < 30) return { keyCode: KEY_RIGHT };
  if (time % 120 < 60) return { keyCode: KEY_DOWN };
  if (time % 120 < 90) return { keyCode: KEY_LEFT };
  return { keyCode: KEY_UP };
}

function getCombatAction() {
  if (!gameState.player) return null;
  
  const enemy = findNearestEnemy();
  
  if (!enemy) {
    // No enemies, explore
    return getBasicMovementAction();
  }
  
  const dist = distance(
    gameState.player.x,
    gameState.player.y,
    enemy.x,
    enemy.y
  );
  
  // If low health, try to collect health pickups
  if (gameState.player.health < 40) {
    const healthPickup = findNearestItem('health');
    if (healthPickup) {
      return moveTowards(healthPickup.x, healthPickup.y);
    }
  }
  
  // Attack if in range
  if (dist < 50 && gameState.player.energy > 15) {
    const timeSinceAttack = gameState.frameCount - gameState.lastAttackTime;
    if (timeSinceAttack > 25) {
      return { keyCode: KEY_Z };
    }
  }
  
  // Move towards enemy
  if (dist > 40) {
    return moveTowards(enemy.x, enemy.y);
  }
  
  // Dash away if too close and low health
  if (dist < 30 && gameState.player.health < 50) {
    return { keyCode: KEY_SPACE };
  }
  
  return moveTowards(enemy.x, enemy.y);
}

function getCollectionAction() {
  if (!gameState.player) return null;
  
  // Prioritize health if low
  if (gameState.player.health < 60) {
    const healthPickup = findNearestItem('health');
    if (healthPickup) {
      return moveTowards(healthPickup.x, healthPickup.y);
    }
  }
  
  // Prioritize energy if low
  if (gameState.player.energy < 40) {
    const energyPickup = findNearestItem('energy');
    if (energyPickup) {
      return moveTowards(energyPickup.x, energyPickup.y);
    }
  }
  
  // Collect any nearby item
  const nearest = findNearestItem('any');
  if (nearest) {
    return moveTowards(nearest.x, nearest.y);
  }
  
  return getBasicMovementAction();
}

function getHazardTestAction() {
  // Deliberately test hazards
  if (!gameState.player) return null;
  
  if (gameState.hazards.length === 0) {
    return getBasicMovementAction();
  }
  
  // Move towards nearest hazard
  let nearest = null;
  let minDist = Infinity;
  
  for (const hazard of gameState.hazards) {
    const dist = distance(
      gameState.player.x,
      gameState.player.y,
      hazard.x,
      hazard.y
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = hazard;
    }
  }
  
  if (nearest && minDist > 20) {
    return moveTowards(nearest.x, nearest.y);
  }
  
  // After testing hazards, collect health
  const healthPickup = findNearestItem('health');
  if (healthPickup && gameState.player.health < 70) {
    return moveTowards(healthPickup.x, healthPickup.y);
  }
  
  return getBasicMovementAction();
}

function getWinAction() {
  if (!gameState.player) return null;
  
  // Priority 1: Collect crystals
  const crystal = findNearestItem('crystal');
  if (crystal) {
    const dist = distance(
      gameState.player.x,
      gameState.player.y,
      crystal.x,
      crystal.y
    );
    
    // Attack nearby enemies
    const enemy = findNearestEnemy();
    if (enemy) {
      const enemyDist = distance(
        gameState.player.x,
        gameState.player.y,
        enemy.x,
        enemy.y
      );
      
      if (enemyDist < 60 && gameState.player.energy > 15) {
        const timeSinceAttack = gameState.frameCount - gameState.lastAttackTime;
        if (timeSinceAttack > 25) {
          return { keyCode: KEY_Z };
        }
      }
    }
    
    // Dash towards crystal if far
    if (dist > 150 && gameState.player.energy > 25) {
      const timeSinceDash = gameState.frameCount - gameState.lastDashTime;
      if (timeSinceDash > 35) {
        return { keyCode: KEY_SPACE };
      }
    }
    
    return moveTowards(crystal.x, crystal.y);
  }
  
  // Priority 2: Maintain health
  if (gameState.player.health < 50) {
    const healthPickup = findNearestItem('health');
    if (healthPickup) {
      return moveTowards(healthPickup.x, healthPickup.y);
    }
  }
  
  // Priority 3: Maintain energy
  if (gameState.player.energy < 40) {
    const energyPickup = findNearestItem('energy');
    if (energyPickup) {
      return moveTowards(energyPickup.x, energyPickup.y);
    }
  }
  
  return getBasicMovementAction();
}

function getLoseAction() {
  if (!gameState.player) return null;
  
  // Deliberately take damage
  const enemy = findNearestEnemy();
  if (enemy) {
    return moveTowards(enemy.x, enemy.y);
  }
  
  // Or move into hazards
  if (gameState.hazards.length > 0) {
    const hazard = gameState.hazards[0];
    return moveTowards(hazard.x, hazard.y);
  }
  
  return getBasicMovementAction();
}

export function get_automated_testing_action(gs) {
  if (gs.gamePhase !== "PLAYING") return null;
  
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicMovementAction();
    case "TEST_2":
      return getCombatAction();
    case "TEST_3":
      return getCollectionAction();
    case "TEST_4":
      return getHazardTestAction();
    case "TEST_5":
      return getWinAction();
    case "TEST_6":
      return getLoseAction();
    case "TEST_7":
      return getWinAction();
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;