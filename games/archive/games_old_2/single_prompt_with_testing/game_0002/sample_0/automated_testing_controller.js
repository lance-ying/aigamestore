// automated_testing_controller.js - Automated testing strategies

import { gameState, TURN_PHASES, WEAPON_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Systematically eliminate all enemy worms with optimal positioning and aiming
  
  if (gameState.turnPhase === TURN_PHASES.MOVEMENT) {
    const activeWorm = gameState.entities.find(w => w.isActive);
    if (!activeWorm) return {};
    
    // Find nearest enemy
    const enemies = gameState.currentTeam === 0 ? gameState.enemyWorms : gameState.playerWorms;
    const aliveEnemies = enemies.filter(e => !e.isDead);
    
    if (aliveEnemies.length === 0) return {};
    
    let nearestEnemy = aliveEnemies[0];
    let minDist = Math.abs(activeWorm.x - nearestEnemy.x);
    
    for (const enemy of aliveEnemies) {
      const dist = Math.abs(activeWorm.x - enemy.x);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    // Move towards enemy if far, or position for shot
    const idealDist = 150;
    const currentDist = activeWorm.x - nearestEnemy.x;
    
    if (Math.abs(currentDist) > idealDist + 30) {
      // Move closer
      if (currentDist > 0) {
        return { left: true };
      } else {
        return { right: true };
      }
    } else if (Math.abs(currentDist) < idealDist - 30) {
      // Move away for better angle
      if (currentDist > 0) {
        return { right: true };
      } else {
        return { left: true };
      }
    }
    
    return {}; // Wait for attack phase
  }
  
  if (gameState.turnPhase === TURN_PHASES.ATTACK) {
    const activeWorm = gameState.entities.find(w => w.isActive);
    if (!activeWorm) return {};
    
    // Select best weapon (prefer bazooka)
    if (gameState.selectedWeapon !== WEAPON_TYPES.BAZOOKA) {
      return { cycleWeapon: true };
    }
    
    // Find target enemy
    const enemies = gameState.currentTeam === 0 ? gameState.enemyWorms : gameState.playerWorms;
    const aliveEnemies = enemies.filter(e => !e.isDead);
    
    if (aliveEnemies.length === 0) return {};
    
    let target = aliveEnemies[0];
    let minDist = Math.sqrt(
      Math.pow(activeWorm.x - target.x, 2) + 
      Math.pow(activeWorm.y - target.y, 2)
    );
    
    for (const enemy of aliveEnemies) {
      const dist = Math.sqrt(
        Math.pow(activeWorm.x - enemy.x, 2) + 
        Math.pow(activeWorm.y - enemy.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }
    
    // Calculate ideal aim
    const dx = target.x - activeWorm.x;
    const dy = target.y - activeWorm.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate trajectory accounting for gravity
    const idealAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const idealPower = Math.min(100, 30 + (distance / 5));
    
    // Adjust aim
    const angleDiff = idealAngle - gameState.aimAngle;
    const powerDiff = idealPower - gameState.aimPower;
    
    if (Math.abs(angleDiff) > 3) {
      if (angleDiff > 0) {
        return { aimRight: true };
      } else {
        return { aimLeft: true };
      }
    }
    
    if (Math.abs(powerDiff) > 3) {
      if (powerDiff > 0) {
        return { powerUp: true };
      } else {
        return { powerDown: true };
      }
    }
    
    // Aim is good, fire!
    return { fire: true };
  }
  
  return {};
}

function getBasicTestAction(gameState) {
  // Basic testing: Move around, cycle weapons, fire occasionally
  const frameCount = gameState.player ? Math.floor(Date.now() / 100) : 0;
  
  if (gameState.turnPhase === TURN_PHASES.MOVEMENT) {
    if (frameCount % 3 === 0) {
      return { left: true };
    } else if (frameCount % 3 === 1) {
      return { right: true };
    } else {
      return { jump: true };
    }
  }
  
  if (gameState.turnPhase === TURN_PHASES.ATTACK) {
    if (frameCount % 20 === 0) {
      return { cycleWeapon: true };
    } else if (frameCount % 10 < 3) {
      return { aimLeft: true };
    } else if (frameCount % 10 < 6) {
      return { aimRight: true };
    } else if (frameCount % 10 < 8) {
      return { powerUp: true };
    } else if (frameCount % 30 === 0) {
      return { fire: true };
    }
  }
  
  return {};
}

function getRandomAction(gameState) {
  const rand = Math.random();
  
  if (gameState.turnPhase === TURN_PHASES.MOVEMENT) {
    if (rand < 0.3) return { left: true };
    if (rand < 0.6) return { right: true };
    if (rand < 0.7) return { jump: true };
  }
  
  if (gameState.turnPhase === TURN_PHASES.ATTACK) {
    if (rand < 0.2) return { aimLeft: true };
    if (rand < 0.4) return { aimRight: true };
    if (rand < 0.5) return { powerUp: true };
    if (rand < 0.6) return { powerDown: true };
    if (rand < 0.65) return { cycleWeapon: true };
    if (rand < 0.7) return { fire: true };
  }
  
  return {};
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;