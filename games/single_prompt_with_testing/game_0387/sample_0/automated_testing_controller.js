// automated_testing_controller.js - Automated testing AI

import { gameState, GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return { keys: [] };
  }

  const player = gameState.player;
  const keys = [];

  // Track position to detect stalling
  if (!gameState.positionHistory) {
    gameState.positionHistory = [];
  }
  gameState.positionHistory.push({ x: player.x, y: player.y });
  if (gameState.positionHistory.length > 120) {
    gameState.positionHistory.shift();
  }

  // Find closest enemy
  let closestEnemy = null;
  let minDistance = Infinity;

  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestEnemy = enemy;
    }
  }

  if (!closestEnemy) {
    return { keys: [] };
  }

  const dx = closestEnemy.x - player.x;
  const dy = closestEnemy.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Strategy: Aggressive approach with blocking
  if (distance > 80) {
    // Approach with sprint
    if (dx > 10) {
      keys.push(39); // RIGHT
      keys.push(16); // SHIFT (sprint)
    } else if (dx < -10) {
      keys.push(37); // LEFT
      keys.push(16); // SHIFT (sprint)
    }
  } else if (distance > 50 && distance <= 80) {
    // Close range - approach carefully
    if (dx > 5) {
      keys.push(39); // RIGHT
    } else if (dx < -5) {
      keys.push(37); // LEFT
    }
    
    // Attack if in range and not on cooldown
    if (distance < 70 && player.attackCooldown === 0) {
      keys.push(90); // Z (attack)
    }
  } else {
    // Very close - block if enemy is attacking
    if (closestEnemy.isAttacking) {
      keys.push(32); // SPACE (block)
    } else if (player.attackCooldown === 0) {
      keys.push(90); // Z (attack)
    }
    
    // Maintain position
    if (Math.abs(dx) > 5) {
      if (dx > 0) {
        keys.push(39); // RIGHT
      } else {
        keys.push(37); // LEFT
      }
    }
  }

  // Jump if enemy is higher or for mobility
  if (dy < -20 && player.isGrounded) {
    keys.push(38); // UP (jump)
  }

  // Defensive retreat if low health
  if (player.health < 30) {
    keys.length = 0; // Clear attack keys
    keys.push(32); // SPACE (block)
    if (dx > 0) {
      keys.push(37); // LEFT (retreat)
    } else {
      keys.push(39); // RIGHT (retreat)
    }
  }

  return { keys };
}

function getDefensiveTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return { keys: [] };
  }

  const player = gameState.player;
  const keys = [];

  // Find closest enemy
  let closestEnemy = null;
  let minDistance = Infinity;

  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestEnemy = enemy;
    }
  }

  if (!closestEnemy) {
    return { keys: [] };
  }

  const dx = closestEnemy.x - player.x;
  const distance = Math.sqrt(dx * dx);

  // Defensive strategy: Block frequently, counter-attack when safe
  if (closestEnemy.isAttacking || distance < 60) {
    keys.push(32); // SPACE (block)
  } else if (distance < 100 && player.attackCooldown === 0 && !closestEnemy.isAttacking) {
    // Safe to attack
    keys.push(90); // Z (attack)
    
    // Move closer for attack
    if (Math.abs(dx) > 50) {
      if (dx > 0) {
        keys.push(39); // RIGHT
      } else {
        keys.push(37); // LEFT
      }
    }
  } else {
    // Maintain safe distance
    if (distance < 80) {
      // Retreat
      if (dx > 0) {
        keys.push(37); // LEFT
      } else {
        keys.push(39); // RIGHT
      }
    } else if (distance > 150) {
      // Approach
      if (dx > 0) {
        keys.push(39); // RIGHT
      } else {
        keys.push(37); // LEFT
      }
    }
  }

  return { keys };
}

function getAggressiveTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return { keys: [] };
  }

  const player = gameState.player;
  const keys = [];

  // Find closest enemy
  let closestEnemy = null;
  let minDistance = Infinity;

  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestEnemy = enemy;
    }
  }

  if (!closestEnemy) {
    return { keys: [] };
  }

  const dx = closestEnemy.x - player.x;

  // Always sprint and attack aggressively
  keys.push(16); // SHIFT (sprint)
  
  if (dx > 5) {
    keys.push(39); // RIGHT
  } else if (dx < -5) {
    keys.push(37); // LEFT
  }

  // Attack whenever possible
  if (player.attackCooldown === 0) {
    keys.push(90); // Z (attack)
  }

  // Jump for mobility
  if (player.isGrounded && Math.random() < 0.1) {
    keys.push(38); // UP
  }

  return { keys };
}

function getBoundaryTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return { keys: [] };
  }

  const player = gameState.player;
  const keys = [];
  
  gameState.framesSinceLastAction = (gameState.framesSinceLastAction || 0) + 1;

  // Test movement to boundaries
  const testPhase = Math.floor(gameState.framesSinceLastAction / 60) % 8;

  switch (testPhase) {
    case 0: // Move left
      keys.push(37);
      break;
    case 1: // Move right
      keys.push(39);
      break;
    case 2: // Sprint left
      keys.push(37);
      keys.push(16);
      break;
    case 3: // Sprint right
      keys.push(39);
      keys.push(16);
      break;
    case 4: // Jump left
      keys.push(37);
      keys.push(38);
      break;
    case 5: // Jump right
      keys.push(39);
      keys.push(38);
      break;
    case 6: // Attack
      keys.push(90);
      break;
    case 7: // Block
      keys.push(32);
      break;
  }

  return { keys };
}

function getMovementTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return { keys: [] };
  }

  const keys = [];
  gameState.framesSinceLastAction = (gameState.framesSinceLastAction || 0) + 1;

  // Test various movement patterns
  const testPhase = Math.floor(gameState.framesSinceLastAction / 45) % 6;

  switch (testPhase) {
    case 0: // Walk right
      keys.push(39);
      break;
    case 1: // Walk left
      keys.push(37);
      break;
    case 2: // Sprint right
      keys.push(39);
      keys.push(16);
      break;
    case 3: // Sprint left
      keys.push(37);
      keys.push(16);
      break;
    case 4: // Jump
      keys.push(38);
      break;
    case 5: // Jump and move
      keys.push(38);
      keys.push(39);
      break;
  }

  return { keys };
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { keys: [] };
  }

  const keys = [];
  const rand = Math.random();

  if (rand < 0.3) keys.push(37); // LEFT
  else if (rand < 0.6) keys.push(39); // RIGHT
  
  if (Math.random() < 0.1) keys.push(38); // UP
  if (Math.random() < 0.15) keys.push(90); // Z
  if (Math.random() < 0.1) keys.push(32); // SPACE
  if (Math.random() < 0.2) keys.push(16); // SHIFT

  return { keys };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getMovementTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getDefensiveTestAction(gameState);
    case "TEST_4":
      return getAggressiveTestAction(gameState);
    case "TEST_5":
      return getBoundaryTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;