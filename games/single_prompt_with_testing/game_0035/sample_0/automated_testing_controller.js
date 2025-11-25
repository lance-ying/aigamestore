// automated_testing_controller.js - Automated testing controller

import { KEY_CODES, GAME_PHASES } from './globals.js';
import { distance } from './utils.js';

function getTestBasicAction(gameState) {
  if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECT) {
    // Random selection in upgrades
    return { key: 'Space', keyCode: KEY_CODES.SPACE };
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return null;
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  
  // Random actions for basic testing
  const actions = [];
  
  if (Math.random() < 0.3) actions.push({ key: 'ArrowLeft', keyCode: KEY_CODES.LEFT });
  if (Math.random() < 0.3) actions.push({ key: 'ArrowRight', keyCode: KEY_CODES.RIGHT });
  if (Math.random() < 0.3) actions.push({ key: 'ArrowUp', keyCode: KEY_CODES.UP });
  if (Math.random() < 0.3) actions.push({ key: 'ArrowDown', keyCode: KEY_CODES.DOWN });
  if (Math.random() < 0.2) actions.push({ key: ' ', keyCode: KEY_CODES.SPACE });
  if (Math.random() < 0.1) actions.push({ key: 'Shift', keyCode: KEY_CODES.SHIFT });
  if (Math.random() < 0.1) actions.push({ key: 'z', keyCode: KEY_CODES.Z });
  
  return actions.length > 0 ? actions[0] : null;
}

function getTestWinAction(gameState) {
  if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECT) {
    // Select upgrades intelligently - prioritize damage and fire rate
    const options = gameState.upgradeOptions;
    let bestIndex = 0;
    let bestScore = 0;
    
    for (let i = 0; i < options.length; i++) {
      let score = 0;
      if (options[i].type === 'damage') score = 10;
      else if (options[i].type === 'fireRate') score = 9;
      else if (options[i].type === 'projectileSpeed') score = 7;
      else if (options[i].type === 'health') score = 6;
      else if (options[i].type === 'moveSpeed') score = 5;
      else score = 3;
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    
    // Move to best upgrade
    if (gameState.selectedUpgrade < bestIndex) {
      return { key: 'ArrowDown', keyCode: KEY_CODES.DOWN };
    } else if (gameState.selectedUpgrade > bestIndex) {
      return { key: 'ArrowUp', keyCode: KEY_CODES.UP };
    } else {
      return { key: ' ', keyCode: KEY_CODES.SPACE };
    }
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player || !gameState.enemy) {
    return null;
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  const dist = distance(player.x, player.y, enemy.x, enemy.y);
  
  // Aggressive strategy to win
  const actions = [];
  
  // Always try to face the enemy and maintain optimal distance
  const optimalDist = 200;
  
  if (Math.abs(enemy.x - player.x) > 10) {
    if (enemy.x > player.x) {
      actions.push({ key: 'ArrowRight', keyCode: KEY_CODES.RIGHT });
    } else {
      actions.push({ key: 'ArrowLeft', keyCode: KEY_CODES.LEFT });
    }
  }
  
  // Maintain some vertical distance variation
  if (Math.abs(enemy.y - player.y) > 60) {
    if (enemy.y > player.y) {
      actions.push({ key: 'ArrowDown', keyCode: KEY_CODES.DOWN });
    } else {
      actions.push({ key: 'ArrowUp', keyCode: KEY_CODES.UP });
    }
  } else if (Math.random() < 0.1) {
    // Random strafing
    actions.push(Math.random() < 0.5 ? 
      { key: 'ArrowUp', keyCode: KEY_CODES.UP } : 
      { key: 'ArrowDown', keyCode: KEY_CODES.DOWN });
  }
  
  // Shoot when facing enemy
  const facingEnemy = player.facingRight ? (enemy.x > player.x) : (enemy.x < player.x);
  if (facingEnemy && dist < 350) {
    actions.push({ key: ' ', keyCode: KEY_CODES.SPACE });
  }
  
  // Use shield if health is low or enemy is close
  if (player.health < player.maxHealth * 0.4 && player.shieldCooldownTimer <= 0) {
    actions.push({ key: 'Shift', keyCode: KEY_CODES.SHIFT });
  }
  
  // Check for incoming projectiles
  let incomingThreat = false;
  for (const proj of gameState.projectiles) {
    if (proj.owner === 'enemy') {
      const projDist = distance(player.x, player.y, proj.x, proj.y);
      if (projDist < 100) {
        incomingThreat = true;
        break;
      }
    }
  }
  
  if (incomingThreat && player.shieldCooldownTimer <= 0) {
    actions.push({ key: 'Shift', keyCode: KEY_CODES.SHIFT });
  }
  
  // Dash for repositioning or dodging
  if (dist < 80 && player.dashCooldownTimer <= 0) {
    actions.push({ key: 'z', keyCode: KEY_CODES.Z });
  }
  
  return actions.length > 0 ? actions[0] : null;
}

function getTestDefensiveAction(gameState) {
  if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECT) {
    // Select defensive upgrades
    const options = gameState.upgradeOptions;
    let bestIndex = 0;
    let bestScore = 0;
    
    for (let i = 0; i < options.length; i++) {
      let score = 0;
      if (options[i].type === 'health') score = 10;
      else if (options[i].type === 'shieldDuration') score = 9;
      else if (options[i].type === 'moveSpeed') score = 8;
      else if (options[i].type === 'dashCooldown') score = 7;
      else score = 3;
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    
    // Move to best upgrade
    if (gameState.selectedUpgrade < bestIndex) {
      return { key: 'ArrowDown', keyCode: KEY_CODES.DOWN };
    } else if (gameState.selectedUpgrade > bestIndex) {
      return { key: 'ArrowUp', keyCode: KEY_CODES.UP };
    } else {
      return { key: ' ', keyCode: KEY_CODES.SPACE };
    }
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player || !gameState.enemy) {
    return null;
  }
  
  const player = gameState.player;
  const enemy = gameState.enemy;
  const dist = distance(player.x, player.y, enemy.x, enemy.y);
  
  const actions = [];
  
  // Keep distance from enemy
  if (dist < 180) {
    if (enemy.x > player.x) {
      actions.push({ key: 'ArrowLeft', keyCode: KEY_CODES.LEFT });
    } else {
      actions.push({ key: 'ArrowRight', keyCode: KEY_CODES.RIGHT });
    }
  }
  
  // Strafe vertically
  if (Math.random() < 0.3) {
    actions.push(Math.random() < 0.5 ? 
      { key: 'ArrowUp', keyCode: KEY_CODES.UP } : 
      { key: 'ArrowDown', keyCode: KEY_CODES.DOWN });
  }
  
  // Shield frequently
  if (player.shieldCooldownTimer <= 0 && Math.random() < 0.4) {
    actions.push({ key: 'Shift', keyCode: KEY_CODES.SHIFT });
  }
  
  // Dash away when close
  if (dist < 120 && player.dashCooldownTimer <= 0) {
    actions.push({ key: 'z', keyCode: KEY_CODES.Z });
  }
  
  // Still shoot occasionally
  if (Math.random() < 0.3) {
    actions.push({ key: ' ', keyCode: KEY_CODES.SPACE });
  }
  
  return actions.length > 0 ? actions[0] : null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getTestBasicAction(gameState);
    case 'TEST_2':
      return getTestWinAction(gameState);
    case 'TEST_3':
      return getTestDefensiveAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;