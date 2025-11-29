// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';
import { distance, angle } from './utils.js';

function getTestWinAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Priority 1: Collect crystals
  if (gameState.crystals.length > 0) {
    // Find nearest crystal
    let nearestCrystal = gameState.crystals[0];
    let minDist = distance(player.x, player.y, nearestCrystal.x, nearestCrystal.y);
    
    for (const crystal of gameState.crystals) {
      const dist = distance(player.x, player.y, crystal.x, crystal.y);
      if (dist < minDist) {
        minDist = dist;
        nearestCrystal = crystal;
      }
    }
    
    // Move towards nearest crystal
    const dx = nearestCrystal.x - player.x;
    const dy = nearestCrystal.y - player.y;
    
    // Shoot at obstacles in the way
    for (const asteroid of gameState.asteroids) {
      const distToAsteroid = distance(player.x, player.y, asteroid.x, asteroid.y);
      if (distToAsteroid < 100) {
        return { keyCode: 32 }; // Space - shoot
      }
    }
    
    // Use boost if far from crystal
    if (minDist > 150 && player.energy > 30) {
      // Random chance to use boost while moving
      if (Math.random() < 0.3) {
        return { keyCode: 90 }; // Z - boost
      }
    }
    
    // Navigate to crystal
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Right or Left
    } else {
      return dy > 0 ? { keyCode: 40 } : { keyCode: 38 }; // Down or Up
    }
  }
  
  // Priority 2: Avoid/destroy nearby enemies
  for (const drone of gameState.drones) {
    const dist = distance(player.x, player.y, drone.x, drone.y);
    if (dist < 80) {
      return { keyCode: 32 }; // Space - shoot
    }
  }
  
  // Priority 3: Destroy asteroids
  for (const asteroid of gameState.asteroids) {
    const dist = distance(player.x, player.y, asteroid.x, asteroid.y);
    if (dist < 60) {
      return { keyCode: 32 }; // Space - shoot
    }
  }
  
  return null;
}

function getBasicTestAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const frameCount = gameState.frameCount;
  
  // Test movement in patterns
  const pattern = Math.floor(frameCount / 60) % 8;
  
  switch (pattern) {
    case 0: // Move right
      return { keyCode: 39 };
    case 1: // Move down
      return { keyCode: 40 };
    case 2: // Move left
      return { keyCode: 37 };
    case 3: // Move up
      return { keyCode: 38 };
    case 4: // Fire weapon
      return { keyCode: 32 };
    case 5: // Use shield
      return { keyCode: 16 };
    case 6: // Use boost
      return { keyCode: 90 };
    case 7: // Collect nearby crystal
      if (gameState.crystals.length > 0) {
        const nearest = gameState.crystals[0];
        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
        } else {
          return dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
        }
      }
      return { keyCode: 39 };
  }
  
  return null;
}

function getRandomAction() {
  const actions = [37, 38, 39, 40, 32, 16, 90];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

function getCombatTestAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const drone of gameState.drones) {
    const dist = distance(player.x, player.y, drone.x, drone.y);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = drone;
    }
  }
  
  for (const asteroid of gameState.asteroids) {
    const dist = distance(player.x, player.y, asteroid.x, asteroid.y);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = asteroid;
    }
  }
  
  if (nearestEnemy) {
    // Keep distance and shoot
    if (minDist < 150) {
      return { keyCode: 32 }; // Shoot
    } else {
      // Move towards enemy
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
      } else {
        return dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
      }
    }
  }
  
  return { keyCode: 32 }; // Default to shooting
}

function getShieldTestAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const frameCount = gameState.frameCount;
  
  // Alternate between shield on and off
  if ((frameCount % 120) < 60) {
    return { keyCode: 16 }; // Shield on
  }
  
  // Move around while testing shield
  const movePattern = Math.floor(frameCount / 30) % 4;
  const movements = [37, 38, 39, 40];
  return { keyCode: movements[movePattern] };
}

function getBoostTestAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const frameCount = gameState.frameCount;
  
  // Use boost periodically
  if ((frameCount % 100) < 30 && player.energy > 20) {
    return { keyCode: 90 }; // Boost
  }
  
  // Navigate while testing boost
  if (gameState.crystals.length > 0) {
    const target = gameState.crystals[0];
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
    } else {
      return dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
    }
  }
  
  return { keyCode: 39 };
}

function getStateTestAction() {
  const frameCount = gameState.frameCount;
  
  // Test different game states
  if (frameCount === 180) {
    return { keyCode: 27 }; // Pause
  } else if (frameCount === 240) {
    return { keyCode: 27 }; // Unpause
  }
  
  // Otherwise, play normally
  return getBasicTestAction();
}

function getStressTestAction() {
  // Rapid, erratic movements
  const actions = [37, 38, 39, 40, 32, 16, 90];
  
  // Multiple rapid inputs
  if (Math.random() < 0.8) {
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.controlMode === "HUMAN") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction();
    case "TEST_2":
      return getTestWinAction();
    case "TEST_3":
      return getCombatTestAction();
    case "TEST_4":
      return getShieldTestAction();
    case "TEST_5":
      return getBoostTestAction();
    case "TEST_6":
      return getStateTestAction();
    case "TEST_7":
      return getStressTestAction();
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;