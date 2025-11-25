// automated_testing_controller.js
import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: false,
    up: false,
    attack: false,
    special: false,
    switch: false
  };
  
  // Find nearest enemy or boss
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.dead) {
      const dist = Math.abs(enemy.x - gameState.player.x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
  }
  
  // Check boss
  if (gameState.boss && !gameState.boss.dead) {
    const bossDist = Math.abs(gameState.boss.x - gameState.player.x);
    if (bossDist < nearestDist || !nearestEnemy) {
      nearestDist = bossDist;
      nearestEnemy = gameState.boss;
    }
  }
  
  if (nearestEnemy) {
    const distToEnemy = nearestEnemy.x - gameState.player.x;
    
    // Maintain optimal attack range
    if (Math.abs(distToEnemy) > 50) {
      // Move towards enemy
      action.right = distToEnemy > 0;
      action.left = distToEnemy < 0;
    } else if (Math.abs(distToEnemy) < 30) {
      // Too close, back up
      action.left = distToEnemy > 0;
      action.right = distToEnemy < 0;
    }
    
    // Attack when in range
    if (Math.abs(distToEnemy) < 60 && gameState.player.attackCooldown <= 0) {
      action.attack = true;
    }
    
    // Use dash to avoid attacks or close distance
    if (nearestEnemy.attackDuration > 0 && Math.abs(distToEnemy) < 50) {
      action.special = true;
    }
    
    // Switch to warrior skull for more damage if available
    if (gameState.player.equippedSkulls.includes('warrior') && 
        gameState.player.getCurrentSkull() !== 'warrior' &&
        gameState.player.skullSwitchCooldown <= 0) {
      action.switch = true;
    }
  } else {
    // No enemies, move right to progress
    action.right = true;
  }
  
  // Collect pickups
  for (const pickup of gameState.pickups) {
    if (!pickup.collected) {
      const distToPickup = Math.abs(pickup.x - gameState.player.x);
      if (distToPickup < 200) {
        action.right = pickup.x > gameState.player.x;
        action.left = pickup.x < gameState.player.x;
        break;
      }
    }
  }
  
  // Jump if needed (simple obstacle avoidance)
  if (gameState.player.grounded && Math.random() < 0.1) {
    action.up = true;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: false,
    up: false,
    attack: false,
    special: false,
    switch: false
  };
  
  // Simple behavior: move right, attack nearby enemies, collect pickups
  action.right = true;
  
  // Attack if enemy nearby
  for (const enemy of gameState.enemies) {
    if (!enemy.dead) {
      const dist = Math.abs(enemy.x - gameState.player.x);
      if (dist < 80) {
        action.attack = true;
        action.right = enemy.x > gameState.player.x;
        action.left = enemy.x < gameState.player.x;
        break;
      }
    }
  }
  
  // Random jump
  if (gameState.player.grounded && Math.random() < 0.05) {
    action.up = true;
  }
  
  return action;
}

function getSkullTestAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: false,
    up: false,
    attack: false,
    special: false,
    switch: false
  };
  
  // Focus on collecting skulls and testing switching
  action.right = true;
  
  // Seek pickups actively
  for (const pickup of gameState.pickups) {
    if (!pickup.collected) {
      const distToPickup = Math.abs(pickup.x - gameState.player.x);
      if (distToPickup < 300) {
        action.right = pickup.x > gameState.player.x;
        action.left = pickup.x < gameState.player.x;
        
        // Jump to reach elevated pickups
        if (Math.abs(pickup.y - gameState.player.y) > 20 && gameState.player.grounded) {
          action.up = true;
        }
        break;
      }
    }
  }
  
  // Switch skulls periodically
  if (gameState.player.equippedSkulls.length > 1 && 
      gameState.player.skullSwitchCooldown <= 0 &&
      Math.random() < 0.02) {
    action.switch = true;
  }
  
  // Attack enemies in range
  for (const enemy of gameState.enemies) {
    if (!enemy.dead) {
      const dist = Math.abs(enemy.x - gameState.player.x);
      if (dist < 60) {
        action.attack = true;
        break;
      }
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'up', 'attack', 'special', 'switch'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    left: randomAction === 'left',
    right: randomAction === 'right',
    up: randomAction === 'up',
    attack: randomAction === 'attack',
    special: randomAction === 'special',
    switch: randomAction === 'switch'
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSkullTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;