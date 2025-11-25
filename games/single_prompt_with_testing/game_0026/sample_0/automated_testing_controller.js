// automated_testing_controller.js - Automated testing

import { KEYS, gameState } from './globals.js';

let testState = {
  actionQueue: [],
  framesSinceLastAction: 0,
  lastPosition: { x: 0, y: 0 },
  stuckCounter: 0,
  phase: 'approach',
  targetEnemy: null
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player || !player.alive) return [];
  
  testState.framesSinceLastAction++;
  
  // Check if stuck
  const dx = player.x - testState.lastPosition.x;
  const dy = player.y - testState.lastPosition.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && testState.framesSinceLastAction > 60) {
    testState.stuckCounter++;
    if (testState.stuckCounter > 3) {
      testState.actionQueue = [KEYS.SPACE, KEYS.RIGHT];
      testState.stuckCounter = 0;
    }
  } else {
    testState.stuckCounter = 0;
  }
  
  testState.lastPosition = { x: player.x, y: player.y };
  
  // Find nearest living enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.alive) continue;
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  const actions = [];
  
  if (!nearestEnemy) {
    // No enemies, wait
    return [];
  }
  
  testState.targetEnemy = nearestEnemy;
  
  const dx2 = nearestEnemy.x - player.x;
  const dy2 = nearestEnemy.y - player.y;
  const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  
  // Check for incoming projectiles
  let dangerousProjectile = null;
  for (const proj of gameState.projectiles) {
    if (proj.owner === 'enemy' && proj.alive) {
      const projDist = Math.sqrt((proj.x - player.x) ** 2 + (proj.y - player.y) ** 2);
      if (projDist < 100) {
        dangerousProjectile = proj;
        break;
      }
    }
  }
  
  // Use time slow if multiple enemies or projectiles
  if ((gameState.enemies.filter(e => e.alive).length > 2 || dangerousProjectile) && 
      gameState.timeSlowCharge > 50) {
    actions.push(KEYS.X);
  }
  
  // Dodge or deflect projectiles
  if (dangerousProjectile) {
    if (player.slashCooldown <= 0) {
      // Try to deflect
      actions.push(KEYS.Z);
    } else if (player.dashCooldown <= 0) {
      // Dash away
      actions.push(KEYS.SHIFT);
      actions.push(dangerousProjectile.x < player.x ? KEYS.RIGHT : KEYS.LEFT);
    }
    return actions;
  }
  
  // Combat logic
  if (dist < 60) {
    // In attack range - slash
    if (player.slashCooldown <= 0) {
      actions.push(KEYS.Z);
      if (dy2 < -20) {
        actions.push(KEYS.UP);
      } else if (dy2 > 20) {
        actions.push(KEYS.DOWN);
      } else {
        actions.push(dx2 > 0 ? KEYS.RIGHT : KEYS.LEFT);
      }
    } else {
      // Back off if on cooldown
      actions.push(dx2 > 0 ? KEYS.LEFT : KEYS.RIGHT);
    }
  } else if (dist < 150) {
    // Medium range - dash in if ready
    if (player.dashCooldown <= 0 && player.slashCooldown <= 0) {
      actions.push(KEYS.SHIFT);
      actions.push(dx2 > 0 ? KEYS.RIGHT : KEYS.LEFT);
    } else {
      // Approach carefully
      actions.push(dx2 > 0 ? KEYS.RIGHT : KEYS.LEFT);
    }
  } else {
    // Far range - approach
    actions.push(dx2 > 0 ? KEYS.RIGHT : KEYS.LEFT);
    
    // Jump if needed
    if (player.onGround && Math.random() < 0.1) {
      actions.push(KEYS.SPACE);
    }
  }
  
  testState.framesSinceLastAction = 0;
  return actions;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player || !player.alive) return [];
  
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 5) {
    return testState.actionQueue;
  }
  
  const actions = [];
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.alive) continue;
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    
    // Move toward enemy
    actions.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    
    // Attack when close
    if (Math.abs(dx) < 70 && player.slashCooldown <= 0) {
      actions.push(KEYS.Z);
    }
    
    // Jump occasionally
    if (player.onGround && Math.random() < 0.05) {
      actions.push(KEYS.SPACE);
    }
  }
  
  testState.actionQueue = actions;
  testState.framesSinceLastAction = 0;
  return actions;
}

function getProjectileDodgeTest(gameState) {
  const player = gameState.player;
  if (!player || !player.alive) return [];
  
  const actions = [];
  
  // Look for incoming projectiles
  for (const proj of gameState.projectiles) {
    if (proj.owner === 'enemy' && proj.alive) {
      const dist = Math.sqrt((proj.x - player.x) ** 2 + (proj.y - player.y) ** 2);
      if (dist < 150) {
        // Activate time slow
        if (gameState.timeSlowCharge > 20) {
          actions.push(KEYS.X);
        }
        
        // Try to deflect
        if (player.slashCooldown <= 0 && dist < 80) {
          actions.push(KEYS.Z);
        } else if (player.dashCooldown <= 0) {
          // Dash dodge
          actions.push(KEYS.SHIFT);
          actions.push(proj.x < player.x ? KEYS.RIGHT : KEYS.LEFT);
        }
        
        return actions;
      }
    }
  }
  
  // Default: approach enemies
  return getBasicTestAction(gameState);
}

function getDashTest(gameState) {
  const player = gameState.player;
  if (!player || !player.alive) return [];
  
  testState.framesSinceLastAction++;
  
  const actions = [];
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.alive) continue;
    const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dist = Math.sqrt(dx * dx);
    
    // Dash toward enemy when in range
    if (dist > 100 && dist < 200 && player.dashCooldown <= 0) {
      actions.push(KEYS.SHIFT);
      actions.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    } else if (dist < 70) {
      actions.push(KEYS.Z);
    } else {
      actions.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    }
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.3) {
    actions.push(Math.random() < 0.5 ? KEYS.LEFT : KEYS.RIGHT);
  }
  if (rand < 0.1) {
    actions.push(KEYS.SPACE);
  }
  if (rand < 0.15) {
    actions.push(KEYS.Z);
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getProjectileDodgeTest(gameState);
    case "TEST_4":
      return getDashTest(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;