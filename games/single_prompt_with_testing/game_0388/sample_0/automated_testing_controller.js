// automated_testing_controller.js - Automated testing

import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, shoot: false, sprint: false };
  }
  
  const player = gameState.player;
  const enemies = gameState.enemies;
  const innocents = gameState.innocents;
  
  let action = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    sprint: false,
    switchWeapon: false
  };
  
  // Find nearest enemy
  if (enemies.length > 0) {
    let nearestEnemy = enemies[0];
    let minDist = Infinity;
    
    for (let enemy of enemies) {
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    // Check if any innocent is in the line of fire
    let innocentInWay = false;
    for (let innocent of innocents) {
      const distToInnocent = Math.hypot(innocent.x - player.x, innocent.y - player.y);
      const distToEnemy = Math.hypot(nearestEnemy.x - player.x, nearestEnemy.y - player.y);
      
      if (distToInnocent < distToEnemy) {
        const angleToEnemy = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
        const angleToInnocent = Math.atan2(innocent.y - player.y, innocent.x - player.x);
        const angleDiff = Math.abs(angleToEnemy - angleToInnocent);
        
        if (angleDiff < 0.3) {
          innocentInWay = true;
          break;
        }
      }
    }
    
    // Movement strategy
    const optimalDistance = 120; // Stay at medium range
    
    if (minDist > optimalDistance + 20) {
      // Move toward enemy
      if (nearestEnemy.x < player.x - 5) action.left = true;
      if (nearestEnemy.x > player.x + 5) action.right = true;
      if (nearestEnemy.y < player.y - 5) action.up = true;
      if (nearestEnemy.y > player.y + 5) action.down = true;
      action.sprint = true;
    } else if (minDist < optimalDistance - 20) {
      // Move away from enemy
      if (nearestEnemy.x < player.x) action.right = true;
      if (nearestEnemy.x > player.x) action.left = true;
      if (nearestEnemy.y < player.y) action.down = true;
      if (nearestEnemy.y > player.y) action.up = true;
    } else {
      // Strafe around enemy
      const perpAngle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x) + Math.PI / 2;
      if (Math.cos(perpAngle) > 0) action.right = true;
      else action.left = true;
    }
    
    // Shoot if clear shot
    if (!innocentInWay && minDist < 250) {
      action.shoot = true;
    }
    
    // Avoid innocents
    for (let innocent of innocents) {
      const distToInnocent = Math.hypot(innocent.x - player.x, innocent.y - player.y);
      if (distToInnocent < 60) {
        // Move away from innocent
        if (innocent.x < player.x) action.right = true;
        if (innocent.x > player.x) action.left = true;
        if (innocent.y < player.y) action.down = true;
        if (innocent.y > player.y) action.up = true;
        action.shoot = false; // Don't shoot near innocents
      }
    }
  }
  
  return action;
}

function getMovementTestAction(gameState) {
  // Test movement in a pattern
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, shoot: false, sprint: false };
  }
  
  const frameCount = gameState.frameCount || 0;
  const cycle = Math.floor(frameCount / 60) % 4;
  
  let action = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: frameCount % 30 === 0,
    sprint: frameCount % 120 < 60,
    switchWeapon: false
  };
  
  switch(cycle) {
    case 0: action.right = true; break;
    case 1: action.down = true; break;
    case 2: action.left = true; break;
    case 3: action.up = true; break;
  }
  
  return action;
}

function getWeaponTestAction(gameState) {
  // Test weapon switching and shooting
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, shoot: false, sprint: false };
  }
  
  const frameCount = gameState.frameCount || 0;
  
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: frameCount % 20 === 0,
    sprint: false,
    switchWeapon: frameCount % 180 === 0
  };
}

function getSprintTestAction(gameState) {
  // Test sprint and stamina
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, shoot: false, sprint: false };
  }
  
  const frameCount = gameState.frameCount || 0;
  const cycle = frameCount % 200;
  
  return {
    left: false,
    right: cycle < 100,
    up: false,
    down: false,
    shoot: false,
    sprint: cycle < 100,
    switchWeapon: false
  };
}

function getInnocentTestAction(gameState) {
  // Test innocent protection (this should LOSE the game)
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return { left: false, right: false, up: false, down: false, shoot: false, sprint: false };
  }
  
  const player = gameState.player;
  const innocents = gameState.innocents;
  
  if (innocents.length > 0) {
    const innocent = innocents[0];
    
    // Move toward innocent
    let action = {
      left: innocent.x < player.x,
      right: innocent.x > player.x,
      up: innocent.y < player.y,
      down: innocent.y > player.y,
      shoot: true, // Shoot toward innocent
      sprint: true,
      switchWeapon: false
    };
    
    return action;
  }
  
  return { left: false, right: false, up: false, down: false, shoot: false, sprint: false };
}

function getRandomAction(gameState) {
  return {
    left: Math.random() > 0.7,
    right: Math.random() > 0.7,
    up: Math.random() > 0.7,
    down: Math.random() > 0.7,
    shoot: Math.random() > 0.5,
    sprint: Math.random() > 0.6,
    switchWeapon: false
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getMovementTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getWeaponTestAction(gameState);
    case "TEST_4":
      return getSprintTestAction(gameState);
    case "TEST_5":
      return getInnocentTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;