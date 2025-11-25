// automated_testing_controller.js - Automated testing functions
import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win the game
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
  
  // Priority 1: Collect power gems to unlock dash
  if (gameState.powerGemsCollected < 10) {
    const nearestGem = findNearestPowerGem(gameState);
    if (nearestGem) {
      return moveTowardsTarget(player, nearestGem.x, nearestGem.y, action);
    }
  }
  
  // Priority 2: Attack enemies and boss
  const nearestEnemy = findNearestEnemy(gameState);
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Shoot if in range
    if (dist < 250 && player.shootCooldown === 0) {
      action.shoot = true;
    }
    
    // Use dash to avoid danger
    if (gameState.dashUnlocked && dist < 80 && player.dashCooldown === 0) {
      action.dash = true;
      action.left = dx > 0;
      action.right = dx < 0;
      return action;
    }
    
    // Keep distance while shooting
    if (dist < 100) {
      action.left = dx > 0;
      action.right = dx < 0;
      action.jump = player.onGround;
    } else if (dist < 300) {
      // Position for shooting
      action.left = dx < -20;
      action.right = dx > 20;
      action.shoot = true;
    }
  }
  
  // Priority 3: Progress through world
  if (!nearestEnemy || (nearestEnemy && Math.abs(nearestEnemy.x - player.x) > 300)) {
    action.right = true;
    
    // Jump over gaps
    if (player.onGround && shouldJump(player, gameState)) {
      action.jump = true;
    }
  }
  
  return action;
}

function getTestBasicAction(gameState) {
  // TEST_1: Basic movement and navigation
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
  
  // Collect nearby gems
  const nearestGem = findNearestPowerGem(gameState);
  if (nearestGem && Math.abs(nearestGem.x - player.x) < 200) {
    return moveTowardsTarget(player, nearestGem.x, nearestGem.y, action);
  }
  
  // Move right and jump over gaps
  action.right = true;
  if (player.onGround && shouldJump(player, gameState)) {
    action.jump = true;
  }
  
  // Avoid enemies
  const nearestEnemy = findNearestEnemy(gameState);
  if (nearestEnemy && Math.abs(nearestEnemy.x - player.x) < 80) {
    action.left = nearestEnemy.x < player.x;
    action.right = nearestEnemy.x > player.x;
    action.jump = player.onGround;
  }
  
  return action;
}

function getTestCombatAction(gameState) {
  // TEST_3: Combat mechanics testing
  const player = gameState.player;
  if (!player) return getRandomAction(gameState);
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false
  };
  
  // Find and engage enemies
  const nearestEnemy = findNearestEnemy(gameState);
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Move towards enemy
    action.left = dx < -30;
    action.right = dx > 30;
    
    // Shoot when in range
    if (dist < 250) {
      action.shoot = true;
    }
    
    // Jump to reach flying enemies
    if (dy < -50 && player.onGround) {
      action.jump = true;
    }
    
    // Use dash in combat
    if (gameState.dashUnlocked && dist > 150 && dist < 250 && player.dashCooldown === 0) {
      action.dash = true;
      action.left = dx < 0;
      action.right = dx > 0;
    }
  } else {
    // Seek out enemies
    action.right = true;
    if (player.onGround && shouldJump(player, gameState)) {
      action.jump = true;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  // Random action for fallback
  const player = gameState.player;
  if (!player) return { left: false, right: false, jump: false, shoot: false, dash: false };
  
  return {
    left: Math.random() < 0.2,
    right: Math.random() < 0.4,
    jump: player.onGround && Math.random() < 0.1,
    shoot: Math.random() < 0.3,
    dash: false
  };
}

// Helper functions
function findNearestPowerGem(gameState) {
  const player = gameState.player;
  let nearest = null;
  let minDist = Infinity;
  
  for (let gem of gameState.powerGems) {
    if (gem.active) {
      const dx = gem.x - player.x;
      const dy = gem.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = gem;
      }
    }
  }
  
  return nearest;
}

function findNearestEnemy(gameState) {
  const player = gameState.player;
  let nearest = null;
  let minDist = Infinity;
  
  // Check regular enemies
  for (let enemy of gameState.enemies) {
    if (enemy.active) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
  }
  
  // Check boss
  if (gameState.boss && gameState.boss.active) {
    const dx = gameState.boss.x - player.x;
    const dy = gameState.boss.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = gameState.boss;
    }
  }
  
  return nearest;
}

function moveTowardsTarget(player, targetX, targetY, action) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  action.left = dx < -10;
  action.right = dx > 10;
  
  if (dy < -20 && player.onGround) {
    action.jump = true;
  }
  
  return action;
}

function shouldJump(player, gameState) {
  // Check if there's a gap ahead
  const checkX = player.x + (player.facingRight ? 60 : -60);
  let platformAhead = false;
  
  for (let platform of gameState.platforms) {
    if (checkX >= platform.x && 
        checkX <= platform.x + platform.width &&
        platform.y > player.y &&
        platform.y < player.y + 100) {
      platformAhead = true;
      break;
    }
  }
  
  return !platformAhead;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;