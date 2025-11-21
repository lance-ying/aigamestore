// automated_testing_controller.js - Automated testing logic

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  const action = { up: false, down: false, left: false, right: false, attack: false, special: false };

  // Priority 1: Collect Qi orbs for progression
  const nearestOrb = findNearestQiOrb(gameState);
  if (nearestOrb) {
    moveTowards(player, nearestOrb, action);
  }

  // Priority 2: Attack nearby enemies
  const nearestEnemy = findNearestEnemy(gameState);
  if (nearestEnemy) {
    const dx = nearestEnemy.worldX - player.worldX;
    const dy = nearestEnemy.worldY - player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < player.attackRange) {
      action.attack = true;
    } else if (dist < 150) {
      // Move towards enemy if close
      moveTowards(player, nearestEnemy, action);
    }

    // Use special ability if multiple enemies nearby and we have Qi
    if (countEnemiesNearby(gameState, 150) >= 2 && gameState.qi >= 10) {
      action.special = true;
    }
  }

  // Priority 3: Avoid enemies if health is low
  if (player.health < player.maxHealth * 0.3 && nearestEnemy) {
    const dx = nearestEnemy.worldX - player.worldX;
    const dy = nearestEnemy.worldY - player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 100) {
      // Move away from enemy
      if (dx > 0) action.left = true;
      if (dx < 0) action.right = true;
      if (dy > 0) action.up = true;
      if (dy < 0) action.down = true;
    }
  }

  return action;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  const action = { up: false, down: false, left: false, right: false, attack: false, special: false };

  // Simple behavior: collect orbs and attack enemies
  const nearestOrb = findNearestQiOrb(gameState);
  if (nearestOrb) {
    moveTowards(player, nearestOrb, action);
  }

  const nearestEnemy = findNearestEnemy(gameState);
  if (nearestEnemy) {
    const dx = nearestEnemy.worldX - player.worldX;
    const dy = nearestEnemy.worldY - player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < player.attackRange) {
      action.attack = true;
    }
  }

  return action;
}

function getRandomAction(gameState) {
  const rand = Math.random();
  return {
    up: rand < 0.25,
    down: rand < 0.5 && rand >= 0.25,
    left: rand < 0.75 && rand >= 0.5,
    right: rand < 1.0 && rand >= 0.75,
    attack: Math.random() < 0.3,
    special: false
  };
}

// Helper functions
function findNearestQiOrb(gameState) {
  const player = gameState.player;
  let nearest = null;
  let minDist = Infinity;

  for (const orb of gameState.qiOrbs) {
    if (!orb.active) continue;
    const dx = orb.worldX - player.worldX;
    const dy = orb.worldY - player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      minDist = dist;
      nearest = orb;
    }
  }

  return nearest;
}

function findNearestEnemy(gameState) {
  const player = gameState.player;
  let nearest = null;
  let minDist = Infinity;

  for (const enemy of gameState.enemies) {
    if (!enemy.active) continue;
    const dx = enemy.worldX - player.worldX;
    const dy = enemy.worldY - player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

function countEnemiesNearby(gameState, range) {
  const player = gameState.player;
  let count = 0;

  for (const enemy of gameState.enemies) {
    if (!enemy.active) continue;
    const dx = enemy.worldX - player.worldX;
    const dy = enemy.worldY - player.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < range) count++;
  }

  return count;
}

function moveTowards(player, target, action) {
  const dx = target.worldX - player.worldX;
  const dy = target.worldY - player.worldY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 5) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) action.right = true;
      else action.left = true;
    } else {
      if (dy > 0) action.down = true;
      else action.up = true;
    }
  }
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

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;