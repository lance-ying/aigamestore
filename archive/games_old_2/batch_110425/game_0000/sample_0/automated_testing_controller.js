// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

function getTestBasicAction(gameState) {
  if (!gameState.player) return null;
  
  let action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shield: false
  };
  
  // Basic movement test - move right and jump occasionally
  action.right = true;
  
  // Jump every 60 frames if on ground
  if (gameState.player.onGround && gameState.player.p.frameCount % 60 === 0) {
    action.jump = true;
  }
  
  // Attack if near an enemy
  for (let enemy of gameState.enemies) {
    if (enemy.active) {
      let dist = Math.abs(enemy.x - gameState.player.x);
      if (dist < 100) {
        action.attack = true;
        break;
      }
    }
  }
  
  return action;
}

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.exitPortal) return null;
  
  let action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shield: false
  };
  
  let player = gameState.player;
  let targetX = gameState.exitPortal.x;
  
  // Check for enemies ahead
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.active) {
      let dist = enemy.x - player.x;
      if (dist > -50 && dist < 150 && Math.abs(dist) < minDist) {
        nearestEnemy = enemy;
        minDist = Math.abs(dist);
      }
    }
  }
  
  // If enemy is close, attack
  if (nearestEnemy && minDist < 60) {
    action.attack = true;
    
    // Move toward enemy
    if (nearestEnemy.x > player.x) {
      action.right = true;
    } else {
      action.left = true;
    }
  } else {
    // Move toward portal
    if (player.x < targetX - 50) {
      action.right = true;
    } else if (player.x > targetX + 50) {
      action.left = true;
    }
  }
  
  // Check for items
  for (let item of gameState.items) {
    let dist = Math.abs(item.x - player.x);
    if (dist < 100) {
      if (item.x > player.x) {
        action.right = true;
        action.left = false;
      } else {
        action.left = true;
        action.right = false;
      }
      break;
    }
  }
  
  // Jump logic
  let needsJump = false;
  
  // Jump if no platform ahead
  let onPlatform = false;
  for (let platform of gameState.platforms) {
    if (player.y + player.h >= platform.y - 5 && 
        player.y + player.h <= platform.y + 20 &&
        player.x + player.w > platform.x && 
        player.x < platform.x + platform.w) {
      onPlatform = true;
      
      // Check if we're near edge
      if (action.right && player.x + player.w > platform.x + platform.w - 10) {
        needsJump = true;
      } else if (action.left && player.x < platform.x + 10) {
        needsJump = true;
      }
    }
  }
  
  // Jump to reach higher platforms
  for (let platform of gameState.platforms) {
    if (action.right && platform.x > player.x && platform.x < player.x + 100) {
      if (platform.y < player.y) {
        needsJump = true;
      }
    }
  }
  
  if (needsJump && player.onGround) {
    action.jump = true;
  }
  
  // Use shield if health is low
  if (player.health <= 1 && player.hasShield) {
    action.shield = true;
  }
  
  return action;
}

function getTestCombatAction(gameState) {
  if (!gameState.player) return null;
  
  let action = {
    left: false,
    right: false,
    jump: false,
    attack: true,
    shield: false
  };
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.active) {
      let dist = Math.abs(enemy.x - gameState.player.x);
      if (dist < minDist) {
        nearestEnemy = enemy;
        minDist = dist;
      }
    }
  }
  
  if (nearestEnemy) {
    // Move toward enemy
    if (nearestEnemy.x > gameState.player.x + 40) {
      action.right = true;
    } else if (nearestEnemy.x < gameState.player.x - 40) {
      action.left = true;
    }
  } else {
    action.right = true;
  }
  
  return action;
}

function getTestHealthAction(gameState) {
  if (!gameState.player) return null;
  
  let action = {
    left: false,
    right: true,
    jump: false,
    attack: false,
    shield: false
  };
  
  // Move toward enemies to take damage
  for (let enemy of gameState.enemies) {
    if (enemy.active) {
      if (enemy.x > gameState.player.x) {
        action.right = true;
      } else {
        action.left = true;
      }
      break;
    }
  }
  
  return action;
}

function getTestPhysicsAction(gameState) {
  if (!gameState.player) return null;
  
  let action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shield: false
  };
  
  // Jump repeatedly to test physics
  if (gameState.player.onGround) {
    action.jump = true;
  }
  
  // Alternate direction
  if (Math.floor(gameState.player.p.frameCount / 120) % 2 === 0) {
    action.right = true;
  } else {
    action.left = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  if (!gameState.player) return null;
  
  let p = gameState.player.p;
  
  return {
    left: p.random() < 0.3,
    right: p.random() < 0.3,
    jump: p.random() < 0.1,
    attack: p.random() < 0.2,
    shield: p.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    case "TEST_4":
      return getTestHealthAction(gameState);
    case "TEST_5":
      return getTestPhysicsAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;