// automated_testing_controller.js - Automated testing

import { PHASE_PLAYING } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Efficiently eliminate all primary targets using optimal aiming and shooting
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  // Find next alive primary target
  let target = null;
  for (let t of gameState.primaryTargets) {
    if (t.alive) {
      target = t;
      break;
    }
  }
  
  if (!target) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  // Calculate aim point (lead target for movement, aim for head)
  const headX = target.x;
  const headY = target.y - target.height / 2 - target.headRadius;
  
  // Get crosshair position
  const crosshair = gameState.crosshair;
  const dx = headX - crosshair.x;
  const dy = headY - crosshair.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Determine actions
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    zoom: false,
    reload: false
  };
  
  // Enable zoom for better accuracy
  if (gameState.zoomLevel < 2) {
    action.zoom = true;
  }
  
  // Move toward target
  const threshold = 5;
  if (Math.abs(dx) > threshold) {
    if (dx < 0) action.left = true;
    else action.right = true;
  }
  if (Math.abs(dy) > threshold) {
    if (dy < 0) action.up = true;
    else action.down = true;
  }
  
  // Fire when aligned
  if (distance < threshold && gameState.currentAmmo > 0 && !gameState.isReloading) {
    action.fire = true;
  }
  
  // Reload when low on ammo
  if (gameState.currentAmmo === 0 && !gameState.isReloading) {
    action.reload = true;
  }
  
  return action;
}

function getTestBasicAction(gameState) {
  // Strategy: Test basic movement, zoom, and shooting
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    zoom: false,
    reload: false
  };
  
  const frame = gameState.missionTimer;
  
  // Test movement in patterns
  if (frame % 180 < 60) {
    action.right = true;
  } else if (frame % 180 < 120) {
    action.down = true;
  } else {
    action.left = true;
  }
  
  // Toggle zoom periodically
  if (frame % 120 === 0) {
    action.zoom = true;
  }
  
  // Fire periodically
  if (frame % 90 === 0 && gameState.currentAmmo > 0 && !gameState.isReloading) {
    action.fire = true;
  }
  
  // Reload when empty
  if (gameState.currentAmmo === 0 && !gameState.isReloading) {
    action.reload = true;
  }
  
  return action;
}

function getTestMovementAction(gameState) {
  // Strategy: Test target tracking and shooting moving targets
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  // Find a moving guard
  let target = null;
  for (let g of gameState.guards) {
    if (g.alive && g.stopTimer === 0) {
      target = g;
      break;
    }
  }
  
  if (!target) {
    // Fall back to primary target
    for (let t of gameState.primaryTargets) {
      if (t.alive) {
        target = t;
        break;
      }
    }
  }
  
  if (!target) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    zoom: false,
    reload: false
  };
  
  // Track target with leading
  const leadAmount = target.patrolSpeed * 10;
  const targetX = target.x + (target.patrolDirection * leadAmount);
  const targetY = target.y;
  
  const crosshair = gameState.crosshair;
  const dx = targetX - crosshair.x;
  const dy = targetY - crosshair.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const threshold = 8;
  if (Math.abs(dx) > threshold) {
    if (dx < 0) action.left = true;
    else action.right = true;
  }
  if (Math.abs(dy) > threshold) {
    if (dy < 0) action.up = true;
    else action.down = true;
  }
  
  if (distance < threshold && gameState.currentAmmo > 0 && !gameState.isReloading) {
    action.fire = true;
  }
  
  if (gameState.currentAmmo === 0 && !gameState.isReloading) {
    action.reload = true;
  }
  
  return action;
}

function getTestEnvironmentalAction(gameState) {
  // Strategy: Test explosive barrels and environmental kills
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  // Find active barrel near targets
  let bestBarrel = null;
  let bestScore = 0;
  
  for (let barrel of gameState.explosiveBarrels) {
    if (!barrel.active) continue;
    
    let nearbyTargets = 0;
    for (let t of gameState.primaryTargets) {
      if (!t.alive) continue;
      const dist = Math.sqrt((t.x - barrel.x) ** 2 + (t.y - barrel.y) ** 2);
      if (dist <= barrel.blastRadius) nearbyTargets++;
    }
    
    if (nearbyTargets > bestScore) {
      bestScore = nearbyTargets;
      bestBarrel = barrel;
    }
  }
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    zoom: false,
    reload: false
  };
  
  if (bestBarrel && bestScore > 0) {
    // Aim at barrel
    const crosshair = gameState.crosshair;
    const dx = bestBarrel.x - crosshair.x;
    const dy = bestBarrel.y - crosshair.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const threshold = 5;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) action.left = true;
      else action.right = true;
    }
    if (Math.abs(dy) > threshold) {
      if (dy < 0) action.up = true;
      else action.down = true;
    }
    
    if (distance < threshold && gameState.currentAmmo > 0 && !gameState.isReloading) {
      action.fire = true;
    }
  } else {
    // Fall back to direct targeting
    return getTestWinAction(gameState);
  }
  
  if (gameState.currentAmmo === 0 && !gameState.isReloading) {
    action.reload = true;
  }
  
  return action;
}

function getTestStealthAction(gameState) {
  // Strategy: Test stealth mechanics and alert system
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, zoom: false, reload: false };
  }
  
  // Intentionally shoot near guards to test alert system, then eliminate targets
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    zoom: false,
    reload: false
  };
  
  const frame = gameState.missionTimer;
  
  // First 30 frames: shoot near guards
  if (frame > 7080) {
    let guard = gameState.guards.find(g => g.alive);
    if (guard) {
      const crosshair = gameState.crosshair;
      const targetX = guard.x + 30;
      const targetY = guard.y;
      const dx = targetX - crosshair.x;
      const dy = targetY - crosshair.y;
      
      if (Math.abs(dx) > 5) {
        if (dx < 0) action.left = true;
        else action.right = true;
      }
      if (Math.abs(dy) > 5) {
        if (dy < 0) action.up = true;
        else action.down = true;
      }
      
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && gameState.currentAmmo > 0) {
        action.fire = true;
      }
    }
  } else {
    // Then switch to efficient targeting
    return getTestWinAction(gameState);
  }
  
  if (gameState.currentAmmo === 0 && !gameState.isReloading) {
    action.reload = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    up: Math.random() < 0.3,
    down: Math.random() < 0.3,
    fire: Math.random() < 0.1,
    zoom: Math.random() < 0.05,
    reload: gameState.currentAmmo === 0 && !gameState.isReloading
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestMovementAction(gameState);
    case "TEST_4":
      return getTestEnvironmentalAction(gameState);
    case "TEST_5":
      return getTestStealthAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;