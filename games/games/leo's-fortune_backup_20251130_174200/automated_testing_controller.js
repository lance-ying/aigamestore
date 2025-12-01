// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

let actionHistory = [];
let stuckCounter = 0;
let lastPosition = { x: 0, y: 0 };

function getTestBasicAction(gs) {
  // Test basic movement and mechanics
  const player = gs.player;
  if (!player || !player.alive) return [];

  const frame = window.gameInstance.frameCount;
  const actions = [];

  // Cycle through different actions
  const cycle = Math.floor(frame / 60) % 10;

  switch(cycle) {
    case 0:
    case 1:
      actions.push(39); // RIGHT
      break;
    case 2:
      actions.push(32); // JUMP
      break;
    case 3:
    case 4:
      actions.push(37); // LEFT
      break;
    case 5:
      actions.push(38); // UP (inflate)
      actions.push(39); // RIGHT
      break;
    case 6:
      actions.push(40); // DOWN (deflate)
      break;
    case 7:
      actions.push(32); // JUMP
      actions.push(39); // RIGHT
      break;
    case 8:
      actions.push(38); // UP
      actions.push(32); // JUMP
      break;
    case 9:
      actions.push(40); // DOWN
      actions.push(37); // LEFT
      break;
  }

  return actions;
}

function getTestWinAction(gs) {
  // Optimal strategy to win the game
  const player = gs.player;
  if (!player || !player.alive) return [];

  const actions = [];
  
  // Check if stuck
  const distMoved = Math.abs(player.x - lastPosition.x) + Math.abs(player.y - lastPosition.y);
  if (distMoved < 1) {
    stuckCounter++;
  } else {
    stuckCounter = 0;
  }
  lastPosition = { x: player.x, y: player.y };

  // If stuck, try to get unstuck
  if (stuckCounter > 30) {
    actions.push(32); // JUMP
    actions.push(38); // INFLATE
    if (Math.random() > 0.5) {
      actions.push(39); // RIGHT
    } else {
      actions.push(37); // LEFT
    }
    if (stuckCounter > 60) {
      stuckCounter = 0;
    }
    return actions;
  }

  // Find nearest uncollected coin
  let nearestCoin = null;
  let minDist = Infinity;
  
  for (let coin of gs.coins) {
    if (!coin.collected) {
      const dist = Math.abs(coin.x - player.x) + Math.abs(coin.y - player.y);
      if (dist < minDist) {
        minDist = dist;
        nearestCoin = coin;
      }
    }
  }

  // If all coins collected, go to exit
  if (!nearestCoin && gs.exitPortal) {
    nearestCoin = { x: gs.exitPortal.x + 25, y: gs.exitPortal.y + 40 };
  }

  if (nearestCoin) {
    const dx = nearestCoin.x - player.x;
    const dy = nearestCoin.y - player.y;

    // Horizontal movement
    if (Math.abs(dx) > 20) {
      if (dx > 0) {
        actions.push(39); // RIGHT
      } else {
        actions.push(37); // LEFT
      }
    }

    // Vertical movement
    if (dy < -30 && player.grounded) {
      actions.push(32); // JUMP
    }

    // Use inflation for floating
    if (dy < -50 && !player.grounded) {
      actions.push(38); // INFLATE
    }

    // Use deflation for falling faster when above target
    if (dy > 50 && !player.grounded) {
      actions.push(40); // DEFLATE
    }

    // Jump over obstacles
    if (Math.abs(dx) < 100 && Math.abs(dy) < 50) {
      let obstacleAhead = false;
      for (let hazard of gs.hazards) {
        if (Math.abs(hazard.x - player.x) < 80 && Math.abs(hazard.y - player.y) < 50) {
          obstacleAhead = true;
          break;
        }
      }
      
      if (obstacleAhead && player.grounded) {
        actions.push(32); // JUMP
        actions.push(38); // INFLATE
      }
    }
  } else {
    // Default: move right
    actions.push(39);
  }

  return actions;
}

function getTestHazardAction(gs) {
  // Test hazard collision detection
  const player = gs.player;
  if (!player || !player.alive) return [];

  const frame = window.gameInstance.frameCount;
  
  // Move towards nearest hazard to test collision
  if (gs.hazards.length > 0) {
    const hazard = gs.hazards[0];
    const dx = hazard.x - player.x;
    
    if (Math.abs(dx) > 30) {
      return dx > 0 ? [39] : [37]; // Move towards hazard
    } else {
      return [32]; // Jump when near
    }
  }
  
  return [39]; // Default move right
}

function getTestCoinAction(gs) {
  // Test coin collection
  const player = gs.player;
  if (!player || !player.alive) return [];

  // Find nearest uncollected coin
  let nearestCoin = null;
  let minDist = Infinity;
  
  for (let coin of gs.coins) {
    if (!coin.collected) {
      const dist = Math.sqrt(
        Math.pow(coin.x - player.x, 2) + 
        Math.pow(coin.y - player.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestCoin = coin;
      }
    }
  }

  if (nearestCoin) {
    const actions = [];
    const dx = nearestCoin.x - player.x;
    const dy = nearestCoin.y - player.y;

    if (Math.abs(dx) > 10) {
      actions.push(dx > 0 ? 39 : 37);
    }

    if (dy < -20 && player.grounded) {
      actions.push(32); // JUMP
    }

    return actions;
  }

  return [];
}

function getTestProgressionAction(gs) {
  // Test level progression
  return getTestWinAction(gs); // Same as win strategy
}

function getRandomAction(gs) {
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.3) actions.push(39); // RIGHT
  else if (rand < 0.5) actions.push(37); // LEFT
  
  if (Math.random() < 0.1) actions.push(32); // JUMP
  if (Math.random() < 0.05) actions.push(38); // INFLATE
  if (Math.random() < 0.05) actions.push(40); // DEFLATE
  
  return actions;
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getTestHazardAction(gs);
    case "TEST_4":
      return getTestCoinAction(gs);
    case "TEST_5":
      return getTestProgressionAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;