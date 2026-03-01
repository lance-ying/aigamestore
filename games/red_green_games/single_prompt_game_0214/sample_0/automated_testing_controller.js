// automated_testing_controller.js - Automated testing strategies

import { gameState } from './globals.js';

let testState = {
  movePattern: 0,
  moveTimer: 0,
  dodgeDirection: 1,
  lastPlayerX: 0,
  lastPlayerY: 0,
  stuckTimer: 0
};

function getTestBasicAction(gameState) {
  // TEST_1: Basic movement and collision testing
  if (!gameState.player) return null;
  
  testState.moveTimer++;
  
  // Circular movement pattern
  const pattern = Math.floor(testState.moveTimer / 30) % 8;
  
  // Always shoot
  if (testState.moveTimer % 5 === 0) {
    setTimeout(() => {
      gameState.keys[90] = false; // Release Z
    }, 50);
    return { keyCode: 90 }; // Z key
  }
  
  // Movement in different directions
  switch (pattern) {
    case 0: return { keyCode: 38 }; // Up
    case 1: return { keyCode: 39 }; // Right
    case 2: return { keyCode: 40 }; // Down
    case 3: return { keyCode: 37 }; // Left
    case 4: return { keyCode: 38 }; // Up
    case 5: return { keyCode: 37 }; // Left
    case 6: return { keyCode: 40 }; // Down
    case 7: return { keyCode: 39 }; // Right
  }
  
  return null;
}

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win
  if (!gameState.player) return null;
  
  // Always shoot
  gameState.keys[90] = true;
  
  // Check if stuck
  const dx = Math.abs(gameState.player.x - testState.lastPlayerX);
  const dy = Math.abs(gameState.player.y - testState.lastPlayerY);
  
  if (dx < 1 && dy < 1) {
    testState.stuckTimer++;
  } else {
    testState.stuckTimer = 0;
  }
  
  testState.lastPlayerX = gameState.player.x;
  testState.lastPlayerY = gameState.player.y;
  
  // If stuck, change direction
  if (testState.stuckTimer > 30) {
    testState.dodgeDirection *= -1;
    testState.stuckTimer = 0;
  }
  
  // Find nearest enemy projectile
  let nearestProjectile = null;
  let minDistance = Infinity;
  
  for (const proj of gameState.enemyProjectiles) {
    if (proj.delay > 0) continue;
    
    const dx = proj.x - gameState.player.x;
    const dy = proj.y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestProjectile = proj;
    }
  }
  
  // Dodge nearest projectile
  if (nearestProjectile && minDistance < 100) {
    const dx = nearestProjectile.x - gameState.player.x;
    const dy = nearestProjectile.y - gameState.player.y;
    
    // Use focus when dodging
    gameState.keys[16] = true;
    
    // Move perpendicular to projectile direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Move vertically
      if (gameState.player.y < 200) {
        return { keyCode: 40 }; // Down
      } else {
        return { keyCode: 38 }; // Up
      }
    } else {
      // Move horizontally
      if (dx > 0) {
        return { keyCode: 37 * testState.dodgeDirection }; // Away from projectile
      } else {
        return { keyCode: 39 * testState.dodgeDirection };
      }
    }
  } else {
    gameState.keys[16] = false;
  }
  
  // Stay in safe area
  const playAreaCenterX = 300;
  const playAreaCenterY = 200;
  
  // Move towards center if near edges
  if (gameState.player.x < 100) {
    return { keyCode: 39 }; // Right
  } else if (gameState.player.x > 500) {
    return { keyCode: 37 }; // Left
  }
  
  if (gameState.player.y < 100) {
    return { keyCode: 40 }; // Down
  } else if (gameState.player.y > 300) {
    return { keyCode: 38 }; // Up
  }
  
  // Default: weave pattern
  const weavePattern = Math.floor(gameState.frameCount / 20) % 4;
  switch (weavePattern) {
    case 0: return { keyCode: 37 }; // Left
    case 1: return { keyCode: 39 }; // Right
    case 2: return { keyCode: 38 }; // Up
    case 3: return { keyCode: 40 }; // Down
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  // Handle menu selections automatically
  if (gameState.gamePhase === "BOSS_SELECT") {
    // Always select first boss
    return { keyCode: 49 }; // '1' key
  }
  
  if (gameState.gamePhase === "POWER_UP") {
    // Select power-up based on priority
    const powerUps = gameState.availablePowerUps;
    
    // Prefer health if low
    if (gameState.player && gameState.player.stats.health < 50) {
      const healthIndex = powerUps.findIndex(p => p.name === "Healer's Touch" || p.name === "Resilient Soul");
      if (healthIndex !== -1) {
        return { keyCode: 49 + healthIndex }; // '1', '2', or '3'
      }
    }
    
    // Prefer rare upgrades
    const rareIndex = powerUps.findIndex(p => p.rarity === "rare");
    if (rareIndex !== -1) {
      return { keyCode: 49 + rareIndex };
    }
    
    // Default to first option
    return { keyCode: 49 }; // '1' key
  }
  
  // Gameplay actions
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;