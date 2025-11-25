// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';

let testState = {
  currentTarget: null,
  targetType: null, // "package", "customer", "treasure"
  stuckCounter: 0,
  lastPosition: { x: 0, y: 0 },
  explorationIndex: 0,
  strategy: "explore"
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const action = {
    left: false,
    right: false,
    jump: false,
    sprint: true,
    interact: false
  };
  
  // Check if stuck
  const distMoved = Math.abs(player.x - testState.lastPosition.x) + 
                   Math.abs(player.y - testState.lastPosition.y);
  
  if (distMoved < 1) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  
  testState.lastPosition = { x: player.x, y: player.y };
  
  // If stuck, jump
  if (testState.stuckCounter > 30) {
    action.jump = true;
    testState.stuckCounter = 0;
  }
  
  // Priority: Pick up package -> Deliver -> Collect treasures
  
  // If holding package, deliver it
  if (player.holdingPackage) {
    const pkg = player.holdingPackage;
    const customer = gameState.customers[pkg.destinationId];
    
    if (customer) {
      testState.currentTarget = customer;
      testState.targetType = "customer";
      
      const dx = customer.x - player.x;
      const dy = customer.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 60) {
        action.interact = true;
        testState.currentTarget = null;
      } else {
        if (dx > 10) {
          action.right = true;
        } else if (dx < -10) {
          action.left = true;
        }
        
        // Jump over obstacles
        if (Math.abs(dx) < 100 && dy < -20) {
          action.jump = true;
        }
      }
      
      return action;
    }
  }
  
  // Find nearest available package
  let nearestPackage = null;
  let nearestPackageDist = Infinity;
  
  for (let pkg of gameState.packages) {
    if (!pkg.pickedUp && !pkg.delivered) {
      const dx = pkg.x - player.x;
      const dy = pkg.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestPackageDist) {
        nearestPackageDist = distance;
        nearestPackage = pkg;
      }
    }
  }
  
  if (nearestPackage && nearestPackageDist < 500) {
    testState.currentTarget = nearestPackage;
    testState.targetType = "package";
    
    const dx = nearestPackage.x - player.x;
    const dy = nearestPackage.y - player.y;
    
    if (nearestPackageDist < 50) {
      action.interact = true;
    }
    
    if (dx > 5) {
      action.right = true;
    } else if (dx < -5) {
      action.left = true;
    }
    
    // Jump to reach elevated packages
    if (Math.abs(dx) < 80 && dy < -20) {
      action.jump = true;
    }
    
    return action;
  }
  
  // Collect treasures
  let nearestTreasure = null;
  let nearestTreasureDist = Infinity;
  
  for (let treasure of gameState.treasures) {
    if (!treasure.collected) {
      const dx = treasure.x - player.x;
      const dy = treasure.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestTreasureDist) {
        nearestTreasureDist = distance;
        nearestTreasure = treasure;
      }
    }
  }
  
  if (nearestTreasure) {
    testState.currentTarget = nearestTreasure;
    testState.targetType = "treasure";
    
    const dx = nearestTreasure.x - player.x;
    const dy = nearestTreasure.y - player.y;
    
    if (dx > 5) {
      action.right = true;
    } else if (dx < -5) {
      action.left = true;
    }
    
    // Jump to reach elevated treasures
    if (Math.abs(dx) < 80 && dy < -20) {
      action.jump = true;
    }
    
    return action;
  }
  
  // Default: explore right
  action.right = true;
  
  return action;
}

function getMovementTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const action = {
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false
  };
  
  const time = Math.floor(gameState.worldTime / 60);
  const phase = time % 8;
  
  switch(phase) {
    case 0: // Move right
      action.right = true;
      break;
    case 1: // Jump right
      action.right = true;
      action.jump = true;
      break;
    case 2: // Sprint right
      action.right = true;
      action.sprint = true;
      break;
    case 3: // Jump
      action.jump = true;
      break;
    case 4: // Move left
      action.left = true;
      break;
    case 5: // Jump left
      action.left = true;
      action.jump = true;
      break;
    case 6: // Sprint left
      action.left = true;
      action.sprint = true;
      break;
    case 7: // Interact
      action.interact = true;
      break;
  }
  
  return action;
}

function getJobTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const action = {
    left: false,
    right: false,
    jump: false,
    sprint: true,
    interact: false
  };
  
  // Focus only on deliveries, ignore treasures
  
  if (player.holdingPackage) {
    const pkg = player.holdingPackage;
    const customer = gameState.customers[pkg.destinationId];
    
    if (customer) {
      const dx = customer.x - player.x;
      const dy = customer.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 60) {
        action.interact = true;
      } else {
        if (dx > 10) action.right = true;
        else if (dx < -10) action.left = true;
        
        if (Math.abs(dx) < 100 && dy < -20) action.jump = true;
      }
    }
    return action;
  }
  
  // Find nearest package
  let nearestPackage = null;
  let nearestDist = Infinity;
  
  for (let pkg of gameState.packages) {
    if (!pkg.pickedUp && !pkg.delivered) {
      const distance = Math.sqrt(
        Math.pow(pkg.x - player.x, 2) + 
        Math.pow(pkg.y - player.y, 2)
      );
      
      if (distance < nearestDist) {
        nearestDist = distance;
        nearestPackage = pkg;
      }
    }
  }
  
  if (nearestPackage) {
    const dx = nearestPackage.x - player.x;
    const dy = nearestPackage.y - player.y;
    
    if (nearestDist < 50) action.interact = true;
    if (dx > 5) action.right = true;
    else if (dx < -5) action.left = true;
    
    if (Math.abs(dx) < 80 && dy < -20) action.jump = true;
  }
  
  return action;
}

function getTreasureTestAction(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const action = {
    left: false,
    right: false,
    jump: false,
    sprint: true,
    interact: false
  };
  
  // Focus only on treasures
  let nearestTreasure = null;
  let nearestDist = Infinity;
  
  for (let treasure of gameState.treasures) {
    if (!treasure.collected) {
      const distance = Math.sqrt(
        Math.pow(treasure.x - player.x, 2) + 
        Math.pow(treasure.y - player.y, 2)
      );
      
      if (distance < nearestDist) {
        nearestDist = distance;
        nearestTreasure = treasure;
      }
    }
  }
  
  if (nearestTreasure) {
    const dx = nearestTreasure.x - player.x;
    const dy = nearestTreasure.y - player.y;
    
    if (dx > 5) action.right = true;
    else if (dx < -5) action.left = true;
    
    if (Math.abs(dx) < 80 && dy < -20) action.jump = true;
  } else {
    // Explore
    action.right = true;
    if (Math.random() < 0.1) action.jump = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    jump: Math.random() < 0.1,
    sprint: Math.random() < 0.5,
    interact: Math.random() < 0.1
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getMovementTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getJobTestAction(gameState);
    case "TEST_4":
      return getTreasureTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;