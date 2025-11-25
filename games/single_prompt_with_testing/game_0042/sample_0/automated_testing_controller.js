// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';

let positionHistory = [];
let stuckCounter = 0;
let lastAction = null;

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    special: false,
    aimUp: false,
    aimDown: false
  };
  
  // Track position to detect getting stuck
  positionHistory.push({ x: player.x, y: player.y });
  if (positionHistory.length > 30) {
    positionHistory.shift();
  }
  
  if (positionHistory.length > 20) {
    const recentMovement = Math.abs(player.x - positionHistory[0].x);
    if (recentMovement < 10) {
      stuckCounter++;
    } else {
      stuckCounter = 0;
    }
  }
  
  // Find helicopter
  const helicopter = gameState.helicopter;
  if (helicopter) {
    const dx = helicopter.x - player.x;
    const dy = helicopter.y - player.y;
    const distToHelicopter = Math.sqrt(dx * dx + dy * dy);
    
    // If very close to helicopter, move towards it
    if (distToHelicopter < 200) {
      if (dx > 10) {
        action.right = true;
      } else if (dx < -10) {
        action.left = true;
      }
      
      if (player.onGround && Math.abs(dx) < 100) {
        action.jump = true;
      }
      
      return action;
    }
  }
  
  // Find nearest prisoner
  let nearestPrisoner = null;
  let nearestPrisonerDist = Infinity;
  
  for (let prisoner of gameState.prisoners) {
    if (prisoner.rescued) continue;
    
    const dx = prisoner.x - player.x;
    const dy = prisoner.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestPrisonerDist) {
      nearestPrisonerDist = dist;
      nearestPrisoner = prisoner;
    }
  }
  
  // Target prisoner or move right
  let targetX = nearestPrisoner ? nearestPrisoner.x : player.x + 500;
  let targetY = nearestPrisoner ? nearestPrisoner.y : player.y;
  
  // If prisoner has cage, destroy it first
  if (nearestPrisoner && !nearestPrisoner.cageDestroyed && nearestPrisonerDist < 150) {
    const dx = nearestPrisoner.x - player.x;
    const dy = nearestPrisoner.y - player.y;
    
    if (Math.abs(dx) < 100) {
      action.shoot = true;
      if (dy < -20) {
        action.aimUp = true;
      } else if (dy > 20) {
        action.aimDown = true;
      }
    }
  }
  
  // Find and shoot nearest enemy
  let nearestEnemy = null;
  let nearestEnemyDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (!enemy.active) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestEnemyDist && dist < 200) {
      nearestEnemyDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    
    action.shoot = true;
    
    // Aim at enemy
    if (dy < -20) {
      action.aimUp = true;
    } else if (dy > 20) {
      action.aimDown = true;
    }
    
    // Use special if enemy is close
    if (nearestEnemyDist < 100 && player.specialCooldown === 0) {
      action.special = true;
    }
  }
  
  // Movement towards target
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  if (dx > 20) {
    action.right = true;
  } else if (dx < -20) {
    action.left = true;
  }
  
  // Jump over obstacles
  if (player.onGround) {
    // Check for terrain in front
    let obstacleAhead = false;
    const checkDistance = 40;
    
    for (let terrain of gameState.terrain) {
      if (terrain.solid) {
        const terrainDx = terrain.x - player.x;
        if (Math.abs(terrainDx) < checkDistance && terrain.y < player.y) {
          obstacleAhead = true;
          break;
        }
      }
    }
    
    if (obstacleAhead || stuckCounter > 15) {
      action.jump = true;
      stuckCounter = 0;
    }
    
    // Jump if target is above
    if (dy < -30) {
      action.jump = true;
    }
  }
  
  // Shoot destructible terrain in the way
  for (let terrain of gameState.terrain) {
    if (terrain.destructible) {
      const tdx = terrain.x - player.x;
      const tdy = terrain.y - player.y;
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);
      
      if (dist < 100 && Math.abs(tdx) < 60 && tdx * dx > 0) {
        action.shoot = true;
        if (terrain.isBarrel) {
          action.special = true;
        }
      }
    }
  }
  
  lastAction = action;
  return action;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: true,
    jump: false,
    shoot: true,
    special: false,
    aimUp: false,
    aimDown: false
  };
  
  // Jump occasionally
  if (gameState.player.onGround && Math.random() < 0.1) {
    action.jump = true;
  }
  
  // Use special occasionally
  if (Math.random() < 0.05) {
    action.special = true;
  }
  
  return action;
}

function getTerrainTestAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: true,
    jump: false,
    shoot: true,
    special: false,
    aimUp: false,
    aimDown: false
  };
  
  // Focus on shooting terrain
  let nearestTerrain = null;
  let nearestDist = Infinity;
  
  for (let terrain of gameState.terrain) {
    if (!terrain.destructible) continue;
    
    const dx = terrain.x - gameState.player.x;
    const dy = terrain.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist && dist < 150) {
      nearestDist = dist;
      nearestTerrain = terrain;
    }
  }
  
  if (nearestTerrain) {
    const dy = nearestTerrain.y - gameState.player.y;
    if (dy < -20) {
      action.aimUp = true;
    } else if (dy > 20) {
      action.aimDown = true;
    }
    
    action.special = true;
  }
  
  return action;
}

function getCombatTestAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: true,
    special: false,
    aimUp: false,
    aimDown: false
  };
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (!enemy.active) continue;
    
    const dx = enemy.x - gameState.player.x;
    const dy = enemy.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - gameState.player.x;
    const dy = nearestEnemy.y - gameState.player.y;
    
    // Move towards enemy
    if (dx > 50) {
      action.right = true;
    } else if (dx < -50) {
      action.left = true;
    }
    
    // Aim at enemy
    if (dy < -20) {
      action.aimUp = true;
    } else if (dy > 20) {
      action.aimDown = true;
    }
    
    // Use special if close
    if (nearestDist < 100) {
      action.special = true;
    }
  } else {
    action.right = true;
  }
  
  return action;
}

function getPrisonerTestAction(gameState) {
  if (!gameState.player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    shoot: true,
    special: false,
    aimUp: false,
    aimDown: false
  };
  
  // Find nearest prisoner
  let nearestPrisoner = null;
  let nearestDist = Infinity;
  
  for (let prisoner of gameState.prisoners) {
    if (prisoner.rescued) continue;
    
    const dx = prisoner.x - gameState.player.x;
    const dy = prisoner.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestPrisoner = prisoner;
    }
  }
  
  if (nearestPrisoner) {
    const dx = nearestPrisoner.x - gameState.player.x;
    const dy = nearestPrisoner.y - gameState.player.y;
    
    // Move towards prisoner
    if (dx > 20) {
      action.right = true;
    } else if (dx < -20) {
      action.left = true;
    }
    
    // Shoot cage if not destroyed
    if (!nearestPrisoner.cageDestroyed && nearestDist < 100) {
      action.shoot = true;
    }
    
    // Jump if needed
    if (gameState.player.onGround && dy < -30) {
      action.jump = true;
    }
  } else {
    action.right = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'jump', 'shoot', 'special'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    left: randomAction === 'left',
    right: randomAction === 'right',
    jump: randomAction === 'jump',
    shoot: randomAction === 'shoot',
    special: randomAction === 'special',
    aimUp: false,
    aimDown: false
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTerrainTestAction(gameState);
    case "TEST_4":
      return getCombatTestAction(gameState);
    case "TEST_5":
      return getPrisonerTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;