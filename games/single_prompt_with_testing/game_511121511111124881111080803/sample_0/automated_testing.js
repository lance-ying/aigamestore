// automated_testing.js - Automated testing strategies

import { gameState, distanceBetween, angleBetween } from './globals.js';

// ============================================================================
// AUTOMATED TESTING CONTROLLER
// ============================================================================

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicMovementTest(state);
    case "TEST_2":
      return getOptimalSurvivalTest(state);
    case "TEST_3":
      return getPowerupCollectionTest(state);
    case "TEST_4":
      return getWaveProgressionTest(state);
    case "TEST_5":
      return getDamageTest(state);
    case "TEST_6":
      return getBoostBrakeTest(state);
    case "TEST_7":
      return getProjectileTest(state);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

// ============================================================================
// TEST 1: Basic Movement Test
// ============================================================================

function getBasicMovementTest(state) {
  if (!state.player) return null;
  
  // Circular movement pattern
  const cycleLength = 120; // frames for one turn
  const progress = (state.frameCount % cycleLength) / cycleLength;
  
  if (progress < 0.5) {
    return { keyCode: 37 }; // Turn left
  } else {
    return { keyCode: 39 }; // Turn right
  }
}

// ============================================================================
// TEST 2: Optimal Survival and Scoring
// ============================================================================

function getOptimalSurvivalTest(state) {
  if (!state.player) return null;
  
  const player = state.player;
  const threats = [];
  const opportunities = [];
  
  // Analyze threats (enemies and projectiles)
  for (const enemy of state.enemies) {
    const distance = distanceBetween(player.x, player.y, enemy.x, enemy.y);
    const angle = angleBetween(player.x, player.y, enemy.x, enemy.y);
    const dangerLevel = 1 / (distance + 1); // Closer = more dangerous
    threats.push({ x: enemy.x, y: enemy.y, distance, angle, dangerLevel });
  }
  
  for (const projectile of state.projectiles) {
    // Only consider enemy projectiles
    if (projectile.owner !== player) {
      const distance = distanceBetween(player.x, player.y, projectile.x, projectile.y);
      const angle = angleBetween(player.x, player.y, projectile.x, projectile.y);
      const dangerLevel = 2 / (distance + 1); // Projectiles are more dangerous
      threats.push({ x: projectile.x, y: projectile.y, distance, angle, dangerLevel });
    }
  }
  
  // Analyze opportunities (power-ups)
  for (const powerup of state.powerups) {
    const distance = distanceBetween(player.x, player.y, powerup.x, powerup.y);
    const angle = angleBetween(player.x, player.y, powerup.x, powerup.y);
    const value = 100 / (distance + 1); // Closer = more valuable
    opportunities.push({ x: powerup.x, y: powerup.y, distance, angle, value });
  }
  
  // Calculate danger vector
  let dangerX = 0;
  let dangerY = 0;
  let totalDanger = 0;
  
  for (const threat of threats) {
    const dx = threat.x - player.x;
    const dy = threat.y - player.y;
    const normalized = Math.sqrt(dx * dx + dy * dy);
    if (normalized > 0) {
      dangerX += (dx / normalized) * threat.dangerLevel;
      dangerY += (dy / normalized) * threat.dangerLevel;
      totalDanger += threat.dangerLevel;
    }
  }
  
  // Calculate opportunity vector
  let opportunityX = 0;
  let opportunityY = 0;
  
  if (totalDanger < 0.5 && opportunities.length > 0) {
    // Safe to pursue power-ups
    const best = opportunities.reduce((a, b) => a.value > b.value ? a : b);
    const dx = best.x - player.x;
    const dy = best.y - player.y;
    const normalized = Math.sqrt(dx * dx + dy * dy);
    if (normalized > 0) {
      opportunityX = dx / normalized;
      opportunityY = dy / normalized;
    }
  }
  
  // Combine vectors (prioritize safety)
  const targetX = player.x - dangerX * 100 + opportunityX * 50;
  const targetY = player.y - dangerY * 100 + opportunityY * 50;
  
  // Calculate desired angle
  const desiredAngle = angleBetween(player.x, player.y, targetX, targetY);
  
  // Normalize angles to [-PI, PI]
  let angleDiff = desiredAngle - player.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Decide action
  if (totalDanger > 1) {
    // High danger - boost away
    if (Math.abs(angleDiff) < 0.3) {
      return { keyCode: 38 }; // Boost
    }
  }
  
  // Turn toward desired direction
  if (angleDiff < -0.1) {
    return { keyCode: 37 }; // Turn left
  } else if (angleDiff > 0.1) {
    return { keyCode: 39 }; // Turn right
  }
  
  // Use special weapon if available and enemies are close
  if (state.activePowerups.bomb > 0 && threats.length > 3) {
    return { keyCode: 32 }; // Space
  }
  
  // Default to slight boost
  return { keyCode: 38 };
}

