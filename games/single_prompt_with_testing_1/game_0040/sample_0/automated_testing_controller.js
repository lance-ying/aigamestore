// automated_testing_controller.js - Automated testing logic

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

function getClosestEnemy(gameState) {
  let closest = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    const dist = gameState.castleX + 30 - enemy.x;
    if (dist < minDist && dist > 0) {
      minDist = dist;
      closest = enemy;
    }
  }
  
  return closest;
}

function getHighestHealthEnemy(gameState) {
  let target = null;
  let maxHealth = 0;
  
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    if (enemy.health > maxHealth) {
      maxHealth = enemy.health;
      target = enemy;
    }
  }
  
  return target;
}

function getTestWinAction(gameState) {
  const action = {
    cursorX: gameState.cursor.x,
    cursorY: gameState.cursor.y,
    fire: false,
    volley: false,
    bomber: false
  };

  // Strategy: Prioritize closest threats, use abilities on cooldown
  const closest = getClosestEnemy(gameState);
  const highestHealth = getHighestHealthEnemy(gameState);
  
  if (!closest) {
    return action;
  }

  // Target priority: closest enemy or highest health enemy
  const target = (closest.x < gameState.castleX + 200) ? closest : (highestHealth || closest);
  
  // Update cursor to track target
  action.cursorX = target.x;
  action.cursorY = target.y;

  // Fire projectile frequently
  if (gameState.projectiles.length < 5) {
    action.fire = true;
  }

  // Use volley when off cooldown and multiple enemies present
  const currentTime = Date.now();
  const volleyReady = currentTime - gameState.lastVolleyTime >= gameState.volleyCooldown;
  if (volleyReady && gameState.enemies.filter(e => !e.isDead).length >= 3) {
    action.volley = true;
  }

  // Use bomber strategically
  const bomberReady = currentTime - gameState.lastBomberTime >= gameState.bomberCooldown;
  if (bomberReady && !gameState.bomberActive && gameState.enemies.filter(e => !e.isDead).length >= 4) {
    action.bomber = true;
  } else if (gameState.bomberActive && gameState.bomberReadyToDetonate) {
    // Detonate when bomber is over cluster of enemies
    let enemiesNearBomber = 0;
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.sqrt((enemy.x - gameState.bomberX) ** 2 + (enemy.y - gameState.bomberY) ** 2);
      if (dist < 80) enemiesNearBomber++;
    }
    if (enemiesNearBomber >= 2 || gameState.bomberX > CANVAS_WIDTH - 100) {
      action.bomber = true;
    }
  } else if (gameState.bomberActive && !gameState.bomberReadyToDetonate && gameState.bomberX > CANVAS_WIDTH / 2) {
    // Mark ready to detonate when bomber reaches middle
    action.bomber = true;
  }

  // Auto-upgrade when resources available
  autoUpgrade(gameState);

  return action;
}

function getBasicTestAction(gameState) {
  const action = {
    cursorX: gameState.cursor.x,
    cursorY: gameState.cursor.y,
    fire: false,
    volley: false,
    bomber: false
  };

  const closest = getClosestEnemy(gameState);
  
  if (closest) {
    action.cursorX = closest.x;
    action.cursorY = closest.y;
    
    // Fire occasionally
    if (Math.random() < 0.3) {
      action.fire = true;
    }
    
    // Use abilities occasionally
    if (Math.random() < 0.1) {
      const currentTime = Date.now();
      const volleyReady = currentTime - gameState.lastVolleyTime >= gameState.volleyCooldown;
      if (volleyReady) {
        action.volley = true;
      }
    }
  }

  return action;
}

function autoUpgrade(gameState) {
  // Simple auto-upgrade logic: prioritize health, then damage
  if (gameState.resources >= 50 && gameState.upgrades.castleHealth < gameState.upgrades.maxCastleHealth * 0.7) {
    gameState.resources -= 50;
    gameState.upgrades.maxCastleHealth += 20;
    gameState.upgrades.castleHealth = Math.min(
      gameState.upgrades.castleHealth + 30,
      gameState.upgrades.maxCastleHealth
    );
  } else if (gameState.resources >= 30) {
    gameState.resources -= 30;
    gameState.upgrades.projectileDamage += 5;
  }
}

function getRandomAction(gameState) {
  const action = {
    cursorX: Math.random() * CANVAS_WIDTH,
    cursorY: Math.random() * CANVAS_HEIGHT,
    fire: Math.random() < 0.1,
    volley: Math.random() < 0.05,
    bomber: Math.random() < 0.03
  };
  return action;
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