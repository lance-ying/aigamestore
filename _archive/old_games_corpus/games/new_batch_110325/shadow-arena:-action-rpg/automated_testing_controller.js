// automated_testing_controller.js - Automated testing functions
import { gameState } from './globals.js';

let testState = {
  lastPlayerX: 0,
  lastPlayerY: 0,
  stuckCounter: 0,
  lastAction: null,
  actionTimer: 0,
  targetEnemy: null
};

function getTestBasicAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    skill1: false,
    skill2: false
  };
  
  // Random movement
  const randMove = Math.random();
  if (randMove < 0.3) {
    action.left = true;
  } else if (randMove < 0.6) {
    action.right = true;
  }
  
  // Random jump
  if (Math.random() < 0.05 && player.isGrounded) {
    action.jump = true;
  }
  
  // Spam attacks
  if (Math.random() < 0.5) {
    action.attack = true;
  }
  
  // Use skills randomly
  if (Math.random() < 0.1 && player.mana >= 15) {
    action.skill1 = true;
  }
  
  return action;
}

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    skill1: false,
    skill2: false
  };
  
  // Check if stuck
  const moved = Math.abs(player.x - testState.lastPlayerX) > 1 || 
                Math.abs(player.y - testState.lastPlayerY) > 1;
  
  if (!moved) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  
  testState.lastPlayerX = player.x;
  testState.lastPlayerY = player.y;
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  gameState.enemies.forEach(enemy => {
    if (!enemy.isDead) {
      const dist = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) + 
        Math.pow(enemy.y - player.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
  });
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // If health is low, try to maintain distance
    if (player.health < player.maxHealth * 0.3 && dist < 100) {
      // Move away
      if (dx > 0) {
        action.left = true;
      } else {
        action.right = true;
      }
    } else {
      // Optimal distance: 40-70 pixels
      if (dist > 70) {
        // Move closer
        if (dx > 0) {
          action.right = true;
        } else {
          action.left = true;
        }
        
        // Jump over obstacles
        if (testState.stuckCounter > 10 && player.isGrounded) {
          action.jump = true;
          testState.stuckCounter = 0;
        }
      } else if (dist < 40) {
        // Too close, back up
        if (dx > 0) {
          action.left = true;
        } else {
          action.right = true;
        }
      }
    }
    
    // Attack when in range
    if (dist < 60 && Math.abs(dy) < 30) {
      action.attack = true;
      
      // Use skills strategically
      const now = Date.now();
      
      // Power Strike for single targets
      if (player.mana >= 15 && dist < 70) {
        const skill1Ready = (now - player.skills[0].lastUsed) >= player.skills[0].cooldown;
        if (skill1Ready) {
          action.skill1 = true;
        }
      }
      
      // Whirlwind when surrounded or fighting bosses
      const nearbyEnemies = gameState.enemies.filter(e => {
        if (e.isDead) return false;
        const d = Math.sqrt(
          Math.pow(e.x - player.x, 2) + 
          Math.pow(e.y - player.y, 2)
        );
        return d < 100;
      });
      
      if (player.mana >= 25 && (nearbyEnemies.length > 2 || nearestEnemy.type === "boss" || nearestEnemy.type === "miniboss")) {
        const skill2Ready = (now - player.skills[1].lastUsed) >= player.skills[1].cooldown;
        if (skill2Ready) {
          action.skill2 = true;
        }
      }
    }
  } else {
    // No enemies, move toward center
    if (player.x < 250) {
      action.right = true;
    } else if (player.x > 350) {
      action.left = true;
    }
  }
  
  return action;
}

function getTestSkillsAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: true, // Always attack to build mana
    skill1: false,
    skill2: false
  };
  
  // Use skills as soon as available
  const now = Date.now();
  
  if (player.mana >= 15) {
    const skill1Ready = (now - player.skills[0].lastUsed) >= player.skills[0].cooldown;
    if (skill1Ready) {
      action.skill1 = true;
    }
  }
  
  if (player.mana >= 25) {
    const skill2Ready = (now - player.skills[1].lastUsed) >= player.skills[1].cooldown;
    if (skill2Ready) {
      action.skill2 = true;
    }
  }
  
  // Move toward enemies
  if (gameState.enemies.length > 0) {
    const enemy = gameState.enemies[0];
    if (enemy.x > player.x) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  return action;
}

function getTestLevelingAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: true,
    skill1: true,
    skill2: true
  };
  
  // Aggressively attack enemies to gain exp
  const nearestEnemy = gameState.enemies.find(e => !e.isDead);
  if (nearestEnemy) {
    if (nearestEnemy.x > player.x) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  return action;
}

function getTestEnemyAIAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    skill1: false,
    skill2: false
  };
  
  // Move around and let enemies attack
  if (Math.random() < 0.4) {
    action.left = true;
  } else if (Math.random() < 0.8) {
    action.right = true;
  }
  
  // Occasional attack
  if (Math.random() < 0.2) {
    action.attack = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'jump', 'attack', 'skill1', 'skill2'];
  const action = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    skill1: false,
    skill2: false
  };
  
  // Random actions
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  action[randomAction] = true;
  
  return action;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestSkillsAction(gameState);
    case "TEST_4":
      return getTestLevelingAction(gameState);
    case "TEST_5":
      return getTestEnemyAIAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;