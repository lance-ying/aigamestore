// automated_testing_controller.js - Automated testing logic

import { KEYS, gameState } from './globals.js';

let testState = {
  positionHistory: [],
  stuckCounter: 0,
  lastAction: null,
  targetReached: false,
  attackCooldown: 0,
  strategy: 'explore'
};

function getRandomAction(gameState) {
  const actions = [
    { keys: [KEYS.LEFT] },
    { keys: [KEYS.RIGHT] },
    { keys: [KEYS.SPACE] },
    { keys: [KEYS.UP] },
    { keys: [] }
  ];
  
  // Add dash if unlocked
  if (gameState.unlockedAbilities.dash) {
    actions.push({ keys: [KEYS.RIGHT, KEYS.SHIFT] });
    actions.push({ keys: [KEYS.LEFT, KEYS.SHIFT] });
  }
  
  // Add spell if unlocked
  if (gameState.unlockedAbilities.spell && gameState.player.soul >= 33) {
    actions.push({ keys: [KEYS.Z] });
  }
  
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}

function getTestBasicAction(gameState) {
  const player = gameState.player;
  if (!player) return { keys: [] };
  
  testState.attackCooldown--;
  
  // Track position to detect getting stuck
  testState.positionHistory.push({ x: player.x, y: player.y });
  if (testState.positionHistory.length > 30) {
    testState.positionHistory.shift();
  }
  
  // Check if stuck
  if (testState.positionHistory.length >= 30) {
    const recentPos = testState.positionHistory.slice(-30);
    const avgX = recentPos.reduce((sum, p) => sum + p.x, 0) / 30;
    const variance = recentPos.reduce((sum, p) => sum + Math.abs(p.x - avgX), 0) / 30;
    if (variance < 5) {
      testState.stuckCounter++;
      if (testState.stuckCounter > 20) {
        // Try to get unstuck
        return { keys: [KEYS.SPACE, KEYS.UP] };
      }
    } else {
      testState.stuckCounter = 0;
    }
  }
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.room !== gameState.currentRoom || enemy.dead) continue;
    const dist = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Attack nearby enemies
  if (nearestEnemy && minDist < 50 && testState.attackCooldown <= 0) {
    testState.attackCooldown = 20;
    return { keys: [KEYS.SPACE] };
  }
  
  // Move toward enemy
  if (nearestEnemy && minDist < 200) {
    const keys = [];
    if (nearestEnemy.x > player.x + 20) {
      keys.push(KEYS.RIGHT);
    } else if (nearestEnemy.x < player.x - 20) {
      keys.push(KEYS.LEFT);
    }
    
    // Jump if enemy is higher
    if (nearestEnemy.y < player.y - 40 && player.onGround) {
      keys.push(KEYS.UP);
    }
    
    return { keys };
  }
  
  // Explore - move right generally
  const keys = [KEYS.RIGHT];
  if (Math.random() < 0.1 && player.onGround) {
    keys.push(KEYS.UP);
  }
  
  return { keys };
}

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { keys: [] };
  
  testState.attackCooldown--;
  
  // Track position
  testState.positionHistory.push({ x: player.x, y: player.y, room: gameState.currentRoom });
  if (testState.positionHistory.length > 50) {
    testState.positionHistory.shift();
  }
  
  // Priority 1: Defeat bosses
  for (let boss of gameState.bosses) {
    if (boss.room !== gameState.currentRoom || boss.dead) continue;
    
    const dx = boss.x + boss.width/2 - player.x;
    const dy = boss.y + boss.height/2 - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    const keys = [];
    
    // Move toward boss
    if (Math.abs(dx) > 60) {
      keys.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    }
    
    // Jump if boss is higher
    if (dy < -40 && player.onGround) {
      keys.push(KEYS.UP);
    }
    
    // Attack when in range
    if (dist < 70 && testState.attackCooldown <= 0) {
      keys.push(KEYS.SPACE);
      testState.attackCooldown = 15;
    }
    
    // Use spell if available
    if (gameState.unlockedAbilities.spell && player.soul >= 33 && dist < 150) {
      keys.push(KEYS.Z);
    }
    
    // Dash to avoid danger
    if (gameState.unlockedAbilities.dash && player.dashCooldown === 0 && dist < 40) {
      keys.push(KEYS.SHIFT);
    }
    
    return { keys };
  }
  
  // Priority 2: Progress through rooms
  const targetRoom = gameState.rooms.length - 1;
  
  if (gameState.currentRoom < targetRoom) {
    // Need to go down
    if (player.y < CANVAS_HEIGHT - 100) {
      // Move toward bottom of screen
      return { keys: [KEYS.DOWN] };
    } else {
      // At bottom, move toward center
      const keys = [];
      if (player.x < CANVAS_WIDTH/2 - 50) {
        keys.push(KEYS.RIGHT);
      } else if (player.x > CANVAS_WIDTH/2 + 50) {
        keys.push(KEYS.LEFT);
      }
      return { keys };
    }
  }
  
  // Priority 3: Collect abilities
  for (let ability of gameState.abilities) {
    if (ability.room !== gameState.currentRoom || ability.collected) continue;
    
    const dx = ability.x - player.x;
    const keys = [];
    
    if (Math.abs(dx) > 20) {
      keys.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    }
    
    if (Math.abs(dx) < 50 && player.onGround) {
      keys.push(KEYS.UP);
    }
    
    return { keys };
  }
  
  // Priority 4: Clear enemies
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.room !== gameState.currentRoom || enemy.dead) continue;
    const dist = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const keys = [];
    
    if (Math.abs(dx) > 30) {
      keys.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    }
    
    if (minDist < 50 && testState.attackCooldown <= 0) {
      keys.push(KEYS.SPACE);
      testState.attackCooldown = 15;
    }
    
    if (nearestEnemy.y < player.y - 40 && player.onGround) {
      keys.push(KEYS.UP);
    }
    
    return { keys };
  }
  
  // Default: explore and progress
  return { keys: [KEYS.RIGHT] };
}

