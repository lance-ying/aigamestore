// automated_testing_controller.js - Automated testing functions

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CRITICAL_FPS,
  CRITICAL_CABLE_TWIST,
  CRITICAL_TEMPERATURE,
  UNTWIST_COST,
  OPTIMIZE_COST,
  gameState
} from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const actions = [];
  
  // Priority 1: Handle critical situations
  if (gameState.currentFPS < CRITICAL_FPS + 5) {
    // Use optimize if available
    if (gameState.energy >= OPTIMIZE_COST && gameState.optimizeCooldown <= 0) {
      actions.push(90); // Z key
    } else if (gameState.energy > 20) {
      actions.push(32); // Space for boost
    }
  }
  
  // Priority 2: Manage cable twist
  if (Math.abs(gameState.cableTwist) > CRITICAL_CABLE_TWIST - 100 && gameState.energy >= UNTWIST_COST) {
    actions.push(16); // Shift
  }
  
  // Priority 3: Navigate strategically
  // Move towards optimized zones, avoid high-demand zones
  let bestZone = null;
  let bestScore = -Infinity;
  
  for (const zone of gameState.performanceZones) {
    const dist = Math.hypot(zone.x - player.x, zone.y - player.y);
    const score = zone.type === 'OPTIMIZED' ? (1000 - dist) : -(1000 - dist);
    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }
  
  if (bestZone) {
    const dx = bestZone.x - player.x;
    const dy = bestZone.y - player.y;
    
    if (Math.abs(dx) > 20) {
      actions.push(dx > 0 ? 39 : 37); // Right or Left
    }
    if (Math.abs(dy) > 20) {
      actions.push(dy > 0 ? 40 : 38); // Down or Up
    }
  } else {
    // Default movement to avoid edges
    if (player.x < 100) actions.push(39); // Right
    if (player.x > CANVAS_WIDTH - 100) actions.push(37); // Left
    if (player.y < 100) actions.push(40); // Down
    if (player.y > CANVAS_HEIGHT - 100) actions.push(38); // Up
  }
  
  // Priority 4: Maintain energy for abilities
  if (gameState.energy < 50 && gameState.boostActive) {
    // Don't use boost, let energy regenerate
    return actions.length > 0 ? actions[Math.floor(Math.random() * actions.length)] : null;
  }
  
  return actions.length > 0 ? actions[0] : null;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  // Simple movement pattern - test all directions
  const frame = gameState.frameCount;
  const cycle = Math.floor(frame / 30) % 4;
  
  switch (cycle) {
    case 0: return 39; // Right
    case 1: return 40; // Down
    case 2: return 37; // Left
    case 3: return 38; // Up
  }
  
  return null;
}

function getAbilityTestAction(gameState) {
  if (!gameState.player) return null;
  
  const frame = gameState.frameCount;
  
  // Test abilities in sequence
  if (frame % 120 === 0 && gameState.energy >= OPTIMIZE_COST) {
    return 90; // Z
  }
  if (frame % 80 === 0 && gameState.energy >= UNTWIST_COST) {
    return 16; // Shift
  }
  if (frame % 40 < 20) {
    return 32; // Space (boost)
  }
  
  // Move while testing
  return 39; // Right
}

function getLoseTestAction(gameState) {
  // Deliberately make poor choices to test lose conditions
  if (!gameState.player) return null;
  
  // Find high-demand zones and move towards them
  const highDemandZones = gameState.performanceZones.filter(z => z.type === 'HIGH_DEMAND');
  
  if (highDemandZones.length > 0 && gameState.player) {
    const zone = highDemandZones[0];
    const dx = zone.x - gameState.player.x;
    const dy = zone.y - gameState.player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 39 : 37;
    } else {
      return dy > 0 ? 40 : 38;
    }
  }
  
  // Use boost constantly to overheat
  return 32;
}

function getProgressionTestAction(gameState) {
  // Test challenge progression by completing them efficiently
  if (!gameState.player) return null;
  
  if (gameState.currentChallenge) {
    const challenge = gameState.currentChallenge;
    
    switch (challenge.type) {
      case 'MAINTAIN_FPS':
        if (gameState.energy > 30) return 32; // Boost
        break;
      case 'REDUCE_TWIST':
        if (gameState.energy >= UNTWIST_COST) return 16; // Untwist
        break;
      case 'COOL_DOWN':
        // Move slowly, let system cool
        if (gameState.frameCount % 60 === 0) return 39;
        break;
      case 'LOW_USAGE':
        // Stay still, no boost
        return null;
    }
  }
  
  // Default movement
  return gameState.frameCount % 90 < 45 ? 39 : 37;
}

function getRandomAction(gameState) {
  const actions = [38, 40, 37, 39, 32, 16, 90, null];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAbilityTestAction(gameState);
    case "TEST_4":
      return getLoseTestAction(gameState);
    case "TEST_5":
      return getProgressionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;