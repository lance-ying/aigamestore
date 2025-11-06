// automated_testing_controller.js - Automated testing functions

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE } from './globals.js';

let testState = {
  phase: 0,
  timer: 0,
  positionHistory: [],
  targetEnemy: null,
  lastAction: null
};

function getTestMovementAction(gameState) {
  // TEST_1: Basic movement testing
  testState.timer++;
  
  const action = {
    move: { left: false, right: false, up: false, down: false },
    aim: null,
    fire: false,
    grenade: false,
    mine: false
  };
  
  // Cycle through directions every 60 frames
  const cycle = Math.floor(testState.timer / 60) % 4;
  
  switch (cycle) {
    case 0:
      action.move.right = true;
      action.aim = 0;
      break;
    case 1:
      action.move.down = true;
      action.aim = Math.PI / 2;
      break;
    case 2:
      action.move.left = true;
      action.aim = Math.PI;
      break;
    case 3:
      action.move.up = true;
      action.aim = -Math.PI / 2;
      break;
  }
  
  return action;
}

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win the game
  if (!gameState.player) return getRandomAction(gameState);
  
  const action = {
    move: { left: false, right: false, up: false, down: false },
    aim: null,
    fire: false,
    grenade: false,
    mine: false
  };
  
  // Find nearest enemy
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.health > 0) {
      const dist = Math.sqrt(
        (enemy.x - gameState.player.x) ** 2 + 
        (enemy.y - gameState.player.y) ** 2
      );
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
  }
  
  if (!nearestEnemy) return action;
  
  testState.targetEnemy = nearestEnemy;
  
  // Calculate angle to enemy
  const dx = nearestEnemy.x - gameState.player.x;
  const dy = nearestEnemy.y - gameState.player.y;
  const angleToEnemy = Math.atan2(dy, dx);
  
  action.aim = angleToEnemy;
  
  // Decide on tactics based on distance
  if (minDist > 200) {
    // Move closer
    if (Math.abs(dx) > 10) {
      action.move.right = dx > 0;
      action.move.left = dx < 0;
    }
    if (Math.abs(dy) > 10) {
      action.move.down = dy > 0;
      action.move.up = dy < 0;
    }
  } else if (minDist > 100) {
    // Try to flank and shoot
    const flankAngle = angleToEnemy + Math.PI / 2;
    action.move.right = Math.cos(flankAngle) > 0.3;
    action.move.left = Math.cos(flankAngle) < -0.3;
    action.move.down = Math.sin(flankAngle) > 0.3;
    action.move.up = Math.sin(flankAngle) < -0.3;
    
    action.fire = true;
  } else if (minDist > 60) {
    // Optimal range - shoot and use cover
    action.fire = true;
    
    // Stay in cover if available
    if (!gameState.player.inCover) {
      // Look for nearest cover
      let nearestCover = null;
      let minCoverDist = Infinity;
      for (let cover of gameState.cover) {
        const coverDist = Math.sqrt(
          (cover.x - gameState.player.x) ** 2 + 
          (cover.y - gameState.player.y) ** 2
        );
        if (coverDist < minCoverDist) {
          minCoverDist = coverDist;
          nearestCover = cover;
        }
      }
      
      if (nearestCover && minCoverDist < 100) {
        const cdx = nearestCover.x - gameState.player.x;
        const cdy = nearestCover.y - gameState.player.y;
        action.move.right = cdx > 10;
        action.move.left = cdx < -10;
        action.move.down = cdy > 10;
        action.move.up = cdy < -10;
      }
    }
  } else {
    // Too close - back away and shoot
    action.move.right = dx < 0;
    action.move.left = dx > 0;
    action.move.down = dy < 0;
    action.move.up = dy > 0;
    action.fire = true;
  }
  
  // Use grenade if multiple enemies are close
  if (gameState.playerGrenades > 0) {
    let enemiesNearby = 0;
    for (let enemy of gameState.enemies) {
      if (enemy.health > 0) {
        const dist = Math.sqrt(
          (enemy.x - gameState.player.x) ** 2 + 
          (enemy.y - gameState.player.y) ** 2
        );
        if (dist < 150) enemiesNearby++;
      }
    }
    
    if (enemiesNearby >= 3 && testState.timer % 120 === 0) {
      action.grenade = true;
    }
  }
  
  // Use stealth when at full health and enemies are far
  if (gameState.playerHealth > 80 && minDist > 150) {
    if (!gameState.player.stealthMode) {
      // Would toggle stealth but we can't use SHIFT in automated mode
      // Just approach carefully
      action.move = { left: false, right: false, up: false, down: false };
      if (Math.abs(dx) > 10) {
        action.move.right = dx > 0;
        action.move.left = dx < 0;
      }
    }
  }
  
  testState.lastAction = action;
  return action;
}

