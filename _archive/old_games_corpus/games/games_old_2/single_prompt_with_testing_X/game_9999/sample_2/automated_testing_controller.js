// automated_testing_controller.js
import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return { left: false, right: false, jump: false, sprint: true };

  const player = gameState.player;
  
  // Always sprint for speed bonus
  const action = { left: false, right: false, jump: false, sprint: true };

  // Find nearest coin
  let nearestCoin = null;
  let minCoinDist = Infinity;
  for (let coin of gameState.coins) {
    if (!coin.collected) {
      const dist = Math.abs(coin.x - player.x);
      if (dist < minCoinDist) {
        minCoinDist = dist;
        nearestCoin = coin;
      }
    }
  }

  // Find nearest enemy
  let nearestEnemy = null;
  let minEnemyDist = Infinity;
  for (let enemy of gameState.enemies) {
    if (!enemy.defeated) {
      const dist = Math.abs(enemy.x - player.x);
      if (dist < minEnemyDist && dist < 100) {
        minEnemyDist = dist;
        nearestEnemy = enemy;
      }
    }
  }

  // Decision making priority:
  // 1. Avoid enemies or stomp them
  // 2. Jump gaps
  // 3. Collect coins
  // 4. Move toward goal

  // Check if there's a gap ahead (no platform or ground)
  const checkAheadX = player.x + 50;
  let hasGroundAhead = false;
  
  for (let platform of gameState.platforms) {
    if (checkAheadX >= platform.x && 
        checkAheadX <= platform.x + platform.width &&
        platform.y > player.y + player.height - 10 &&
        platform.y < player.y + player.height + 100) {
      hasGroundAhead = true;
      break;
    }
  }

  // If near enemy and above it, stomp it
  if (nearestEnemy && player.y < nearestEnemy.y - 10 && minEnemyDist < 40) {
    action.right = nearestEnemy.x > player.x;
    action.left = nearestEnemy.x < player.x;
    // Fall onto enemy
  }
  // If near enemy at same level, jump over it
  else if (nearestEnemy && Math.abs(player.y - nearestEnemy.y) < 30 && minEnemyDist < 60) {
    action.jump = true;
    action.right = true; // Keep moving right
  }
  // Jump over gaps
  else if (!hasGroundAhead && player.isGrounded) {
    action.jump = true;
    action.right = true;
  }
  // Collect nearby coins
  else if (nearestCoin && minCoinDist < 150) {
    if (nearestCoin.x > player.x + 10) {
      action.right = true;
    } else if (nearestCoin.x < player.x - 10) {
      action.left = true;
    } else {
      action.right = true; // Default to moving right
    }
    
    // Jump if coin is above
    if (nearestCoin.y < player.y - 20 && player.isGrounded) {
      action.jump = true;
    }
  }
  // Default: move right toward goal
  else {
    action.right = true;
  }

  // Always jump when approaching platform edges while grounded
  if (player.isGrounded && action.right) {
    for (let platform of gameState.platforms) {
      const onPlatform = player.x + player.width > platform.x && 
                         player.x < platform.x + platform.width &&
                         Math.abs(player.y + player.height - platform.y) < 5;
      
      if (onPlatform && player.x + player.width > platform.x + platform.width - 20) {
        action.jump = true;
      }
    }
  }

  return action;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, jump: false, sprint: false };

  const player = gameState.player;
  const action = { left: false, right: false, jump: false, sprint: false };

  // Simple strategy: move right and jump when needed
  action.right = true;

  // Jump if we see a gap or obstacle
  const checkAheadX = player.x + 40;
  let needsJump = true;

  for (let platform of gameState.platforms) {
    if (checkAheadX >= platform.x && 
        checkAheadX <= platform.x + platform.width &&
        platform.y > player.y &&
        platform.y < player.y + 100) {
      needsJump = false;
      break;
    }
  }

  if (needsJump && player.isGrounded) {
    action.jump = true;
  }

  // Jump over enemies
  for (let enemy of gameState.enemies) {
    if (!enemy.defeated && Math.abs(enemy.x - player.x) < 50 && player.isGrounded) {
      action.jump = true;
    }
  }

  return action;
}

function getHealthTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, jump: false, sprint: false };

  const player = gameState.player;
  const action = { left: false, right: false, jump: false, sprint: false };

  // First, intentionally take damage by walking into an enemy
  if (gameState.hitsTaken === 0) {
    action.right = true;
    // Don't jump, let enemy hit us
  }
  // Then find and collect cloverleaf
  else {
    let nearestClover = null;
    let minDist = Infinity;
    for (let pickup of gameState.pickups) {
      if (!pickup.collected && pickup.type === 'clover') {
        const dist = Math.abs(pickup.x - player.x);
        if (dist < minDist) {
          minDist = dist;
          nearestClover = pickup;
        }
      }
    }

    if (nearestClover) {
      action.right = nearestClover.x > player.x;
      action.left = nearestClover.x < player.x;
      
      if (nearestClover.y < player.y - 20 && player.isGrounded) {
        action.jump = true;
      }
    } else {
      // After collecting clover, move toward goal
      action.right = true;
      
      // Jump over gaps
      const checkAheadX = player.x + 40;
      let needsJump = true;
      for (let platform of gameState.platforms) {
        if (checkAheadX >= platform.x && 
            checkAheadX <= platform.x + platform.width) {
          needsJump = false;
          break;
        }
      }
      if (needsJump && player.isGrounded) {
        action.jump = true;
      }
    }
  }

  return action;
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.5,
    jump: Math.random() < 0.2,
    sprint: Math.random() < 0.3
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getHealthTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;