// ============================================================================
// TEST 3: Power-up Collection
// ============================================================================

function getPowerupCollectionTest(state) {
  if (!state.player || state.powerups.length === 0) {
    return getBasicMovementTest(state);
  }
  
  const player = state.player;
  
  // Find nearest power-up
  let nearest = null;
  let minDistance = Infinity;
  
  for (const powerup of state.powerups) {
    const distance = distanceBetween(player.x, player.y, powerup.x, powerup.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = powerup;
    }
  }
  
  if (!nearest) return getBasicMovementTest(state);
  
  // Navigate toward power-up
  const desiredAngle = angleBetween(player.x, player.y, nearest.x, nearest.y);
  let angleDiff = desiredAngle - player.angle;
  
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  if (angleDiff < -0.1) {
    return { keyCode: 37 };
  } else if (angleDiff > 0.1) {
    return { keyCode: 39 };
  }
  
  return { keyCode: 38 }; // Boost toward it
}

// ============================================================================
// TEST 4: Wave Progression
// ============================================================================

function getWaveProgressionTest(state) {
  // Similar to optimal survival but more aggressive
  return getOptimalSurvivalTest(state);
}

// ============================================================================
// TEST 5: Damage Test
// ============================================================================

let damageTestPhase = 0;
let damageTestTimer = 0;

function getDamageTest(state) {
  if (!state.player) return null;
  
  damageTestTimer++;
  
  // Phase 1: Accumulate score (180 frames = 3 seconds)
  if (damageTestPhase === 0) {
    if (damageTestTimer < 180) {
      return getOptimalSurvivalTest(state);
    } else {
      damageTestPhase = 1;
      damageTestTimer = 0;
    }
  }
  
  // Phase 2: Deliberately take damage
  if (damageTestPhase === 1) {
    if (state.enemies.length > 0) {
      const enemy = state.enemies[0];
      const desiredAngle = angleBetween(state.player.x, state.player.y, enemy.x, enemy.y);
      let angleDiff = desiredAngle - state.player.angle;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (angleDiff < -0.1) {
        return { keyCode: 37 };
      } else if (angleDiff > 0.1) {
        return { keyCode: 39 };
      }
      
      return { keyCode: 38 }; // Boost toward enemy
    }
  }
  
  return getOptimalSurvivalTest(state);
}

// ============================================================================
// TEST 6: Boost and Brake Test
// ============================================================================

function getBoostBrakeTest(state) {
  if (!state.player) return null;
  
  const cycleLength = 60;
  const progress = (state.frameCount % (cycleLength * 2)) / cycleLength;
  
  if (progress < 0.5) {
    // Boost phase
    return { keyCode: 38 };
  } else if (progress < 1) {
    // Brake phase
    return { keyCode: 40 };
  } else if (progress < 1.5) {
    // Turn while boosting
    if (state.frameCount % 20 < 10) {
      return { keyCode: 37 };
    } else {
      return { keyCode: 38 };
    }
  } else {
    // Turn while braking
    if (state.frameCount % 20 < 10) {
      return { keyCode: 39 };
    } else {
      return { keyCode: 40 };
    }
  }
}

// ============================================================================
// TEST 7: Projectile Test
// ============================================================================

function getProjectileTest(state) {
  if (!state.player || state.enemies.length === 0) {
    return getBasicMovementTest(state);
  }
  
  const player = state.player;
  const enemy = state.enemies[0];
  
  // Aim at enemy
  const desiredAngle = angleBetween(player.x, player.y, enemy.x, enemy.y);
  let angleDiff = desiredAngle - player.angle;
  
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Turn to face enemy
  if (angleDiff < -0.1) {
    return { keyCode: 37 };
  } else if (angleDiff > 0.1) {
    return { keyCode: 39 };
  }
  
  // Maintain distance and keep firing
  const distance = distanceBetween(player.x, player.y, enemy.x, enemy.y);
  if (distance < 100) {
    return { keyCode: 40 }; // Brake
  } else if (distance > 200) {
    return { keyCode: 38 }; // Boost
  }
  
  return null; // Just keep current heading
}