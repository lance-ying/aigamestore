// automated_testing_controller.js
import { gameState } from './globals.js';

// Helper function to find nearest entity
function findNearest(x, y, entities) {
  let nearest = null;
  let minDist = Infinity;
  
  for (let entity of entities) {
    if (entity.dead || entity.opened) continue;
    const dist = Math.hypot(entity.x - x, entity.y - y);
    if (dist < minDist) {
      minDist = dist;
      nearest = entity;
    }
  }
  
  return { entity: nearest, dist: minDist };
}

// TEST_1: Basic movement and collision testing
function getTestBasicAction(gameState) {
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, attack: false, dodge: false };
  
  const action = { up: false, down: false, left: false, right: false, attack: false, dodge: false };
  
  // Simple movement pattern to test all directions
  const time = Math.floor(gameState.frameCount / 60) % 8;
  
  switch(time) {
    case 0:
    case 1:
      action.right = true;
      break;
    case 2:
      action.down = true;
      break;
    case 3:
      action.left = true;
      break;
    case 4:
      action.up = true;
      break;
    case 5:
      action.right = true;
      action.down = true;
      break;
    case 6:
      action.left = true;
      action.down = true;
      break;
    case 7:
      action.attack = true;
      break;
  }
  
  return action;
}

// TEST_2: Win the game
function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, attack: false, dodge: false };
  
  const action = { up: false, down: false, left: false, right: false, attack: false, dodge: false };
  
  // Priority: 1) Evolution chests, 2) Enemies (including boss), 3) Treasure
  const unopenedEvolutionChests = gameState.chests.filter(c => !c.opened && c.chestType !== 'treasure');
  const aliveEnemies = gameState.enemies.filter(e => !e.dead);
  const unopenedTreasures = gameState.chests.filter(c => !c.opened && c.chestType === 'treasure');
  
  let target = null;
  let targetDist = Infinity;
  
  // Prioritize evolution chests
  if (unopenedEvolutionChests.length > 0) {
    const result = findNearest(player.x, player.y, unopenedEvolutionChests);
    target = result.entity;
    targetDist = result.dist;
  } 
  // Then target enemies
  else if (aliveEnemies.length > 0) {
    const result = findNearest(player.x, player.y, aliveEnemies);
    target = result.entity;
    targetDist = result.dist;
  }
  // Finally treasures
  else if (unopenedTreasures.length > 0) {
    const result = findNearest(player.x, player.y, unopenedTreasures);
    target = result.entity;
    targetDist = result.dist;
  }
  
  if (target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const angle = Math.atan2(dy, dx);
    
    // Move toward target
    if (Math.abs(dx) > 5) {
      action.right = dx > 0;
      action.left = dx < 0;
    }
    
    if (Math.abs(dy) > 5) {
      action.down = dy > 0;
      action.up = dy < 0;
    }
    
    // Attack when in range
    if (targetDist < 40) {
      action.attack = true;
    }
    
    // Dodge away from dangerous enemies (boss or when low HP)
    if (target.type === 'boss' || player.hp < 40) {
      const nearbyEnemies = aliveEnemies.filter(e => {
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        return dist < 60;
      });
      
      if (nearbyEnemies.length > 0 && gameState.hasAdvancedCombat && player.dodgeCooldown <= 0) {
        action.dodge = true;
      }
    }
  }
  
  return action;
}

// TEST_3: Combat testing
function getTestCombatAction(gameState) {
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, attack: false, dodge: false };
  
  const action = { up: false, down: false, left: false, right: false, attack: false, dodge: false };
  
  const aliveEnemies = gameState.enemies.filter(e => !e.dead);
  
  if (aliveEnemies.length > 0) {
    const result = findNearest(player.x, player.y, aliveEnemies);
    const target = result.entity;
    const targetDist = result.dist;
    
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      
      // Maintain optimal combat distance
      const optimalDist = 35;
      
      if (targetDist > optimalDist + 10) {
        // Move closer
        if (Math.abs(dx) > 5) {
          action.right = dx > 0;
          action.left = dx < 0;
        }
        if (Math.abs(dy) > 5) {
          action.down = dy > 0;
          action.up = dy < 0;
        }
      } else if (targetDist < optimalDist - 10) {
        // Move away
        if (Math.abs(dx) > 5) {
          action.left = dx > 0;
          action.right = dx < 0;
        }
        if (Math.abs(dy) > 5) {
          action.up = dy > 0;
          action.down = dy < 0;
        }
      } else {
        // Attack at optimal range
        action.attack = true;
      }
      
      // Dodge when in danger
      if (targetDist < 25 && player.hp < 60 && gameState.hasAdvancedCombat && player.dodgeCooldown <= 0) {
        action.dodge = true;
      }
    }
  } else {
    // Find chests if no enemies
    const unopenedChests = gameState.chests.filter(c => !c.opened);
    if (unopenedChests.length > 0) {
      const result = findNearest(player.x, player.y, unopenedChests);
      const target = result.entity;
      
      if (target) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        
        if (Math.abs(dx) > 5) {
          action.right = dx > 0;
          action.left = dx < 0;
        }
        if (Math.abs(dy) > 5) {
          action.down = dy > 0;
          action.up = dy < 0;
        }
        
        if (Math.hypot(dx, dy) < 40) {
          action.attack = true;
        }
      }
    }
  }
  
  return action;
}

// Random action for default testing
function getRandomAction(gameState) {
  return {
    up: Math.random() < 0.1,
    down: Math.random() < 0.1,
    left: Math.random() < 0.1,
    right: Math.random() < 0.1,
    attack: Math.random() < 0.05,
    dodge: Math.random() < 0.02
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
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;