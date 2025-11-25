// automated_testing_controller.js
import { gameState } from './globals.js';

let testState = {
  moveHistory: [],
  lastY: 0,
  stuckCounter: 0,
  targetPlatformIndex: 0,
  collectPhase: true
};

function resetTestState() {
  testState = {
    moveHistory: [],
    lastY: 0,
    stuckCounter: 0,
    targetPlatformIndex: 0,
    collectPhase: true
  };
}

function getTestWinAction(gameState) {
  if (!gameState.player) return [];
  
  const player = gameState.player;
  const actions = [];
  
  // Target: Exit at the top
  const exit = gameState.exit;
  if (!exit) return [39]; // Default: move right
  
  // Check if we're near the exit
  const distToExit = Math.abs(player.x - (exit.x + exit.width / 2));
  const heightDiff = player.y - exit.y;
  
  if (distToExit < 50 && heightDiff > -100 && heightDiff < 100) {
    // Near exit - just navigate to it
    if (player.x < exit.x + exit.width / 2) {
      actions.push(39); // RIGHT
    } else if (player.x > exit.x + exit.width / 2) {
      actions.push(37); // LEFT
    }
    
    if (!player.onGround) {
      // In air near exit
      return actions;
    }
    
    if (player.onGround && heightDiff > 20) {
      actions.push(38); // JUMP
    }
    
    return actions;
  }
  
  // Find nearest uncollected pizza
  let nearestPizza = null;
  let minDist = Infinity;
  
  for (let pizza of gameState.pizzas) {
    if (!pizza.collected) {
      const dist = Math.abs(player.x - pizza.x) + Math.abs(player.y - pizza.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPizza = pizza;
      }
    }
  }
  
  // Decide target based on strategy
  let targetX, targetY;
  
  if (nearestPizza && minDist < 300) {
    // Go for nearby pizza
    targetX = nearestPizza.x;
    targetY = nearestPizza.y;
  } else {
    // Head toward exit
    targetX = exit.x + exit.width / 2;
    targetY = exit.y;
  }
  
  // Horizontal movement
  const xDiff = targetX - player.x;
  
  if (Math.abs(xDiff) > 20) {
    if (xDiff > 0) {
      actions.push(39); // RIGHT
    } else {
      actions.push(37); // LEFT
    }
  }
  
  // Check for destructible blocks in the way
  for (let block of gameState.destructibleBlocks) {
    if (block.destroyed) continue;
    
    const distToBlock = Math.abs(player.x - block.x) + Math.abs(player.y - block.y);
    if (distToBlock < 40) {
      // Block nearby - dash through it
      if (Math.abs(player.x - block.x) < 30) {
        actions.push(32); // SPACE (dash)
      }
      // Or ground pound if above
      if (player.y < block.y - 20 && !player.onGround) {
        actions.push(90); // Z (ground pound)
      }
    }
  }
  
  // Jumping logic
  if (player.onGround) {
    const yDiff = player.y - targetY;
    
    // Jump if target is above us
    if (yDiff > 30) {
      actions.push(38); // UP (jump)
    }
    
    // Jump over gaps
    let gapAhead = true;
    for (let platform of gameState.platforms) {
      const futureX = player.x + (xDiff > 0 ? 50 : -50);
      if (futureX > platform.x && futureX < platform.x + platform.width &&
          Math.abs(player.y - platform.y) < 30) {
        gapAhead = false;
        break;
      }
    }
    
    if (gapAhead && Math.abs(xDiff) > 40) {
      actions.push(38); // JUMP
    }
  }
  
  // Track if stuck
  if (Math.abs(player.y - testState.lastY) < 2) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastY = player.y;
  
  // If stuck, try to get unstuck
  if (testState.stuckCounter > 30) {
    actions.push(38); // JUMP
    if (player.onGround) {
      actions.push(32); // DASH
    }
    testState.stuckCounter = 0;
  }
  
  return actions;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return [];
  
  const player = gameState.player;
  const actions = [];
  const frameCount = gameState.frameCount;
  
  // Cycle through basic movements
  const cycle = Math.floor(frameCount / 30) % 6;
  
  switch(cycle) {
    case 0:
      actions.push(39); // Move right
      break;
    case 1:
      actions.push(38); // Jump
      break;
    case 2:
      actions.push(37); // Move left
      break;
    case 3:
      actions.push(38); // Jump
      break;
    case 4:
      actions.push(32); // Dash
      break;
    case 5:
      if (!player.onGround) {
        actions.push(90); // Ground pound
      }
      break;
  }
  
  return actions;
}

function getAbilityTestAction(gameState) {
  if (!gameState.player) return [];
  
  const player = gameState.player;
  const actions = [];
  const frameCount = gameState.frameCount;
  
  // Test abilities in sequence
  const phase = Math.floor(frameCount / 60) % 4;
  
  switch(phase) {
    case 0:
      // Test dash
      actions.push(39); // Move right
      if (frameCount % 60 === 30) {
        actions.push(32); // Dash
      }
      break;
    case 1:
      // Test ground pound
      if (player.onGround) {
        actions.push(38); // Jump
      } else if (player.y < 300) {
        actions.push(90); // Ground pound
      }
      break;
    case 2:
      // Test jumping
      if (player.onGround && frameCount % 30 === 0) {
        actions.push(38); // Jump
      }
      actions.push(37); // Move left
      break;
    case 3:
      // Combined movement
      actions.push(39); // Move right
      if (player.onGround && frameCount % 40 === 0) {
        actions.push(38); // Jump
      }
      break;
  }
  
  return actions;
}

function getEdgeCaseTestAction(gameState) {
  if (!gameState.player) return [];
  
  const player = gameState.player;
  const actions = [];
  
  // Test: Try to fall off deliberately
  if (player.y < 350) {
    // Move toward edge
    if (player.x > 300) {
      actions.push(37); // Move left toward edge
    } else {
      actions.push(39); // Move right toward edge
    }
    
    // Try to go off platform
    if (player.onGround) {
      actions.push(37); // Keep moving
    }
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.3) {
    actions.push(39); // RIGHT
  } else if (rand < 0.6) {
    actions.push(37); // LEFT
  }
  
  if (Math.random() < 0.1) {
    actions.push(38); // JUMP
  }
  
  if (Math.random() < 0.05) {
    actions.push(32); // DASH
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return [];
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAbilityTestAction(gameState);
    case "TEST_4":
      return getEdgeCaseTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;