function getTestStealthAction(gameState) {
  // TEST_3: Test stealth mechanics
  if (!gameState.player) return getRandomAction(gameState);
  
  const action = {
    move: { left: false, right: false, up: false, down: false },
    aim: null,
    fire: false,
    grenade: false,
    mine: false
  };
  
  // Try to navigate past enemies using stealth
  let nearestEnemy = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.health > 0) {
      const dist = Math.sqrt(
        (enemy.x - gameState.player.x) ** 2 + 
        (enemy.y - gameState.player.y) ** 2
      );
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
  }
  
  if (nearestEnemy) {
    // Move around enemy at safe distance
    const dx = nearestEnemy.x - gameState.player.x;
    const dy = nearestEnemy.y - gameState.player.y;
    const angleToEnemy = Math.atan2(dy, dx);
    
    // Move perpendicular to enemy
    const moveAngle = angleToEnemy + Math.PI / 2;
    
    action.move.right = Math.cos(moveAngle) > 0.5;
    action.move.left = Math.cos(moveAngle) < -0.5;
    action.move.down = Math.sin(moveAngle) > 0.5;
    action.move.up = Math.sin(moveAngle) < -0.5;
    
    action.aim = angleToEnemy;
  }
  
  return action;
}

function getTestCoverAction(gameState) {
  // TEST_4: Test cover mechanics
  if (!gameState.player) return getRandomAction(gameState);
  
  const action = {
    move: { left: false, right: false, up: false, down: false },
    aim: null,
    fire: false,
    grenade: false,
    mine: false
  };
  
  // Find nearest cover
  let nearestCover = null;
  let minDist = Infinity;
  
  for (let cover of gameState.cover) {
    const dist = Math.sqrt(
      (cover.x - gameState.player.x) ** 2 + 
      (cover.y - gameState.player.y) ** 2
    );
    if (dist < minDist) {
      minDist = dist;
      nearestCover = cover;
    }
  }
  
  if (nearestCover && !gameState.player.inCover) {
    // Move to cover
    const dx = nearestCover.x - gameState.player.x;
    const dy = nearestCover.y - gameState.player.y;
    
    action.move.right = dx > 10;
    action.move.left = dx < -10;
    action.move.down = dy > 10;
    action.move.up = dy < -10;
  } else {
    // In cover, shoot at enemies
    let nearestEnemy = null;
    minDist = Infinity;
    
    for (let enemy of gameState.enemies) {
      if (enemy.health > 0) {
        const dist = Math.sqrt(
          (enemy.x - gameState.player.x) ** 2 + 
          (enemy.y - gameState.player.y) ** 2
        );
        if (dist < minDist) {
          minDist = dist;
          nearestEnemy = enemy;
        }
      }
    }
    
    if (nearestEnemy) {
      const dx = nearestEnemy.x - gameState.player.x;
      const dy = nearestEnemy.y - gameState.player.y;
      action.aim = Math.atan2(dy, dx);
      action.fire = true;
    }
  }
  
  return action;
}

function getTestUtilityAction(gameState) {
  // TEST_5: Test utility items
  if (!gameState.player) return getRandomAction(gameState);
  
  const action = {
    move: { left: false, right: false, up: false, down: false },
    aim: null,
    fire: false,
    grenade: false,
    mine: false
  };
  
  // Find enemy groups for grenade usage
  const enemyClusters = [];
  for (let i = 0; i < gameState.enemies.length; i++) {
    if (gameState.enemies[i].health <= 0) continue;
    
    let clusterSize = 1;
    for (let j = i + 1; j < gameState.enemies.length; j++) {
      if (gameState.enemies[j].health <= 0) continue;
      
      const dist = Math.sqrt(
        (gameState.enemies[i].x - gameState.enemies[j].x) ** 2 + 
        (gameState.enemies[i].y - gameState.enemies[j].y) ** 2
      );
      
      if (dist < 100) clusterSize++;
    }
    
    if (clusterSize > 1) {
      enemyClusters.push({ enemy: gameState.enemies[i], size: clusterSize });
    }
  }
  
  if (enemyClusters.length > 0 && gameState.playerGrenades > 0 && testState.timer % 180 === 0) {
    const target = enemyClusters[0].enemy;
    const dx = target.x - gameState.player.x;
    const dy = target.y - gameState.player.y;
    action.aim = Math.atan2(dy, dx);
    action.grenade = true;
  } else if (gameState.playerMines > 0 && testState.timer % 240 === 0) {
    action.mine = true;
  } else {
    // Default to win strategy
    return getTestWinAction(gameState);
  }
  
  return action;
}

function getRandomAction(gameState) {
  const action = {
    move: { left: false, right: false, up: false, down: false },
    aim: null,
    fire: false,
    grenade: false,
    mine: false
  };
  
  // Random movement
  const rand = Math.random();
  if (rand < 0.25) action.move.left = true;
  else if (rand < 0.5) action.move.right = true;
  else if (rand < 0.75) action.move.up = true;
  else action.move.down = true;
  
  action.aim = Math.random() * Math.PI * 2;
  action.fire = Math.random() < 0.1;
  
  return action;
}

export function get_automated_testing_action(gameState) {
  testState.timer++;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestStealthAction(gameState);
    case "TEST_4":
      return getTestCoverAction(gameState);
    case "TEST_5":
      return getTestUtilityAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;