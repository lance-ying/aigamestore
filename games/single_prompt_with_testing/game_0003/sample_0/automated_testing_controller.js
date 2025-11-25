// automated_testing_controller.js - Automated testing functions
import { PHASE_PLAYING, DAWN_TIME } from './globals.js';

let testState = {
  positionHistory: [],
  lastPosition: { x: 0, y: 0 },
  stuckCounter: 0,
  movePattern: 0,
  upgradeStrategy: [],
  framesSinceLastMove: 0
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Handle level up
  if (gameState.levelUpPending) {
    return handleOptimalUpgradeSelection(gameState);
  }
  
  // Priority: Survival through movement
  return getOptimalMovement(gameState);
}

function handleOptimalUpgradeSelection(gameState) {
  const choices = gameState.upgradeChoices;
  if (choices.length === 0) return { space: false, spacePressed: true };
  
  // Upgrade priority: weapons first, then damage/speed, then survivability
  const priority = [
    'magic_wand', 'cross', 'holy_water', 'garlic',
    'magic_wand_upgrade', 'cross_upgrade',
    'damage', 'attack_speed', 'range',
    'move_speed', 'armor', 'max_health', 'regeneration', 'magnet'
  ];
  
  let bestChoice = 0;
  let bestPriority = 999;
  
  for (let i = 0; i < choices.length; i++) {
    const idx = priority.indexOf(choices[i]);
    if (idx !== -1 && idx < bestPriority) {
      bestPriority = idx;
      bestChoice = i;
    }
  }
  
  // Select best choice
  if (gameState.selectedUpgrade !== bestChoice) {
    if (gameState.selectedUpgrade < bestChoice) {
      return { right: false, rightPressed: true, space: false };
    } else {
      return { left: false, leftPressed: true, space: false };
    }
  }
  
  return { space: false, spacePressed: true };
}

function getOptimalMovement(gameState) {
  const player = gameState.player;
  const enemies = gameState.enemies;
  
  // Calculate danger vectors from nearby enemies
  let dangerX = 0;
  let dangerY = 0;
  let pickupX = 0;
  let pickupY = 0;
  
  const dangerRadius = 150;
  const pickupRadius = 200;
  
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < dangerRadius && dist > 0) {
      const weight = (dangerRadius - dist) / dangerRadius;
      dangerX -= (dx / dist) * weight;
      dangerY -= (dy / dist) * weight;
    }
  }
  
  // Collect nearby pickups when safe
  if (Math.abs(dangerX) < 0.5 && Math.abs(dangerY) < 0.5) {
    for (const pickup of gameState.pickups) {
      const dx = pickup.x - player.x;
      const dy = pickup.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < pickupRadius && dist > 0) {
        const weight = pickup.type === 'health' ? 2.0 : 0.5;
        pickupX += (dx / dist) * weight;
        pickupY += (dy / dist) * weight;
      }
    }
  }
  
  // Circular kiting pattern when not in immediate danger
  const time = gameState.elapsedTime * 0.02;
  const circleX = Math.cos(time) * 0.3;
  const circleY = Math.sin(time) * 0.3;
  
  // Combine movement vectors
  let moveX = dangerX * 2 + pickupX * 0.5 + circleX;
  let moveY = dangerY * 2 + pickupY * 0.5 + circleY;
  
  // Normalize and convert to inputs
  const moveMag = Math.sqrt(moveX * moveX + moveY * moveY);
  if (moveMag > 0.1) {
    moveX /= moveMag;
    moveY /= moveMag;
  }
  
  return {
    left: moveX < -0.3,
    right: moveX > 0.3,
    up: moveY < -0.3,
    down: moveY > 0.3,
    space: false
  };
}

function getTestBasicAction(gameState) {
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Handle level up - just pick first option
  if (gameState.levelUpPending) {
    return { space: false, spacePressed: true };
  }
  
  // Simple movement pattern - circle
  const time = gameState.elapsedTime * 0.05;
  const moveX = Math.cos(time);
  const moveY = Math.sin(time);
  
  return {
    left: moveX < -0.3,
    right: moveX > 0.3,
    up: moveY < -0.3,
    down: moveY > 0.3,
    space: false
  };
}

function getTestExperienceAction(gameState) {
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Handle level up - prioritize damage upgrades
  if (gameState.levelUpPending) {
    const choices = gameState.upgradeChoices;
    let bestChoice = 0;
    
    for (let i = 0; i < choices.length; i++) {
      if (choices[i].includes('damage') || choices[i].includes('wand') || choices[i].includes('cross')) {
        bestChoice = i;
        break;
      }
    }
    
    if (gameState.selectedUpgrade !== bestChoice) {
      if (gameState.selectedUpgrade < bestChoice) {
        return { right: false, rightPressed: true, space: false };
      } else {
        return { left: false, leftPressed: true, space: false };
      }
    }
    
    return { space: false, spacePressed: true };
  }
  
  // Move towards nearest pickup aggressively
  let nearestPickup = null;
  let nearestDist = Infinity;
  
  for (const pickup of gameState.pickups) {
    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestPickup = pickup;
    }
  }
  
  if (nearestPickup) {
    const dx = nearestPickup.x - player.x;
    const dy = nearestPickup.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return {
      left: dx < -5,
      right: dx > 5,
      up: dy < -5,
      down: dy > 5,
      space: false
    };
  }
  
  return getTestBasicAction(gameState);
}

function getTestCombatAction(gameState) {
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  // Handle level up - prioritize weapons
  if (gameState.levelUpPending) {
    return { space: false, spacePressed: true };
  }
  
  // Engage enemies while maintaining distance
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (enemy.dead) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  if (nearestEnemy) {
    const optimalDist = 100; // Maintain this distance
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    
    // If too close, move away; if too far, move closer
    const moveAway = nearestDist < optimalDist;
    
    return {
      left: moveAway ? dx > 0 : dx < -5,
      right: moveAway ? dx < 0 : dx > 5,
      up: moveAway ? dy > 0 : dy < -5,
      down: moveAway ? dy < 0 : dy > 5,
      space: false
    };
  }
  
  return getTestBasicAction(gameState);
}

function getTestDeathAction(gameState) {
  // Stand still to allow death
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
  };
}

function getRandomAction(gameState) {
  // Handle level up
  if (gameState.levelUpPending) {
    return { space: false, spacePressed: true };
  }
  
  const rand = Math.random();
  return {
    left: rand < 0.2,
    right: rand > 0.8,
    up: rand > 0.4 && rand < 0.5,
    down: rand > 0.5 && rand < 0.6,
    space: false
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getTestBasicAction(gameState);
    case 'TEST_2':
      return getTestWinAction(gameState);
    case 'TEST_3':
      return getTestExperienceAction(gameState);
    case 'TEST_4':
      return getTestCombatAction(gameState);
    case 'TEST_5':
      return getTestDeathAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;