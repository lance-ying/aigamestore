import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    lightAttack: false,
    heavyAttack: false,
    dash: false
  };
  
  // Find nearest enemy or boss
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.dead) {
      const dist = Math.abs(player.x - enemy.x);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
  }
  
  for (const boss of gameState.bosses) {
    if (!boss.dead) {
      const dist = Math.abs(player.x - boss.x);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = boss;
      }
    }
  }
  
  if (nearestEnemy) {
    const distToEnemy = player.x - nearestEnemy.x;
    
    // Combat strategy
    if (Math.abs(distToEnemy) < 30) {
      // In range - attack
      if (nearestEnemy.health > 50 || nearestEnemy.vulnerable) {
        action.heavyAttack = true;
      } else {
        action.lightAttack = true;
      }
      
      // Dash away if enemy is attacking
      if (nearestEnemy.attacking && !player.invincible) {
        action.dash = true;
      }
    } else if (Math.abs(distToEnemy) < 150) {
      // Move closer
      if (distToEnemy > 0) {
        action.left = true;
      } else {
        action.right = true;
      }
      
      // Dash to close distance quickly
      if (Math.abs(distToEnemy) > 80 && player.dashCooldown === 0) {
        action.dash = true;
      }
    } else {
      // Too far - move closer
      if (distToEnemy > 0) {
        action.left = true;
      } else {
        action.right = true;
      }
    }
  } else {
    // No enemies - explore for secrets
    if (player.x < 700) {
      action.right = true;
    }
  }
  
  // Avoid low health danger
  if (player.health < 30 && nearestEnemy && Math.abs(player.x - nearestEnemy.x) < 60) {
    action.dash = true;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    lightAttack: false,
    heavyAttack: false,
    dash: false
  };
  
  // Simple movement and combat test
  const frame = gameState.player.p.frameCount;
  
  if (frame % 120 < 40) {
    action.right = true;
  } else if (frame % 120 < 80) {
    action.left = true;
  }
  
  if (frame % 60 === 0) {
    action.jump = true;
  }
  
  if (frame % 45 === 0) {
    action.lightAttack = true;
  }
  
  if (frame % 90 === 0) {
    action.heavyAttack = true;
  }
  
  if (frame % 70 === 0) {
    action.dash = true;
  }
  
  return action;
}

function getDefianceTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    lightAttack: false,
    heavyAttack: false,
    dash: false
  };
  
  // Always move opposite to narrator's suggestion
  if (gameState.narrator.suggestedDirection === "right") {
    action.left = true;
  } else if (gameState.narrator.suggestedDirection === "left") {
    action.right = true;
  } else {
    // Explore boundaries
    if (player.x < 700) {
      action.right = true;
    }
  }
  
  // Fight when necessary
  for (const enemy of gameState.enemies) {
    if (!enemy.dead && Math.abs(player.x - enemy.x) < 40) {
      action.lightAttack = true;
    }
  }
  
  return action;
}

function getSurvivalTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    lightAttack: false,
    heavyAttack: false,
    dash: false
  };
  
  // Focus on survival - dodge and strategic attacks
  let nearestThreat = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.dead && enemy.attacking) {
      const dist = Math.abs(player.x - enemy.x);
      if (dist < minDist) {
        minDist = dist;
        nearestThreat = enemy;
      }
    }
  }
  
  if (nearestThreat && minDist < 60) {
    // Dodge!
    action.dash = true;
    if (player.x < nearestThreat.x) {
      action.left = true;
    } else {
      action.right = true;
    }
  } else {
    // Fight cautiously
    for (const enemy of gameState.enemies) {
      if (!enemy.dead && Math.abs(player.x - enemy.x) < 35) {
        action.lightAttack = true;
      }
    }
  }
  
  return action;
}

function getBossTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    lightAttack: false,
    heavyAttack: false,
    dash: false
  };
  
  // Focus on boss battles
  for (const boss of gameState.bosses) {
    if (!boss.dead) {
      const dist = Math.abs(player.x - boss.x);
      
      if (boss.vulnerable) {
        // Exploit weakness!
        if (dist < 40) {
          action.heavyAttack = true;
        } else {
          if (player.x < boss.x) {
            action.right = true;
          } else {
            action.left = true;
          }
        }
      } else if (boss.attacking) {
        // Dodge
        action.dash = true;
        if (player.x < boss.x) {
          action.left = true;
        } else {
          action.right = true;
        }
      } else if (dist < 35) {
        action.lightAttack = true;
      } else {
        // Move closer
        if (player.x < boss.x) {
          action.right = true;
        } else {
          action.left = true;
        }
      }
      
      break;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  const actions = ["left", "right", "jump", "lightAttack", "heavyAttack", "dash"];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    left: randomAction === "left",
    right: randomAction === "right",
    jump: randomAction === "jump",
    lightAttack: randomAction === "lightAttack",
    heavyAttack: randomAction === "heavyAttack",
    dash: randomAction === "dash"
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getDefianceTestAction(gameState);
    case "TEST_4":
      return getSurvivalTestAction(gameState);
    case "TEST_5":
      return getBossTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;