// automated_testing_controller.js - Automated testing
import { gameState, WORLD_NORMAL, WORLD_INNER } from './globals.js';

let testState = {
  targetX: null,
  targetY: null,
  phase: 'explore',
  stuckCounter: 0,
  lastX: 0,
  lastY: 0,
  lastWorld: WORLD_NORMAL,
  interactCooldown: 0,
  switchCooldown: 0
};

function getTestWinAction(gameState) {
  if (!gameState.player) return { left: false, right: false, jump: false, switchWorld: false, interact: false };
  
  const player = gameState.player;
  testState.interactCooldown = Math.max(0, testState.interactCooldown - 1);
  testState.switchCooldown = Math.max(0, testState.switchCooldown - 1);
  
  // Check if stuck
  if (Math.abs(player.x - testState.lastX) < 1 && Math.abs(player.y - testState.lastY) < 1) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastX = player.x;
  testState.lastY = player.y;
  
  // If stuck, try switching worlds or jumping
  if (testState.stuckCounter > 60) {
    testState.stuckCounter = 0;
    if (testState.switchCooldown === 0) {
      testState.switchCooldown = 30;
      return { left: false, right: false, jump: true, switchWorld: true, interact: false };
    }
  }
  
  // Strategy: Collect crystals first, then go to exit
  const action = { left: false, right: false, jump: false, switchWorld: false, interact: false };
  
  // Find nearest uncollected crystal in current world
  let nearestCrystal = null;
  let minDist = Infinity;
  
  for (let crystal of gameState.crystals) {
    if (!crystal.collected && crystal.world === gameState.currentWorld) {
      const dist = Math.abs(crystal.x - player.x) + Math.abs(crystal.y - player.y);
      if (dist < minDist) {
        minDist = dist;
        nearestCrystal = crystal;
      }
    }
  }
  
  // If no crystals in current world, try switching
  if (!nearestCrystal && testState.switchCooldown === 0) {
    // Check if there are crystals in the other world
    const hasOtherWorldCrystals = gameState.crystals.some(
      c => !c.collected && c.world !== gameState.currentWorld
    );
    if (hasOtherWorldCrystals) {
      testState.switchCooldown = 30;
      action.switchWorld = true;
    }
  }
  
  // If all crystals collected, go to exit
  let target = nearestCrystal;
  if (gameState.crystalsCollected === gameState.totalCrystals && gameState.exitPortal) {
    // Check if exit is in current world
    if (gameState.exitPortal.world === gameState.currentWorld) {
      target = gameState.exitPortal;
    } else if (testState.switchCooldown === 0) {
      testState.switchCooldown = 30;
      action.switchWorld = true;
      return action;
    }
  }
  
  if (target) {
    const targetX = target.x;
    const dx = targetX - (player.x + player.width / 2);
    
    // Move towards target
    if (dx < -10) {
      action.left = true;
    } else if (dx > 10) {
      action.right = true;
    }
    
    // Jump if needed
    if (player.onGround) {
      // Jump if there's a gap or obstacle
      if (Math.abs(dx) > 50 || Math.random() < 0.1) {
        action.jump = true;
      }
    }
    
    // Interact with nearby switches
    for (let sw of gameState.switches) {
      if (sw.world !== gameState.currentWorld) continue;
      const swDist = Math.abs(sw.x - player.x) + Math.abs(sw.y - player.y);
      if (swDist < 40 && testState.interactCooldown === 0) {
        action.interact = true;
        testState.interactCooldown = 60;
        break;
      }
    }
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return { left: false, right: false, jump: false, switchWorld: false, interact: false };
  
  const player = gameState.player;
  const action = { left: false, right: false, jump: false, switchWorld: false, interact: false };
  
  // Simple movement pattern
  const time = Math.floor(Date.now() / 1000);
  
  if (time % 8 < 2) {
    action.right = true;
  } else if (time % 8 < 4) {
    action.left = true;
  } else if (time % 8 < 5) {
    action.jump = true;
  } else if (time % 8 < 6) {
    action.switchWorld = true;
  } else if (time % 8 < 7) {
    action.interact = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  const rand = Math.random();
  return {
    left: rand < 0.2,
    right: rand >= 0.2 && rand < 0.4,
    jump: rand >= 0.4 && rand < 0.5,
    switchWorld: rand >= 0.5 && rand < 0.52,
    interact: rand >= 0.52 && rand < 0.54
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestWinAction(gameState); // Block interaction test
    case "TEST_4":
      return getTestWinAction(gameState); // Switch test
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;