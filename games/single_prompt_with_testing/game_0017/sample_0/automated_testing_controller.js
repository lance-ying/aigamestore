// automated_testing_controller.js - Automated testing

import { gameState, SPELL_TYPES } from './globals.js';
import { Enemy } from './entities.js';

function getTestWinAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, space: false, z: false };
  }
  
  const player = gameState.player;
  const action = { left: false, right: false, space: false, z: false, shift: false };
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const entity of gameState.entities) {
    if (entity instanceof Enemy && entity.alive) {
      const dist = Math.abs(entity.x - player.x) + Math.abs(entity.y - player.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = entity;
      }
    }
  }
  
  // Strategy: Move toward enemies and shoot them, collect pickups
  if (nearestEnemy && minDist < 200) {
    // Combat mode
    const dx = nearestEnemy.x - player.x;
    
    if (Math.abs(dx) > 30) {
      if (dx > 0) {
        action.right = true;
      } else {
        action.left = true;
      }
    }
    
    // Shoot if in range
    if (Math.abs(dx) < 150 && player.castCooldown === 0) {
      action.space = true;
    }
  } else {
    // Exploration mode - move right and down
    const shouldMoveRight = player.x < 550 && Math.floor(gameState.framesSinceStart / 120) % 2 === 0;
    const shouldMoveLeft = player.x > 50 && Math.floor(gameState.framesSinceStart / 120) % 2 === 1;
    
    if (shouldMoveRight) {
      action.right = true;
    } else if (shouldMoveLeft) {
      action.left = true;
    }
  }
  
  // Collect pickups
  for (const pickup of gameState.pickups) {
    if (pickup.alive) {
      const dx = pickup.x - player.x;
      if (Math.abs(dx) < 100) {
        if (dx > 0) {
          action.right = true;
          action.left = false;
        } else {
          action.left = true;
          action.right = false;
        }
      }
    }
  }
  
  // Switch to best spell
  if (gameState.spellsCollected.length > 1 && gameState.framesSinceStart % 180 === 0) {
    action.z = true;
  }
  
  return action;
}

function getTestMovementAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, space: false };
  }
  
  const action = { left: false, right: false, space: false };
  const phase = Math.floor(gameState.framesSinceStart / 60) % 4;
  
  if (phase === 0) {
    action.right = true;
  } else if (phase === 1) {
    action.left = true;
  } else if (phase === 2) {
    action.space = true;
  }
  
  return action;
}

function getTestSpellAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, space: false, z: false };
  }
  
  const action = { left: false, right: false, space: false, z: false };
  
  // Move around and cast spells
  const phase = Math.floor(gameState.framesSinceStart / 90) % 5;
  
  if (phase === 0) {
    action.right = true;
  } else if (phase === 1) {
    action.left = true;
  } else if (phase === 2) {
    action.space = true;
  } else if (phase === 3) {
    action.z = true;
  } else if (phase === 4) {
    action.space = true;
  }
  
  return action;
}

function getTestCombatAction(gameState) {
  if (!gameState.player) {
    return { left: false, right: false, space: false };
  }
  
  const player = gameState.player;
  const action = { left: false, right: false, space: false };
  
  // Find and attack enemies
  for (const entity of gameState.entities) {
    if (entity instanceof Enemy && entity.alive) {
      const dx = entity.x - player.x;
      
      if (Math.abs(dx) > 40) {
        if (dx > 0) {
          action.right = true;
        } else {
          action.left = true;
        }
      }
      
      if (Math.abs(dx) < 100) {
        action.space = true;
      }
      
      break;
    }
  }
  
  return action;
}

function getTestLoseAction(gameState) {
  // Intentionally take damage
  if (!gameState.player) {
    return { left: false, right: false };
  }
  
  const action = { left: false, right: false };
  
  // Move toward enemies to take damage
  for (const entity of gameState.entities) {
    if (entity instanceof Enemy && entity.alive) {
      const dx = entity.x - gameState.player.x;
      if (dx > 0) {
        action.right = true;
      } else {
        action.left = true;
      }
      break;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    space: Math.random() < 0.1,
    z: Math.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestSpellAction(gameState);
    case "TEST_4":
      return getTestCombatAction(gameState);
    case "TEST_5":
      return getTestLoseAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;