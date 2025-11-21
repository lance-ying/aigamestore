// automated_testing_controller.js - Automated testing strategies

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getWinStrategyAction(gameState);
    case "TEST_3":
      return getMovementTestAction(gameState);
    case "TEST_4":
      return getCombatTestAction(gameState);
    case "TEST_5":
      return getLevelingTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// TEST_1: Basic survival test
function getBasicTestAction(gameState) {
  if (!gameState.player || gameState.enemies.length === 0) {
    return { left: false, right: false, up: false, down: false, fire: false };
  }
  
  const player = gameState.player;
  const enemies = gameState.enemies;
  
  // Find nearest enemy
  let nearest = null;
  let minDist = Infinity;
  
  for (const enemy of enemies) {
    const dist = Math.sqrt(
      (enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  // Move in circular pattern
  const centerX = 300;
  const centerY = 200;
  const orbitRadius = 120;
  const angle = (Date.now() / 1000) % (Math.PI * 2);
  
  const targetX = centerX + Math.cos(angle) * orbitRadius;
  const targetY = centerY + Math.sin(angle) * orbitRadius;
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  return {
    left: dx < -5,
    right: dx > 5,
    up: dy < -5,
    down: dy > 5,
    fire: true,
    toggleAutoAim: false,
    ability: false
  };
}

// TEST_2: Win strategy - optimal survival
function getWinStrategyAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, up: false, down: false, fire: false };
  }
  
  const player = gameState.player;
  
  // Enable auto-aim if not already
  if (!player.autoAim) {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
      toggleAutoAim: true,
      ability: false
    };
  }
  
  // Activate shield when available and health is low
  const useShield = player.health < player.maxHealth * 0.5 && 
                    player.level >= 2 && 
                    player.shieldCooldown === 0;
  
  // Find average enemy position (center of threat)
  let avgX = 0;
  let avgY = 0;
  let count = 0;
  
  for (const enemy of gameState.enemies) {
    const dist = Math.sqrt(
      (enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2
    );
    
    // Only consider nearby enemies
    if (dist < 150) {
      avgX += enemy.x;
      avgY += enemy.y;
      count++;
    }
  }
  
  if (count > 0) {
    avgX /= count;
    avgY /= count;
    
    // Move away from threat center
    const fleeX = player.x - avgX;
    const fleeY = player.y - avgY;
    const fleeDist = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
    
    if (fleeDist > 0) {
      const normalizedX = fleeX / fleeDist;
      const normalizedY = fleeY / fleeDist;
      
      // Stay within safe bounds
      const margin = 50;
      const tooLeft = player.x < margin;
      const tooRight = player.x > 600 - margin;
      const tooTop = player.y < margin;
      const tooBottom = player.y > 400 - margin;
      
      return {
        left: normalizedX < -0.3 && !tooLeft,
        right: normalizedX > 0.3 && !tooRight,
        up: normalizedY < -0.3 && !tooTop,
        down: normalizedY > 0.3 && !tooBottom,
        fire: true,
        toggleAutoAim: false,
        ability: useShield
      };
    }
  }
  
  // Default: move to center if no threats nearby
  const centerX = 300;
  const centerY = 200;
  
  return {
    left: player.x > centerX + 20,
    right: player.x < centerX - 20,
    up: player.y > centerY + 20,
    down: player.y < centerY - 20,
    fire: true,
    toggleAutoAim: false,
    ability: useShield
  };
}

// TEST_3: Movement validation
function getMovementTestAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, up: false, down: false, fire: false };
  }
  
  const player = gameState.player;
  const time = Date.now() / 1000;
  const phase = Math.floor(time / 2) % 8;
  
  // Test each direction and combination
  switch (phase) {
    case 0: return { right: true, fire: false }; // Right
    case 1: return { down: true, fire: false };  // Down
    case 2: return { left: true, fire: false };  // Left
    case 3: return { up: true, fire: false };    // Up
    case 4: return { right: true, down: true, fire: false }; // Diagonal
    case 5: return { left: true, down: true, fire: false };
    case 6: return { left: true, up: true, fire: false };
    case 7: return { right: true, up: true, fire: false };
    default: return { fire: false };
  }
}

// TEST_4: Combat mechanics
function getCombatTestAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, up: false, down: false, fire: false };
  }
  
  const player = gameState.player;
  
  // Stay in center and fire continuously
  const centerX = 300;
  const centerY = 200;
  
  return {
    left: player.x > centerX + 10,
    right: player.x < centerX - 10,
    up: player.y > centerY + 10,
    down: player.y < centerY - 10,
    fire: true,
    toggleAutoAim: false,
    ability: false
  };
}

// TEST_5: Leveling system
function getLevelingTestAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, up: false, down: false, fire: false };
  }
  
  const player = gameState.player;
  
  // Aggressively collect experience
  let targetX = player.x;
  let targetY = player.y;
  let foundPickup = false;
  
  for (const pickup of gameState.pickups) {
    if (pickup.type === "exp") {
      targetX = pickup.x;
      targetY = pickup.y;
      foundPickup = true;
      break;
    }
  }
  
  if (!foundPickup && gameState.enemies.length > 0) {
    // Move toward nearest enemy to kill it
    const nearest = gameState.enemies[0];
    targetX = nearest.x;
    targetY = nearest.y;
  }
  
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  return {
    left: dx < -5,
    right: dx > 5,
    up: dy < -5,
    down: dy > 5,
    fire: true,
    toggleAutoAim: true,
    ability: false
  };
}

// Fallback random action
function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    up: Math.random() < 0.3,
    down: Math.random() < 0.3,
    fire: Math.random() < 0.5,
    toggleAutoAim: false,
    ability: Math.random() < 0.1
  };
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;