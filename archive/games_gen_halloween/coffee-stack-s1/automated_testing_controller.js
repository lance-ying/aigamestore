// automated_testing_controller.js - Automated testing controller

import { 
  gameState, CANVAS_WIDTH, NUM_LANES, LANE_WIDTH,
  ITEM_CUP, ITEM_COFFEE, ITEM_MILK, ITEM_SLEEVE, ITEM_LID
} from './globals.js';

let lastAction = { left: false, right: false, boost: false, dodgeLeft: false, dodgeRight: false };
let targetLane = 2;
let recentPositions = [];
let stuckCounter = 0;

function getTestWinAction(state) {
  const player = state.player;
  if (!player) return getRandomAction(state);
  
  const currentLane = player.currentLane;
  
  // Find nearest valuable collectible
  let nearestItem = null;
  let nearestDist = Infinity;
  
  for (const collectible of state.collectibles) {
    if (collectible.collected) continue;
    
    const screenY = collectible.y - state.scrollOffset;
    if (screenY < 0 || screenY > 500) continue;
    
    // Prioritize based on what we need
    let priority = 0;
    const stack = player.stack;
    
    if (collectible.type === ITEM_CUP) {
      priority = 100;
    } else if (collectible.type === ITEM_COFFEE || collectible.type === ITEM_MILK) {
      // Check if we have cups without coffee
      const needsCoffee = stack.some(cup => !cup.hasCoffee);
      priority = needsCoffee ? 90 : 20;
    } else if (collectible.type === ITEM_SLEEVE) {
      const needsSleeve = stack.some(cup => cup.hasCoffee && !cup.hasSleeve);
      priority = needsSleeve ? 80 : 15;
    } else if (collectible.type === ITEM_LID) {
      const needsLid = stack.some(cup => cup.hasCoffee && !cup.hasLid);
      priority = needsLid ? 85 : 10;
    }
    
    const dist = screenY - 50 + Math.abs(collectible.lane - currentLane) * 30;
    const score = priority - dist * 0.5;
    
    if (score > nearestDist) {
      nearestDist = score;
      nearestItem = collectible;
    }
  }
  
  // Check for obstacles to avoid
  let nearestObstacle = null;
  let obstacleDist = Infinity;
  
  for (const obstacle of state.obstacles) {
    if (obstacle.hit) continue;
    
    const screenY = obstacle.y - state.scrollOffset;
    if (screenY < -50 || screenY > 400) continue;
    
    const dist = Math.abs(screenY - player.y) + Math.abs(obstacle.lane - currentLane) * 20;
    if (dist < obstacleDist) {
      obstacleDist = dist;
      nearestObstacle = obstacle;
    }
  }
  
  // Decision making
  let action = { left: false, right: false, boost: false, dodgeLeft: false, dodgeRight: false };
  
  // Avoid obstacles first
  if (nearestObstacle && obstacleDist < 150) {
    const obstacleLane = nearestObstacle.lane;
    const screenY = nearestObstacle.y - state.scrollOffset;
    
    if (Math.abs(obstacleLane - currentLane) <= 0 && screenY < 150) {
      // Obstacle in our lane, dodge!
      if (currentLane > 0 && (currentLane >= NUM_LANES - 1 || Math.random() > 0.5)) {
        targetLane = currentLane - 1;
        action.dodgeLeft = true;
      } else if (currentLane < NUM_LANES - 1) {
        targetLane = currentLane + 1;
        action.dodgeRight = true;
      }
    }
  }
  
  // Navigate to collectibles
  if (nearestItem && !action.dodgeLeft && !action.dodgeRight) {
    targetLane = nearestItem.lane;
    
    if (currentLane < targetLane) {
      action.right = true;
    } else if (currentLane > targetLane) {
      action.left = true;
    }
    
    // Use boost if safe
    const screenY = nearestItem.y - state.scrollOffset;
    if (screenY > 100 && screenY < 300 && player.energy > 50) {
      action.boost = true;
    }
  }
  
  lastAction = action;
  return action;
}

function getBasicTestAction(state) {
  const player = state.player;
  if (!player) return getRandomAction(state);
  
  const currentLane = player.currentLane;
  
  // Simple pattern: collect items, avoid obstacles
  let nearestItem = null;
  let nearestDist = Infinity;
  
  for (const collectible of state.collectibles) {
    if (collectible.collected) continue;
    const screenY = collectible.y - state.scrollOffset;
    if (screenY < 0 || screenY > 400) continue;
    
    const dist = screenY + Math.abs(collectible.lane - currentLane) * 50;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestItem = collectible;
    }
  }
  
  let action = { left: false, right: false, boost: false, dodgeLeft: false, dodgeRight: false };
  
  if (nearestItem) {
    if (currentLane < nearestItem.lane) {
      action.right = true;
    } else if (currentLane > nearestItem.lane) {
      action.left = true;
    }
  } else {
    // Random movement
    if (Math.random() > 0.98) {
      action.right = currentLane < NUM_LANES - 1;
    } else if (Math.random() > 0.98) {
      action.left = currentLane > 0;
    }
  }
  
  return action;
}

function getDefensiveAction(state) {
  const player = state.player;
  if (!player) return getRandomAction(state);
  
  const currentLane = player.currentLane;
  
  // Focus on avoiding obstacles
  let nearestObstacle = null;
  let obstacleDist = Infinity;
  
  for (const obstacle of state.obstacles) {
    if (obstacle.hit) continue;
    const screenY = obstacle.y - state.scrollOffset;
    if (screenY < 0 || screenY > 300) continue;
    
    const dist = Math.abs(screenY - 100) + Math.abs(obstacle.lane - currentLane) * 30;
    if (dist < obstacleDist) {
      obstacleDist = dist;
      nearestObstacle = obstacle;
    }
  }
  
  let action = { left: false, right: false, boost: false, dodgeLeft: false, dodgeRight: false };
  
  if (nearestObstacle && obstacleDist < 200) {
    if (nearestObstacle.lane === currentLane) {
      // Move away
      if (currentLane > NUM_LANES / 2) {
        action.left = true;
      } else {
        action.right = true;
      }
    }
  } else {
    // Collect safe items
    for (const collectible of state.collectibles) {
      if (collectible.collected) continue;
      const screenY = collectible.y - state.scrollOffset;
      if (screenY > 50 && screenY < 200 && collectible.type === ITEM_CUP) {
        if (currentLane < collectible.lane) action.right = true;
        else if (currentLane > collectible.lane) action.left = true;
        break;
      }
    }
  }
  
  return action;
}

function getRandomAction(state) {
  const rand = Math.random();
  return {
    left: rand < 0.1,
    right: rand > 0.9,
    boost: rand > 0.95,
    dodgeLeft: false,
    dodgeRight: false
  };
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    case "TEST_3":
      return getDefensiveAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;