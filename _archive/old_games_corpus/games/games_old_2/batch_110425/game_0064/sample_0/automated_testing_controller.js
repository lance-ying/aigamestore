// automated_testing_controller.js - Automated testing functions
import { PHASE_PLAYING, PHASE_UPGRADE_SCREEN, MISSIONS, CONTROL_TEST_1, CONTROL_TEST_2, CONTROL_TEST_3, CONTROL_TEST_4 } from './globals.js';

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win the game
  
  if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
    // Prioritize attack upgrades early, then health
    if (gameState.playerStats.attackLevel < 3 && gameState.goldCollected >= 50) {
      return { upgrade_attack: true };
    } else if (gameState.goldCollected >= 50) {
      return { upgrade_health: true };
    }
    return { continue: true };
  }

  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
    return null;
  }

  const player = gameState.player;
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shadowStrike: false,
    ninjaFury: false
  };

  // Find nearest alive enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (enemy.dead) continue;
    const dist = Math.abs(enemy.x - player.x);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (!nearestEnemy) return action;

  const dx = nearestEnemy.x - player.x;
  const distance = Math.abs(dx);

  // Use Ninja Fury when multiple enemies are close
  const enemiesInRange = gameState.enemies.filter(e => 
    !e.dead && Math.abs(e.x - player.x) < 150
  ).length;
  
  if (enemiesInRange >= 2 && gameState.skills.ninjaFury.cooldown <= 0) {
    action.ninjaFury = true;
  }

  // Use Shadow Strike to close distance or dodge
  if (distance > 100 && distance < 250 && gameState.skills.shadowStrike.cooldown <= 0) {
    action.shadowStrike = true;
  }

  // Jump to avoid enemy attacks when they're attacking
  if (distance < 60 && nearestEnemy.attackTimer > nearestEnemy.attackCooldown - 30) {
    action.jump = true;
  }

  // Attack when in range
  if (distance < 60) {
    action.attack = true;
    
    // Fine positioning
    if (dx > 20) {
      action.right = true;
    } else if (dx < -20) {
      action.left = true;
    }
  } else {
    // Move toward enemy
    if (dx > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  }

  // Retreat if health is low
  if (gameState.playerStats.health < gameState.playerStats.maxHealth * 0.3) {
    if (distance < 100) {
      action.left = dx > 0;
      action.right = dx < 0;
      action.jump = true;
    }
  }

  return action;
}

function getBasicTestAction(gameState) {
  // TEST_1: Basic movement and combat test
  
  if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
    if (gameState.goldCollected >= 50) {
      return { upgrade_attack: true };
    }
    return { continue: true };
  }

  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
    return null;
  }

  const player = gameState.player;
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shadowStrike: false,
    ninjaFury: false
  };

  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (enemy.dead) continue;
    const dist = Math.abs(enemy.x - player.x);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (!nearestEnemy) return action;

  const dx = nearestEnemy.x - player.x;
  const distance = Math.abs(dx);

  // Simple approach and attack
  if (distance < 50) {
    action.attack = true;
  } else {
    action.right = dx > 0;
    action.left = dx < 0;
  }

  // Random jump occasionally
  if (Math.random() < 0.02) {
    action.jump = true;
  }

  return action;
}

function getSkillTestAction(gameState) {
  // TEST_3: Test skill cooldowns
  
  if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
    return { continue: true };
  }

  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
    return null;
  }

  const player = gameState.player;
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shadowStrike: false,
    ninjaFury: false
  };

  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (enemy.dead) continue;
    const dist = Math.abs(enemy.x - player.x);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }

  if (!nearestEnemy) return action;

  const dx = nearestEnemy.x - player.x;
  const distance = Math.abs(dx);

  // Move toward enemy
  action.right = dx > 0;
  action.left = dx < 0;

  // Use skills whenever available
  if (gameState.skills.shadowStrike.cooldown <= 0) {
    action.shadowStrike = true;
  }

  if (gameState.skills.ninjaFury.cooldown <= 0 && distance < 100) {
    action.ninjaFury = true;
  }

  action.attack = distance < 60;

  return action;
}

function getUpgradeTestAction(gameState) {
  // TEST_4: Test upgrade system
  
  if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
    // Alternate between attack and health upgrades
    const totalLevels = gameState.playerStats.attackLevel + gameState.playerStats.healthLevel;
    
    if (gameState.goldCollected >= 50) {
      if (totalLevels % 2 === 0) {
        return { upgrade_attack: true };
      } else {
        return { upgrade_health: true };
      }
    }
    return { continue: true };
  }

  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
    return null;
  }

  // Basic combat to earn gold
  return getBasicTestAction(gameState);
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
    return null;
  }

  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    jump: Math.random() < 0.1,
    attack: Math.random() < 0.2,
    shadowStrike: Math.random() < 0.05,
    ninjaFury: Math.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case CONTROL_TEST_1:
      return getBasicTestAction(gameState);
    case CONTROL_TEST_2:
      return getTestWinAction(gameState);
    case CONTROL_TEST_3:
      return getSkillTestAction(gameState);
    case CONTROL_TEST_4:
      return getUpgradeTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;