// automated_testing_controller.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let testState = {
  moveTimer: 0,
  currentDirection: 0,
  positionHistory: [],
  targetEnemy: null,
  kiteDistance: 120,
  lastPositionCheck: 0
};

function getTestWinAction(gameState) {
  // Strategy: Survive by kiting enemies and collecting XP/items
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, special: false };

  const action = { up: false, down: false, left: false, right: false, special: false };

  // Track position to prevent getting stuck
  if (gameState.playTime - testState.lastPositionCheck > 1) {
    testState.positionHistory.push({ x: player.x, y: player.y });
    if (testState.positionHistory.length > 5) {
      testState.positionHistory.shift();
    }
    testState.lastPositionCheck = gameState.playTime;
  }

  // Find nearest threat
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
    if (dist < minDist) {
      minDist = dist;
      nearestEnemy = enemy;
    }
  }

  // Priority 1: Avoid danger
  if (nearestEnemy && minDist < testState.kiteDistance) {
    const dx = player.x - nearestEnemy.x;
    const dy = player.y - nearestEnemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const moveX = dx / dist;
      const moveY = dy / dist;
      
      action.right = moveX > 0.3;
      action.left = moveX < -0.3;
      action.down = moveY > 0.3;
      action.up = moveY < -0.3;
    }
  } else {
    // Priority 2: Collect nearby XP orbs
    let nearestOrb = null;
    let minOrbDist = 100;
    
    for (let orb of gameState.xpOrbs) {
      const dist = Math.sqrt(Math.pow(orb.x - player.x, 2) + Math.pow(orb.y - player.y, 2));
      if (dist < minOrbDist) {
        minOrbDist = dist;
        nearestOrb = orb;
      }
    }
    
    if (nearestOrb) {
      const dx = nearestOrb.x - player.x;
      const dy = nearestOrb.y - player.y;
      
      action.right = dx > 5;
      action.left = dx < -5;
      action.down = dy > 5;
      action.up = dy < -5;
    } else {
      // Priority 3: Collect items
      let nearestItem = null;
      let minItemDist = 150;
      
      for (let item of gameState.items) {
        const dist = Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2));
        if (dist < minItemDist) {
          minItemDist = dist;
          nearestItem = item;
        }
      }
      
      if (nearestItem) {
        const dx = nearestItem.x - player.x;
        const dy = nearestItem.y - player.y;
        
        action.right = dx > 5;
        action.left = dx < -5;
        action.down = dy > 5;
        action.up = dy < -5;
      } else {
        // Priority 4: Stay near center, avoid edges
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const dx = centerX - player.x;
        const dy = centerY - player.y;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        
        if (distToCenter > 80) {
          action.right = dx > 10;
          action.left = dx < -10;
          action.down = dy > 10;
          action.up = dy < -10;
        }
      }
    }
  }

  // Use special ability when available and enemies are near
  if (player.canUseSpecial && player.canUseSpecial() && nearestEnemy && minDist < 100) {
    action.special = true;
  }

  return action;
}

function getBasicTestAction(gameState) {
  // Test basic movement in all directions
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, special: false };

  const action = { up: false, down: false, left: false, right: false, special: false };
  
  testState.moveTimer++;
  
  if (testState.moveTimer % 120 < 30) {
    action.up = true;
  } else if (testState.moveTimer % 120 < 60) {
    action.right = true;
  } else if (testState.moveTimer % 120 < 90) {
    action.down = true;
  } else {
    action.left = true;
  }

  return action;
}

function getCollectionTestAction(gameState) {
  // Test XP and item collection
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, special: false };

  const action = { up: false, down: false, left: false, right: false, special: false };

  // Find nearest collectible
  let nearest = null;
  let minDist = Infinity;
  
  for (let orb of gameState.xpOrbs) {
    const dist = Math.sqrt(Math.pow(orb.x - player.x, 2) + Math.pow(orb.y - player.y, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = orb;
    }
  }
  
  for (let item of gameState.items) {
    const dist = Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = item;
    }
  }

  if (nearest) {
    const dx = nearest.x - player.x;
    const dy = nearest.y - player.y;
    
    action.right = dx > 5;
    action.left = dx < -5;
    action.down = dy > 5;
    action.up = dy < -5;
  }

  return action;
}

function getAbilityTestAction(gameState) {
  // Test ability selection and usage
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, special: false };

  const action = { up: false, down: false, left: false, right: false, special: false };

  // Move around to collect XP and trigger level ups
  testState.moveTimer++;
  const pattern = Math.floor(testState.moveTimer / 60) % 4;
  
  switch (pattern) {
    case 0: action.up = true; break;
    case 1: action.right = true; break;
    case 2: action.down = true; break;
    case 3: action.left = true; break;
  }

  // Use special ability when available
  if (player.canUseSpecial && player.canUseSpecial()) {
    action.special = true;
  }

  return action;
}

function getBossFightAction(gameState) {
  // Test boss combat
  const player = gameState.player;
  if (!player) return { up: false, down: false, left: false, right: false, special: false };

  const action = { up: false, down: false, left: false, right: false, special: false };

  // Find boss
  let boss = null;
  for (let enemy of gameState.enemies) {
    if (enemy.isBoss) {
      boss = enemy;
      break;
    }
  }

  if (boss) {
    const dist = Math.sqrt(Math.pow(boss.x - player.x, 2) + Math.pow(boss.y - player.y, 2));
    
    // Kite the boss
    if (dist < 100) {
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      
      if (d > 0) {
        action.right = (dx / d) > 0.3;
        action.left = (dx / d) < -0.3;
        action.down = (dy / d) > 0.3;
        action.up = (dy / d) < -0.3;
      }
    }

    // Use special on boss
    if (player.canUseSpecial && player.canUseSpecial() && dist < 120) {
      action.special = true;
    }
  } else {
    // No boss, survive and collect
    return getTestWinAction(gameState);
  }

  return action;
}

function getRandomAction(gameState) {
  return {
    up: Math.random() < 0.2,
    down: Math.random() < 0.2,
    left: Math.random() < 0.2,
    right: Math.random() < 0.2,
    special: Math.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAbilityTestAction(gameState);
    case "TEST_4":
      return getCollectionTestAction(gameState);
    case "TEST_5":
      return getBossFightAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;