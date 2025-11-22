// automated_testing_controller.js - Automated testing functions

import { gameState, ATTACK_RANGE } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.enemy) {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false };
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  const distance = enemy.x - player.x;
  const absDistance = Math.abs(distance);
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false
  };
  
  // Optimal strategy: maintain attack range and attack aggressively
  const optimalRange = ATTACK_RANGE - 10;
  
  if (absDistance > optimalRange + 20) {
    // Move closer
    if (distance > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  } else if (absDistance < optimalRange - 20) {
    // Back away slightly
    if (distance > 0) {
      action.left = true;
    } else {
      action.right = true;
    }
  } else {
    // In good range - attack!
    if (player.attackCooldown === 0 && !player.isAttacking) {
      // Alternate between attacks for variety
      if (Math.floor(Date.now() / 1000) % 2 === 0) {
        action.punch = true;
      } else {
        action.kick = true;
      }
      
      // Occasionally use combos
      if (Math.floor(Date.now() / 500) % 5 === 0) {
        action.right = true;
        action.kick = true; // Forward kick combo
      }
    }
  }
  
  // Dodge if enemy is attacking and too close
  if (enemy.isAttacking && absDistance < 50) {
    if (Math.floor(Date.now() / 300) % 3 === 0) {
      action.up = true; // Jump over attack
    } else {
      // Back away
      if (distance > 0) {
        action.left = true;
      } else {
        action.right = true;
      }
    }
    action.punch = false;
    action.kick = false;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  if (!gameState.player || !gameState.enemy) {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false };
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  const distance = enemy.x - player.x;
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false
  };
  
  // Simple approach and attack
  if (Math.abs(distance) > ATTACK_RANGE) {
    action.right = distance > 0;
    action.left = distance < 0;
  } else if (player.attackCooldown === 0) {
    action.punch = true;
  }
  
  return action;
}

function getDefensiveTestAction(gameState) {
  if (!gameState.player || !gameState.enemy) {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false };
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  const distance = enemy.x - player.x;
  const absDistance = Math.abs(distance);
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false
  };
  
  // Maintain safe distance
  if (enemy.isAttacking) {
    // Back away
    if (distance > 0) {
      action.left = true;
    } else {
      action.right = true;
    }
  } else if (absDistance < ATTACK_RANGE + 10 && player.attackCooldown === 0) {
    action.kick = true;
  } else if (absDistance > ATTACK_RANGE + 30) {
    // Move closer
    if (distance > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  return action;
}

function getComboTestAction(gameState) {
  if (!gameState.player || !gameState.enemy) {
    return { left: false, right: false, up: false, down: false, punch: false, kick: false };
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  const distance = enemy.x - player.x;
  const absDistance = Math.abs(distance);
  const time = Math.floor(Date.now() / 500);
  
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false
  };
  
  // Approach
  if (absDistance > ATTACK_RANGE) {
    action.right = distance > 0;
    action.left = distance < 0;
  } else if (player.attackCooldown === 0) {
    // Execute different combos based on time
    switch (time % 4) {
      case 0:
        action.right = true;
        action.punch = true;
        break;
      case 1:
        action.up = true;
        action.kick = true;
        break;
      case 2:
        action.down = true;
        action.punch = true;
        break;
      case 3:
        action.kick = true;
        break;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  const rand = Math.random();
  return {
    left: rand < 0.15,
    right: rand >= 0.15 && rand < 0.3,
    up: rand >= 0.3 && rand < 0.35,
    down: rand >= 0.35 && rand < 0.4,
    punch: rand >= 0.4 && rand < 0.5,
    kick: rand >= 0.5 && rand < 0.6
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getDefensiveTestAction(gameState);
    case "TEST_4":
      return getComboTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;