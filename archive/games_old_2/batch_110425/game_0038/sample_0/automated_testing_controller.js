// automated_testing_controller.js - Automated testing implementation

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const actions = {
    left: false,
    right: false,
    space: false,
    z: false,
    shift: false
  };

  if (!gameState.player || gameState.player.health <= 0) {
    return actions;
  }

  // Find nearest enemy
  const enemies = gameState.entities.filter(e => 
    e.type === 'enemy' && e.health > 0
  );

  if (enemies.length === 0) {
    // No enemies, move right to progress
    actions.right = true;
    return actions;
  }

  // Sort enemies by distance
  enemies.sort((a, b) => {
    const distA = Math.abs(a.x - gameState.player.x);
    const distB = Math.abs(b.x - gameState.player.x);
    return distA - distB;
  });

  const nearestEnemy = enemies[0];
  const dx = nearestEnemy.x - gameState.player.x;
  const dist = Math.abs(dx);

  // Strategy: maintain optimal distance and attack
  const optimalDistance = 40;

  if (dist > optimalDistance + 20) {
    // Move toward enemy
    if (dx > 0) {
      actions.right = true;
    } else {
      actions.left = true;
    }
  } else if (dist < optimalDistance - 10) {
    // Move away if too close
    if (dx > 0) {
      actions.left = true;
    } else {
      actions.right = true;
    }
  } else {
    // At good distance, attack
    if (gameState.player.attackCooldown === 0) {
      actions.space = true;
    }

    // Use special attack if health is high and multiple enemies
    if (gameState.player.health > 50 && enemies.length > 2 && 
        gameState.player.specialCooldown === 0) {
      actions.z = true;
    }

    // Use grab on bosses if available
    if (nearestEnemy.enemyType === 'boss' && gameState.player.grabCooldown === 0) {
      actions.shift = true;
    }
  }

  // Avoid being surrounded - prioritize space
  const enemiesNearby = enemies.filter(e => {
    const d = Math.abs(e.x - gameState.player.x);
    return d < 60;
  });

  if (enemiesNearby.length > 2) {
    // Back away and use special
    if (gameState.player.health > 30 && gameState.player.specialCooldown === 0) {
      actions.z = true;
    }
    actions.left = true;
    actions.right = false;
  }

  return actions;
}

function getBasicTestAction(gameState) {
  const actions = {
    left: false,
    right: false,
    space: false,
    z: false,
    shift: false
  };

  if (!gameState.player || gameState.player.health <= 0) {
    return actions;
  }

  const frame = gameState.frameCount;

  // Simple pattern: move right and attack periodically
  if (frame % 60 < 40) {
    actions.right = true;
  }

  if (frame % 30 === 0) {
    actions.space = true;
  }

  // Find enemies
  const enemies = gameState.entities.filter(e => 
    e.type === 'enemy' && e.health > 0
  );

  if (enemies.length > 0) {
    const nearestEnemy = enemies[0];
    const dx = nearestEnemy.x - gameState.player.x;
    const dist = Math.abs(dx);

    if (dist < 50) {
      actions.space = true;
    }
  }

  return actions;
}

function getRandomAction(gameState) {
  const actions = {
    left: Math.random() < 0.1,
    right: Math.random() < 0.1,
    space: Math.random() < 0.05,
    z: Math.random() < 0.02,
    shift: Math.random() < 0.02
  };

  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;