function getTestFailAction(gameState) {
  // Intentionally take damage
  const player = gameState.player;
  if (!player) return { keys: [] };
  
  // Find enemies and move toward them without attacking
  for (let enemy of gameState.enemies) {
    if (enemy.room !== gameState.currentRoom || enemy.dead) continue;
    
    const dx = enemy.x - player.x;
    const keys = [];
    
    keys.push(dx > 0 ? KEYS.RIGHT : KEYS.LEFT);
    
    return { keys };
  }
  
  return { keys: [KEYS.RIGHT] };
}

function getTestAbilitiesAction(gameState) {
  const player = gameState.player;
  if (!player) return { keys: [] };
  
  // Progress to ability rooms
  if (!gameState.unlockedAbilities.dash) {
    // Head to room 3
    if (gameState.currentRoom < 3) {
      if (player.y < CANVAS_HEIGHT - 100) {
        return { keys: [KEYS.DOWN] };
      }
      return { keys: [KEYS.RIGHT] };
    }
    
    // Collect dash ability
    for (let ability of gameState.abilities) {
      if (ability.type === 'dash' && !ability.collected) {
        const dx = ability.x - player.x;
        return { keys: dx > 0 ? [KEYS.RIGHT] : [KEYS.LEFT] };
      }
    }
  }
  
  // Test dash
  if (gameState.unlockedAbilities.dash && player.dashCooldown === 0) {
    return { keys: [KEYS.RIGHT, KEYS.SHIFT] };
  }
  
  // Get spell ability from boss
  if (!gameState.unlockedAbilities.spell) {
    return getTestWinAction(gameState);
  }
  
  // Test spell
  if (player.soul >= 33) {
    return { keys: [KEYS.Z] };
  }
  
  return { keys: [KEYS.RIGHT] };
}

function getTestPlatformingAction(gameState) {
  const player = gameState.player;
  if (!player) return { keys: [] };
  
  // Test jumping and movement
  const keys = [KEYS.RIGHT];
  
  if (player.onGround && Math.random() < 0.3) {
    keys.push(KEYS.UP);
  }
  
  // Test dash
  if (gameState.unlockedAbilities.dash && player.dashCooldown === 0 && Math.random() < 0.1) {
    keys.push(KEYS.SHIFT);
  }
  
  return { keys };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestFailAction(gameState);
    case "TEST_4":
      return getTestAbilitiesAction(gameState);
    case "TEST_5":
      return getTestPlatformingAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;