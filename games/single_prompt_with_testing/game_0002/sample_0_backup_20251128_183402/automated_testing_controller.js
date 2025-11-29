// automated_testing_controller.js - Automated testing AI

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { arrow_right: true };
  
  const room = gameState.roomData[gameState.currentRoom];
  if (!room) return { arrow_right: true };
  
  // If selecting boon, choose first option
  if (gameState.selectingBoon) {
    return { space: true };
  }
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of room.enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // If there are enemies, engage them
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Attack if in range
    if (dist < 50 && player.attackCooldown === 0) {
      return { z: true };
    }
    
    // Dash if enemy is close and dash is ready
    if (dist < 60 && player.dashCooldown === 0 && player.health < player.maxHealth * 0.5) {
      return { space: true };
    }
    
    // Move toward enemy
    const angle = Math.atan2(dy, dx);
    return {
      arrow_right: Math.cos(angle) > 0.3,
      arrow_left: Math.cos(angle) < -0.3,
      arrow_down: Math.sin(angle) > 0.3,
      arrow_up: Math.sin(angle) < -0.3
    };
  }
  
  // No enemies, collect pickups
  for (const pickup of room.pickups) {
    if (!pickup.active) continue;
    
    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 10) {
      const angle = Math.atan2(dy, dx);
      return {
        arrow_right: Math.cos(angle) > 0.3,
        arrow_left: Math.cos(angle) < -0.3,
        arrow_down: Math.sin(angle) > 0.3,
        arrow_up: Math.sin(angle) < -0.3
      };
    }
  }
  
  // Room cleared, move to exit
  if (room.cleared) {
    // Move right to exit
    if (player.x < 560) {
      return { arrow_right: true };
    }
  }
  
  return {};
}

function getTestMovementAction(gameState) {
  const player = gameState.player;
  if (!player) return { arrow_right: true };
  
  // Simple movement test - move in a pattern
  const frame = gameState.frameCount;
  const pattern = Math.floor(frame / 60) % 4;
  
  switch (pattern) {
    case 0: return { arrow_right: true };
    case 1: return { arrow_down: true };
    case 2: return { arrow_left: true };
    case 3: return { arrow_up: true };
  }
  
  return {};
}

function getTestCombatAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const room = gameState.roomData[gameState.currentRoom];
  if (!room || room.enemies.length === 0) {
    return { arrow_right: true };
  }
  
  const enemy = room.enemies[0];
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Attack when close
  if (dist < 45) {
    return { z: true };
  }
  
  // Use dash occasionally
  if (dist < 80 && player.dashCooldown === 0 && Math.random() < 0.1) {
    return { space: true };
  }
  
  // Move toward enemy
  const angle = Math.atan2(dy, dx);
  return {
    arrow_right: Math.cos(angle) > 0.3,
    arrow_left: Math.cos(angle) < -0.3,
    arrow_down: Math.sin(angle) > 0.3,
    arrow_up: Math.sin(angle) < -0.3
  };
}

function getTestBoonAction(gameState) {
  // Test boon collection by clearing rooms
  if (gameState.selectingBoon) {
    // Cycle through different boon choices
    const choice = gameState.roomsCleared % 3;
    gameState.boonChoice = choice;
    return { space: true };
  }
  
  return getTestWinAction(gameState);
}

function getTestEnemyAIAction(gameState) {
  // Observe enemy behavior by moving around
  const player = gameState.player;
  if (!player) return {};
  
  const frame = gameState.frameCount;
  
  // Move in circles to test enemy pursuit
  const angle = (frame / 60) * Math.PI * 2;
  const centerX = 300;
  const centerY = 200;
  const radius = 100;
  
  const targetX = centerX + Math.cos(angle) * radius;
  const targetY = centerY + Math.sin(angle) * radius;
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  return {
    arrow_right: dx > 10,
    arrow_left: dx < -10,
    arrow_down: dy > 10,
    arrow_up: dy < -10
  };
}

function getRandomAction(gameState) {
  const rand = Math.random();
  
  if (rand < 0.1) return { z: true };
  if (rand < 0.15) return { space: true };
  
  const dir = Math.random();
  if (dir < 0.25) return { arrow_up: true };
  if (dir < 0.5) return { arrow_down: true };
  if (dir < 0.75) return { arrow_left: true };
  return { arrow_right: true };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    case "TEST_4":
      return getTestBoonAction(gameState);
    case "TEST_5":
      return getTestEnemyAIAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;