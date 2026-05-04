// automated_testing_controller.js
import { gameState, GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Move towards nearest enemy, use skills when available, collect loot
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return {};
  }
  
  const player = gameState.player;
  if (!player || player.hp <= 0) return {};
  
  const actions = {};
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  for (const enemy of gameState.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
    );
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Move towards enemy or loot
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    
    // Move towards enemy
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) actions[39] = true; // Right
      else if (dx < -30) actions[37] = true; // Left
    } else {
      if (dy > 30) actions[40] = true; // Down
      else if (dy < -30) actions[38] = true; // Up
    }
    
    // Use dash if close enough
    if (nearestDist > 100 && nearestDist < 200 && gameState.dashCooldown === 0) {
      actions[32] = true; // Space
    }
    
    // Use special if charged and many enemies nearby
    let nearbyEnemies = 0;
    for (const enemy of gameState.enemies) {
      const dist = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
      );
      if (dist < 150) nearbyEnemies++;
    }
    if (gameState.specialCharge >= gameState.maxSpecialCharge && nearbyEnemies >= 3) {
      actions[90] = true; // Z
    }
  }
  
  // Use hero skills when ready
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    if (hero.hp > 0 && hero.skillCooldown === 0 && nearestEnemy && nearestDist < 150) {
      actions[49 + i] = true; // Keys 1-4
    }
  }
  
  return actions;
}

function getTestBasicAction(gameState) {
  // Test basic movement and mechanics
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return {};
  }
  
  const actions = {};
  const frame = gameState.player ? Math.floor(Date.now() / 1000) % 8 : 0;
  
  // Move in a pattern
  switch (frame) {
    case 0:
    case 1:
      actions[39] = true; // Right
      break;
    case 2:
    case 3:
      actions[40] = true; // Down
      break;
    case 4:
    case 5:
      actions[37] = true; // Left
      break;
    case 6:
    case 7:
      actions[38] = true; // Up
      break;
  }
  
  // Use dash occasionally
  if (frame === 2 && gameState.dashCooldown === 0) {
    actions[32] = true;
  }
  
  return actions;
}

function getTestSkillsAction(gameState) {
  // Test all skills systematically
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return {};
  }
  
  const actions = {};
  const player = gameState.player;
  if (!player) return actions;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  for (const enemy of gameState.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
    );
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Move towards enemy
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    
    if (Math.abs(dx) > 50) {
      actions[dx > 0 ? 39 : 37] = true;
    }
    if (Math.abs(dy) > 50) {
      actions[dy > 0 ? 40 : 38] = true;
    }
  }
  
  // Cycle through skills
  const cycleFrame = Math.floor(Date.now() / 1000) % 8;
  if (nearestEnemy && nearestDist < 150) {
    for (let i = 0; i < 4; i++) {
      if (cycleFrame === i * 2 && gameState.party[i] && gameState.party[i].skillCooldown === 0) {
        actions[49 + i] = true;
      }
    }
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = {};
  const rand = Math.random();
  
  if (rand < 0.2) actions[37] = true; // Left
  else if (rand < 0.4) actions[39] = true; // Right
  else if (rand < 0.6) actions[38] = true; // Up
  else if (rand < 0.8) actions[40] = true; // Down
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestSkillsAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;