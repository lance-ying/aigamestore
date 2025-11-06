// automated_testing_controller.js - Automated testing
import { CANVAS_WIDTH } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false };
  
  const platforms = gameState.platforms;
  const enemies = gameState.enemies;
  const goal = gameState.goal;
  
  // Strategy: Move right while avoiding enemies and jumping over gaps
  let action = { left: false, right: true, jump: false };
  
  // Check if we need to jump
  const playerBottom = player.y + player.height;
  const aheadDistance = 60;
  const checkX = player.x + aheadDistance;
  
  // Check if there's ground ahead
  let groundAhead = false;
  for (const plat of platforms) {
    if (plat.x <= checkX && plat.x + plat.width >= checkX && 
        plat.y >= playerBottom && plat.y < playerBottom + 100) {
      groundAhead = true;
      break;
    }
  }
  
  // Jump if no ground ahead or if there's an enemy ahead
  if (!groundAhead && player.grounded) {
    action.jump = true;
  }
  
  // Check for enemies ahead and jump to avoid
  for (const enemy of enemies) {
    const distToEnemy = enemy.x - player.x;
    if (distToEnemy > 0 && distToEnemy < 80 && Math.abs(enemy.y - player.y) < 60) {
      if (player.grounded) {
        action.jump = true;
      }
    }
  }
  
  // If goal is close, move toward it
  if (goal && Math.abs(goal.x - player.x) < 200) {
    if (goal.x > player.x) {
      action.right = true;
      action.left = false;
    } else {
      action.left = true;
      action.right = false;
    }
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false };
  
  // Simple strategy: move right and jump periodically
  const shouldJump = (gameState.p.frameCount % 60 < 15) && player.grounded;
  
  return {
    left: false,
    right: true,
    jump: shouldJump
  };
}

function getHealthTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false };
  
  const powerups = gameState.powerups;
  const enemies = gameState.enemies;
  
  // Strategy: collect health powerups and test damage
  if (powerups.length > 0 && !powerups[0].collected) {
    const target = powerups[0];
    const action = { left: false, right: false, jump: false };
    
    if (target.x > player.x + 20) {
      action.right = true;
    } else if (target.x < player.x - 20) {
      action.left = true;
    }
    
    if (Math.abs(target.x - player.x) < 100 && player.grounded) {
      action.jump = true;
    }
    
    return action;
  }
  
  // After collecting powerups, test damage by approaching enemies
  if (enemies.length > 0 && player.health > 1) {
    const target = enemies[0];
    const action = { left: false, right: false, jump: false };
    
    if (target.x > player.x + 20) {
      action.right = true;
    } else if (target.x < player.x - 20) {
      action.left = true;
    }
    
    return action;
  }
  
  return getTestWinAction(gameState);
}

function getPhysicsTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false };
  
  const frameCount = gameState.p ? gameState.p.frameCount : 0;
  
  // Test different movement patterns
  const phase = Math.floor(frameCount / 120) % 4;
  
  switch (phase) {
    case 0: // Move right
      return { left: false, right: true, jump: false };
    case 1: // Jump while moving right
      return { left: false, right: true, jump: player.grounded };
    case 2: // Move left
      return { left: true, right: false, jump: false };
    case 3: // Jump in place
      return { left: false, right: false, jump: player.grounded };
    default:
      return { left: false, right: false, jump: false };
  }
}

function getEnemyAvoidanceTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false };
  
  const enemies = gameState.enemies;
  const action = { left: false, right: true, jump: false };
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const enemy of enemies) {
    const dist = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + 
      Math.pow(enemy.y - player.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Avoid nearest enemy
  if (nearestEnemy && minDist < 100) {
    if (nearestEnemy.x > player.x) {
      action.right = false;
      action.left = true;
    } else {
      action.right = true;
      action.left = false;
    }
    
    if (player.grounded && minDist < 60) {
      action.jump = true;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false };
  
  const rand = Math.random();
  return {
    left: rand < 0.25,
    right: rand >= 0.25 && rand < 0.5,
    jump: rand >= 0.5 && rand < 0.6 && player.grounded
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
    case "TEST_4":
      return getEnemyAvoidanceTestAction(gameState);
    case "TEST_5":
      return getPhysicsTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;